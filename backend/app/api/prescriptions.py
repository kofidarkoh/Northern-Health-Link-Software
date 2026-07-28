import logging
from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from marshmallow import ValidationError
from app.api import prescriptions_bp
from app.models.prescription import Prescription
from app.models.patient import Patient
from app.models.consultation import ConsultationNote
from app.services.audit_service import record_audit
from app.services.notification_service import create_notification
from app.middleware.auth import require_roles, get_current_user_clinic_id
from app.extensions import limiter
from app.schemas.validators import PrescriptionCreateSchema

logger = logging.getLogger(__name__)

prescription_create_schema = PrescriptionCreateSchema()


@prescriptions_bp.route('/', methods=['POST'])
@jwt_required()
@require_roles('SPECIALIST')
@limiter.limit("20 per minute")
def create_prescription():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    try:
        validated = prescription_create_schema.load(data)
    except ValidationError as err:
        return jsonify({'error': 'Validation failed', 'details': err.messages}), 400

    patient = Patient.get_or_none(Patient.id == validated['patient_id'])
    if not patient:
        return jsonify({'error': 'Patient not found'}), 404

    identity = int(get_jwt_identity())

    if validated.get('consultation_note_id'):
        note = ConsultationNote.get_or_none(ConsultationNote.id == validated['consultation_note_id'])
        if not note:
            return jsonify({'error': 'Consultation note not found'}), 404
        if note.specialist_id != identity:
            return jsonify({'error': 'Access denied: consultation note belongs to another specialist'}), 403

    try:
        prescription = Prescription.create(
            patient_id=validated['patient_id'],
            consultation_note_id=validated.get('consultation_note_id'),
            prescribed_by=identity,
            medication_name=validated['medication_name'],
            dosage=validated['dosage'],
            frequency=validated.get('frequency'),
            duration=validated.get('duration'),
            instructions=validated.get('instructions')
        )

        record_audit(identity, 'PRESCRIPTION_CREATED', 'prescriptions', prescription.id)

        create_notification(
            patient.registered_by_id,
            'New Prescription',
            f'Prescription created for {patient.full_name}',
            patient.id
        )
    except Exception as e:
        logger.error("Failed to create prescription: %s", e)
        return jsonify({'error': 'Failed to create prescription'}), 500

    return jsonify({
        'message': 'Prescription created',
        'prescription': prescription.to_dict()
    }), 201


@prescriptions_bp.route('/<int:prescription_id>', methods=['GET'])
@jwt_required()
@require_roles('CLINIC_STAFF', 'SPECIALIST', 'ADMIN')
@limiter.limit("60 per minute")
def get_prescription(prescription_id):
    prescription = Prescription.get_or_none(Prescription.id == prescription_id)
    if not prescription:
        return jsonify({'error': 'Prescription not found'}), 404

    user_role = get_jwt().get('role', '')
    clinic_id = get_current_user_clinic_id()

    if user_role != 'ADMIN' and clinic_id:
        patient = Patient.get_or_none(Patient.id == prescription.patient_id)
        if not patient or patient.clinic_id != clinic_id:
            return jsonify({'error': 'Access denied: prescription belongs to another clinic'}), 403

    identity = get_jwt_identity()
    record_audit(int(identity), 'PRESCRIPTION_VIEWED', 'prescriptions', prescription_id)

    return jsonify({
        'prescription': prescription.to_dict()
    }), 200


@prescriptions_bp.route('/', methods=['GET'])
@jwt_required()
@require_roles('CLINIC_STAFF', 'SPECIALIST', 'ADMIN')
@limiter.limit("60 per minute")
def list_prescriptions():
    patient_id = request.args.get('patient_id')
    page = int(request.args.get('page', 1))
    per_page = min(int(request.args.get('per_page', 50)), 100)

    query = Prescription.select().where(Prescription.is_deleted == False)

    user_role = get_jwt().get('role', '')
    clinic_id = get_current_user_clinic_id()
    identity = int(get_jwt_identity())

    if user_role == 'SPECIALIST':
        query = query.where(Prescription.prescribed_by == identity)
    elif user_role != 'ADMIN' and clinic_id:
        query = query.where(Prescription.patient_id <<
            Patient.select(Patient.id).where(Patient.clinic_id == clinic_id))

    if patient_id:
        query = query.where(Prescription.patient_id == patient_id)

    total = query.count()
    total_pages = (total + per_page - 1) // per_page if total > 0 else 1
    prescriptions = query.order_by(Prescription.created_at.desc()).paginate(page, per_page)

    return jsonify({
        'prescriptions': [p.to_dict() for p in prescriptions],
        'total': total,
        'page': page,
        'per_page': per_page,
        'total_pages': total_pages
    }), 200
