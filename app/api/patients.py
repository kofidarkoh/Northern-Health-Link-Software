import logging
from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from marshmallow import ValidationError
from app.api import patients_bp
from app.models.patient import Patient
from app.models.user import User
from app.services.audit_service import record_audit
from app.services.patient_service import (
    search_patients, get_patient_by_id, create_patient,
    update_patient, soft_delete_patient, check_duplicate_patient
)
from app.schemas.validators import PatientCreateSchema, PatientUpdateSchema, PatientSearchSchema
from app.middleware.auth import require_roles, get_current_user_clinic_id
from app.extensions import cache, limiter

logger = logging.getLogger(__name__)

create_schema = PatientCreateSchema()
update_schema = PatientUpdateSchema()
search_schema = PatientSearchSchema()


@patients_bp.route('/', methods=['GET'])
@jwt_required()
@require_roles('CLINIC_STAFF', 'SPECIALIST', 'LAB_OFFICER', 'ADMIN')
@limiter.limit("60 per minute")
def list_patients():
    args = request.args.to_dict()

    try:
        filters = search_schema.load(args)
    except ValidationError as err:
        return jsonify({'error': 'Invalid filters', 'details': err.messages}), 400

    clinic_id = get_current_user_clinic_id()
    user_role = get_jwt().get('role', '')

    if user_role != 'ADMIN' and clinic_id:
        filters['clinic_id'] = clinic_id

    result = search_patients(filters)

    return jsonify(result), 200


@patients_bp.route('/<int:patient_id>', methods=['GET'])
@jwt_required()
@require_roles('CLINIC_STAFF', 'SPECIALIST', 'LAB_OFFICER', 'ADMIN')
@limiter.limit("60 per minute")
def get_patient(patient_id):
    patient = get_patient_by_id(patient_id)
    if not patient:
        return jsonify({'error': 'Patient not found'}), 404

    user_role = get_jwt().get('role', '')
    clinic_id = get_current_user_clinic_id()

    if user_role != 'ADMIN' and clinic_id and patient.get('clinic_id') != clinic_id:
        return jsonify({'error': 'Access denied: patient belongs to another clinic'}), 403

    identity = get_jwt_identity()
    record_audit(int(identity), 'PATIENT_VIEWED', 'patients', patient_id)

    return jsonify({'patient': patient}), 200


@patients_bp.route('/', methods=['POST'])
@jwt_required()
@require_roles('CLINIC_STAFF', 'ADMIN')
@limiter.limit("30 per minute")
def create_patient_endpoint():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    try:
        validated = create_schema.load(data)
    except ValidationError as err:
        return jsonify({'error': 'Validation failed', 'details': err.messages}), 400

    identity = get_jwt_identity()
    user = User.get_or_none(User.id == int(identity))

    user_role = get_jwt().get('role', '')
    if user_role != 'ADMIN':
        clinic_id = (user.clinic_id if user and user.clinic_id else None)
        if not clinic_id:
            return jsonify({'error': 'User must be assigned to a clinic'}), 400
        validated['clinic_id'] = clinic_id
    else:
        clinic_id = validated.get('clinic_id')
        if not clinic_id:
            return jsonify({'error': 'Clinic ID is required'}), 400

    has_duplicate = check_duplicate_patient(
        validated['full_name'],
        validated.get('contact_phone'),
        validated['clinic_id']
    )

    try:
        patient = create_patient(validated, int(identity))
    except Exception as e:
        logger.error("Failed to create patient: %s", e)
        return jsonify({'error': 'Failed to create patient'}), 500

    record_audit(int(identity), 'PATIENT_CREATED', 'patients', patient['id'])

    response = {
        'message': 'Patient registered successfully',
        'patient': patient
    }

    if has_duplicate:
        response['duplicate_warning'] = 'A patient with similar name/phone already exists in this clinic'

    return jsonify(response), 201


@patients_bp.route('/<int:patient_id>', methods=['PUT'])
@jwt_required()
@require_roles('CLINIC_STAFF', 'ADMIN')
@limiter.limit("30 per minute")
def update_patient_endpoint(patient_id):
    existing = Patient.get_or_none(Patient.id == patient_id)
    if not existing:
        return jsonify({'error': 'Patient not found'}), 404

    user_role = get_jwt().get('role', '')
    clinic_id = get_current_user_clinic_id()
    if user_role != 'ADMIN' and clinic_id and existing.clinic_id != clinic_id:
        return jsonify({'error': 'Access denied: patient belongs to another clinic'}), 403

    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    try:
        validated = update_schema.load(data)
    except ValidationError as err:
        return jsonify({'error': 'Validation failed', 'details': err.messages}), 400

    identity = get_jwt_identity()

    has_duplicate = False
    if 'full_name' in validated or 'contact_phone' in validated:
        name = validated.get('full_name', existing.full_name)
        phone = validated.get('contact_phone', existing.contact_phone)
        has_duplicate = check_duplicate_patient(
            name, phone, existing.clinic_id, exclude_id=patient_id
        )

    try:
        patient = update_patient(patient_id, validated)
    except Exception as e:
        logger.error("Failed to update patient %s: %s", patient_id, e)
        return jsonify({'error': 'Failed to update patient'}), 500

    if not patient:
        return jsonify({'error': 'Patient not found'}), 404

    record_audit(int(identity), 'PATIENT_UPDATED', 'patients', patient_id)

    response = {
        'message': 'Patient updated successfully',
        'patient': patient
    }

    if has_duplicate:
        response['duplicate_warning'] = 'A patient with similar name/phone already exists in this clinic'

    return jsonify(response), 200


@patients_bp.route('/<int:patient_id>', methods=['DELETE'])
@jwt_required()
@require_roles('ADMIN')
@limiter.limit("10 per minute")
def delete_patient(patient_id):
    identity = get_jwt_identity()

    try:
        success = soft_delete_patient(patient_id)
    except Exception as e:
        logger.error("Failed to delete patient %s: %s", patient_id, e)
        return jsonify({'error': 'Failed to delete patient'}), 500

    if not success:
        return jsonify({'error': 'Patient not found'}), 404

    record_audit(int(identity), 'PATIENT_DELETED', 'patients', patient_id)

    return jsonify({'message': 'Patient deleted successfully'}), 200
