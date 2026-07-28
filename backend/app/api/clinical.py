import logging
from datetime import datetime
from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from marshmallow import ValidationError
from app.api import clinical_bp
from app.models.appointment import Appointment
from app.models.consultation import ConsultationNote
from app.models.lab import LabRequest, LabResult
from app.models.patient import Patient
from app.models.user import User
from app.services.audit_service import record_audit
from app.services.notification_service import create_notification
from app.middleware.auth import require_roles, get_current_user_clinic_id
from app.extensions import limiter
from app.schemas.validators import (
    AppointmentCreateSchema, AppointmentStatusSchema,
    ConsultationNoteCreateSchema, LabRequestCreateSchema, LabResultCreateSchema
)

logger = logging.getLogger(__name__)

appointment_create_schema = AppointmentCreateSchema()
appointment_status_schema = AppointmentStatusSchema()
consultation_note_schema = ConsultationNoteCreateSchema()
lab_request_schema = LabRequestCreateSchema()
lab_result_schema = LabResultCreateSchema()


@clinical_bp.route('/appointments', methods=['POST'])
@jwt_required()
@require_roles('CLINIC_STAFF', 'ADMIN')
@limiter.limit("30 per minute")
def create_appointment():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    try:
        validated = appointment_create_schema.load(data)
    except ValidationError as err:
        return jsonify({'error': 'Validation failed', 'details': err.messages}), 400

    user_role = get_jwt().get('role', '')
    clinic_id = get_current_user_clinic_id()

    if user_role != 'ADMIN' and clinic_id and validated.get('clinic_id') != clinic_id:
        return jsonify({'error': 'Cannot create appointment for another clinic'}), 403

    try:
        appointment = Appointment.create(
            patient_id=validated['patient_id'],
            clinic_id=validated['clinic_id'],
            specialist_id=validated['specialist_id'],
            appointment_time=validated['appointment_time'],
            status='REQUESTED',
            created_by=get_jwt_identity()
        )

        identity = get_jwt_identity()
        record_audit(int(identity), 'APPOINTMENT_CREATED', 'appointments', appointment.id)

        create_notification(
            validated['specialist_id'],
            'New Appointment Request',
            f'You have a new appointment request from clinic',
            validated['patient_id']
        )
    except Exception as e:
        logger.error("Failed to create appointment: %s", e)
        return jsonify({'error': 'Failed to create appointment'}), 500

    return jsonify({
        'message': 'Appointment created successfully',
        'appointment': appointment.to_dict()
    }), 201


@clinical_bp.route('/appointments/<int:appointment_id>/status', methods=['PATCH'])
@jwt_required()
@require_roles('SPECIALIST', 'ADMIN')
@limiter.limit("30 per minute")
def update_appointment_status(appointment_id):
    appointment = Appointment.get_or_none(Appointment.id == appointment_id)
    if not appointment:
        return jsonify({'error': 'Appointment not found'}), 404

    user_role = get_jwt().get('role', '')
    identity = int(get_jwt_identity())

    if user_role != 'ADMIN' and appointment.specialist_id != identity:
        return jsonify({'error': 'Access denied: you can only update your own appointments'}), 403

    data = request.get_json()
    if not data or 'status' not in data:
        return jsonify({'error': 'Status is required'}), 400

    try:
        validated = appointment_status_schema.load(data)
    except ValidationError as err:
        return jsonify({'error': 'Validation failed', 'details': err.messages}), 400

    try:
        appointment.status = validated['status']
        if 'video_room_url' in validated:
            appointment.video_room_url = validated['video_room_url']
        appointment.save()

        record_audit(identity, 'APPOINTMENT_STATUS_UPDATED', 'appointments', appointment_id, {'status': validated['status']})
    except Exception as e:
        logger.error("Failed to update appointment %s status: %s", appointment_id, e)
        return jsonify({'error': 'Failed to update appointment status'}), 500

    return jsonify({
        'message': 'Appointment status updated',
        'appointment': appointment.to_dict()
    }), 200


@clinical_bp.route('/appointments/<int:appointment_id>', methods=['GET'])
@jwt_required()
@require_roles('CLINIC_STAFF', 'SPECIALIST', 'ADMIN')
@limiter.limit("60 per minute")
def get_appointment(appointment_id):
    appointment = Appointment.get_or_none(Appointment.id == appointment_id)
    if not appointment or appointment.is_deleted:
        return jsonify({'error': 'Appointment not found'}), 404

    user_role = get_jwt().get('role', '')
    clinic_id = get_current_user_clinic_id()
    identity = int(get_jwt_identity())

    if user_role != 'ADMIN':
        if user_role == 'SPECIALIST' and appointment.specialist_id != identity:
            return jsonify({'error': 'Access denied'}), 403
        elif user_role != 'SPECIALIST' and clinic_id and appointment.clinic_id != clinic_id:
            return jsonify({'error': 'Access denied'}), 403

    return jsonify({'appointment': appointment.to_dict()}), 200


@clinical_bp.route('/appointments', methods=['GET'])
@jwt_required()
@require_roles('CLINIC_STAFF', 'SPECIALIST', 'ADMIN')
@limiter.limit("60 per minute")
def list_appointments():
    status = request.args.get('status')
    specialist_id = request.args.get('specialist_id')
    patient_id = request.args.get('patient_id')
    page = int(request.args.get('page', 1))
    per_page = min(int(request.args.get('per_page', 50)), 100)

    query = Appointment.select().where(Appointment.is_deleted == False)

    user_role = get_jwt().get('role', '')
    clinic_id = get_current_user_clinic_id()
    identity = int(get_jwt_identity())

    if user_role == 'SPECIALIST':
        query = query.where(Appointment.specialist_id == identity)
    elif user_role != 'ADMIN' and clinic_id:
        query = query.where(Appointment.clinic_id == clinic_id)

    if status:
        query = query.where(Appointment.status == status)
    if specialist_id and user_role == 'ADMIN':
        query = query.where(Appointment.specialist_id == specialist_id)
    if patient_id:
        query = query.where(Appointment.patient_id == patient_id)

    total = query.count()
    total_pages = (total + per_page - 1) // per_page if total > 0 else 1
    appointments = query.order_by(Appointment.appointment_time.desc()).paginate(page, per_page)

    return jsonify({
        'appointments': [a.to_dict() for a in appointments],
        'total': total,
        'page': page,
        'per_page': per_page,
        'total_pages': total_pages
    }), 200


@clinical_bp.route('/consultation-notes', methods=['POST'])
@jwt_required()
@require_roles('SPECIALIST')
@limiter.limit("20 per minute")
def create_consultation_note():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    try:
        validated = consultation_note_schema.load(data)
    except ValidationError as err:
        return jsonify({'error': 'Validation failed', 'details': err.messages}), 400

    appointment = Appointment.get_or_none(Appointment.id == validated['appointment_id'])
    if not appointment:
        return jsonify({'error': 'Appointment not found'}), 404

    identity = int(get_jwt_identity())
    if appointment.specialist_id != identity:
        return jsonify({'error': 'Access denied: you can only add notes to your own appointments'}), 403

    try:
        note = ConsultationNote.create(
            appointment_id=validated['appointment_id'],
            specialist_id=identity,
            diagnosis=validated['diagnosis'],
            recommendations=validated.get('recommendations'),
            referral_notes=validated.get('referral_notes'),
            treatment_instructions=validated.get('treatment_instructions')
        )

        appointment.status = 'COMPLETED'
        appointment.save()

        record_audit(identity, 'CONSULTATION_NOTE_CREATED', 'consultation_notes', note.id)

        create_notification(
            appointment.clinic_id,
            'Consultation Completed',
            f'Consultation note has been recorded',
            appointment.patient_id
        )
    except Exception as e:
        logger.error("Failed to create consultation note: %s", e)
        return jsonify({'error': 'Failed to create consultation note'}), 500

    return jsonify({
        'message': 'Consultation note created',
        'note': note.to_dict()
    }), 201


@clinical_bp.route('/lab-requests', methods=['POST'])
@jwt_required()
@require_roles('CLINIC_STAFF', 'SPECIALIST', 'ADMIN')
@limiter.limit("30 per minute")
def create_lab_request():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    try:
        validated = lab_request_schema.load(data)
    except ValidationError as err:
        return jsonify({'error': 'Validation failed', 'details': err.messages}), 400

    try:
        lab_request = LabRequest.create(
            patient_id=validated['patient_id'],
            requested_by=get_jwt_identity(),
            test_type=validated['test_type'],
            clinical_reason=validated.get('clinical_reason'),
            status='REQUESTED'
        )

        identity = get_jwt_identity()
        record_audit(int(identity), 'LAB_REQUEST_CREATED', 'lab_requests', lab_request.id)
    except Exception as e:
        logger.error("Failed to create lab request: %s", e)
        return jsonify({'error': 'Failed to create lab request'}), 500

    return jsonify({
        'message': 'Lab request created',
        'lab_request': lab_request.to_dict()
    }), 201


@clinical_bp.route('/lab-requests', methods=['GET'])
@jwt_required()
@require_roles('CLINIC_STAFF', 'SPECIALIST', 'LAB_OFFICER', 'ADMIN')
@limiter.limit("60 per minute")
def list_lab_requests():
    status = request.args.get('status')
    patient_id = request.args.get('patient_id')
    page = int(request.args.get('page', 1))
    per_page = min(int(request.args.get('per_page', 50)), 100)

    query = LabRequest.select().where(LabRequest.is_deleted == False)

    user_role = get_jwt().get('role', '')
    clinic_id = get_current_user_clinic_id()

    if user_role == 'LAB_OFFICER':
        pass
    elif user_role != 'ADMIN' and clinic_id:
        query = query.where(LabRequest.patient_id << 
            Patient.select(Patient.id).where(Patient.clinic_id == clinic_id))

    if status:
        query = query.where(LabRequest.status == status)
    if patient_id:
        query = query.where(LabRequest.patient_id == patient_id)

    total = query.count()
    total_pages = (total + per_page - 1) // per_page if total > 0 else 1
    lab_requests = query.order_by(LabRequest.created_at.desc()).paginate(page, per_page)

    return jsonify({
        'lab_requests': [lr.to_dict() for lr in lab_requests],
        'total': total,
        'page': page,
        'per_page': per_page,
        'total_pages': total_pages
    }), 200


@clinical_bp.route('/lab-results', methods=['POST'])
@jwt_required()
@require_roles('LAB_OFFICER')
@limiter.limit("20 per minute")
def create_lab_result():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    try:
        validated = lab_result_schema.load(data)
    except ValidationError as err:
        return jsonify({'error': 'Validation failed', 'details': err.messages}), 400

    lab_request = LabRequest.get_or_none(LabRequest.id == validated['lab_request_id'])
    if not lab_request:
        return jsonify({'error': 'Lab request not found'}), 404

    try:
        lab_result = LabResult.create(
            lab_request_id=validated['lab_request_id'],
            uploaded_by=get_jwt_identity(),
            result_summary=validated['result_summary'],
            file_url=validated.get('file_url')
        )

        lab_request.status = 'RESULT_UPLOADED'
        lab_request.save()

        identity = get_jwt_identity()
        record_audit(int(identity), 'LAB_RESULT_UPLOADED', 'lab_results', lab_result.id)

        create_notification(
            lab_request.requested_by_id,
            'Lab Results Available',
            f'Lab results for {lab_request.test_type} are now available',
            lab_request.patient_id
        )
    except Exception as e:
        logger.error("Failed to create lab result: %s", e)
        return jsonify({'error': 'Failed to upload lab result'}), 500

    return jsonify({
        'message': 'Lab result uploaded',
        'lab_result': lab_result.to_dict()
    }), 201


@clinical_bp.route('/lab-results', methods=['GET'])
@jwt_required()
@require_roles('CLINIC_STAFF', 'SPECIALIST', 'LAB_OFFICER', 'ADMIN')
@limiter.limit("60 per minute")
def list_lab_results():
    lab_request_id = request.args.get('lab_request_id')
    patient_id = request.args.get('patient_id')
    page = int(request.args.get('page', 1))
    per_page = min(int(request.args.get('per_page', 50)), 100)

    query = LabResult.select().where(LabResult.is_deleted == False)

    user_role = get_jwt().get('role', '')
    clinic_id = get_current_user_clinic_id()

    if user_role == 'LAB_OFFICER':
        pass
    elif user_role != 'ADMIN' and clinic_id:
        query = query.where(LabResult.lab_request_id <<
            LabRequest.select(LabRequest.id).where(
                LabRequest.patient_id <<
                Patient.select(Patient.id).where(Patient.clinic_id == clinic_id)
            ))

    if lab_request_id:
        query = query.where(LabResult.lab_request_id == lab_request_id)
    if patient_id:
        query = query.join(LabRequest).where(LabRequest.patient_id == patient_id)

    total = query.count()
    total_pages = (total + per_page - 1) // per_page if total > 0 else 1
    lab_results = query.order_by(LabResult.created_at.desc()).paginate(page, per_page)

    return jsonify({
        'lab_results': [lr.to_dict() for lr in lab_results],
        'total': total,
        'page': page,
        'per_page': per_page,
        'total_pages': total_pages
    }), 200


@clinical_bp.route('/specialists', methods=['GET'])
@jwt_required()
@require_roles('CLINIC_STAFF', 'ADMIN')
@limiter.limit("30 per minute")
def list_specialists():
    speciality = request.args.get('speciality')
    page = int(request.args.get('page', 1))
    per_page = min(int(request.args.get('per_page', 50)), 100)

    query = User.select().where(
        (User.role == 'SPECIALIST') &
        (User.active == True) &
        (User.is_deleted == False)
    )

    if speciality:
        query = query.where(User.speciality.ilike(f'%{speciality}%'))

    total = query.count()
    total_pages = (total + per_page - 1) // per_page if total > 0 else 1
    specialists = query.order_by(User.full_name.asc()).paginate(page, per_page)

    return jsonify({
        'specialists': [s.to_dict() for s in specialists],
        'total': total,
        'page': page,
        'per_page': per_page,
        'total_pages': total_pages
    }), 200
