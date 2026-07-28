import logging
from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from marshmallow import ValidationError
from app.api import admin_bp
from app.models.user import User
from app.models.clinic import Clinic
from app.models.patient import Patient
from app.models.appointment import Appointment
from app.models.lab import LabRequest
from app.models.prescription import Prescription
from app.models.delivery import Delivery
from app.models.audit_log import AuditLog
from app.services.auth_service import create_user, validate_password_strength, validate_email_format
from app.services.audit_service import record_audit
from app.middleware.auth import require_roles
from app.extensions import limiter, cache
from app.schemas.validators import UserCreateSchema, ClinicCreateSchema

logger = logging.getLogger(__name__)

user_create_schema = UserCreateSchema()
clinic_create_schema = ClinicCreateSchema()


@admin_bp.route('/users', methods=['GET'])
@jwt_required()
@require_roles('ADMIN')
@limiter.limit("30 per minute")
def list_users():
    role = request.args.get('role')
    page = int(request.args.get('page', 1))
    per_page = min(int(request.args.get('per_page', 50)), 100)

    query = User.select().where(User.is_deleted == False)

    if role:
        query = query.where(User.role == role)

    total = query.count()
    total_pages = (total + per_page - 1) // per_page if total > 0 else 1
    users = query.order_by(User.created_at.desc()).paginate(page, per_page)

    return jsonify({
        'users': [u.to_dict() for u in users],
        'total': total,
        'page': page,
        'per_page': per_page,
        'total_pages': total_pages
    }), 200


@admin_bp.route('/users', methods=['POST'])
@jwt_required()
@require_roles('ADMIN')
@limiter.limit("10 per hour")
def create_user_endpoint():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    try:
        validated = user_create_schema.load(data)
    except ValidationError as err:
        return jsonify({'error': 'Validation failed', 'details': err.messages}), 400

    try:
        user = create_user(
            password=validated['password'],
            full_name=validated['full_name'],
            role=validated['role'],
            email=validated.get('email'),
            phone=validated.get('phone'),
            clinic_id=validated.get('clinic_id'),
            speciality=validated.get('speciality')
        )
    except Exception as e:
        logger.error("Failed to create user: %s", e)
        return jsonify({'error': 'Failed to create user'}), 500

    if not user:
        return jsonify({'error': 'Email already exists'}), 409

    identity = get_jwt_identity()
    record_audit(int(identity), 'USER_CREATED', 'users', user.id, {'user_id': user.user_id})

    return jsonify({
        'message': 'User created successfully',
        'user': user.to_dict()
    }), 201


@admin_bp.route('/users/<int:user_id>', methods=['PATCH'])
@jwt_required()
@require_roles('ADMIN')
@limiter.limit("30 per minute")
def update_user(user_id):
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    user = User.get_or_none(User.id == user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    try:
        if 'active' in data:
            user.active = data['active']
        if 'role' in data:
            valid_roles = ['CLINIC_STAFF', 'SPECIALIST', 'LAB_OFFICER', 'RIDER', 'ADMIN']
            if data['role'] not in valid_roles:
                return jsonify({'error': 'Invalid role'}), 400
            user.role = data['role']
        if 'speciality' in data:
            user.speciality = data['speciality']
        
        user.save()
        
        identity = get_jwt_identity()
        record_audit(int(identity), 'USER_UPDATED', 'users', user.id, data)
        
        return jsonify({
            'message': 'User updated successfully',
            'user': user.to_dict()
        }), 200
    except Exception as e:
        logger.error("Failed to update user: %s", e)
        return jsonify({'error': 'Failed to update user'}), 500


@admin_bp.route('/users/<int:user_id>', methods=['DELETE'])
@jwt_required()
@require_roles('ADMIN')
@limiter.limit("10 per minute")
def delete_user(user_id):
    user = User.get_or_none(User.id == user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    identity = get_jwt_identity()
    if int(identity) == user_id:
        return jsonify({'error': 'Cannot delete your own account'}), 400

    user.is_deleted = True
    user.active = False
    user.save()

    record_audit(int(identity), 'USER_DELETED', 'users', user.id, {'user_id': user.user_id})

    return jsonify({'message': 'User deleted successfully'}), 200


@admin_bp.route('/clinics', methods=['GET'])
@jwt_required()
@require_roles('ADMIN')
@limiter.limit("30 per minute")
def list_clinics():
    page = int(request.args.get('page', 1))
    per_page = min(int(request.args.get('per_page', 50)), 100)

    query = Clinic.select().where(Clinic.is_deleted == False)

    total = query.count()
    total_pages = (total + per_page - 1) // per_page if total > 0 else 1
    clinics = query.order_by(Clinic.created_at.desc()).paginate(page, per_page)

    return jsonify({
        'clinics': [c.to_dict() for c in clinics],
        'total': total,
        'page': page,
        'per_page': per_page,
        'total_pages': total_pages
    }), 200


@admin_bp.route('/clinics', methods=['POST'])
@jwt_required()
@require_roles('ADMIN')
@limiter.limit("10 per hour")
def create_clinic():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    try:
        validated = clinic_create_schema.load(data)
    except ValidationError as err:
        return jsonify({'error': 'Validation failed', 'details': err.messages}), 400

    try:
        clinic = Clinic.create(
            name=validated['name'],
            district=validated['district'],
            contact_phone=validated.get('contact_phone')
        )
    except Exception as e:
        logger.error("Failed to create clinic: %s", e)
        return jsonify({'error': 'Failed to create clinic'}), 500

    identity = get_jwt_identity()
    record_audit(int(identity), 'CLINIC_CREATED', 'clinics', clinic.id)

    return jsonify({
        'message': 'Clinic created successfully',
        'clinic': clinic.to_dict()
    }), 201


@admin_bp.route('/dashboard', methods=['GET'])
@jwt_required()
@require_roles('ADMIN')
@limiter.limit("30 per minute")
@cache.cached(timeout=90, key_prefix='admin_dashboard')
def get_dashboard():
    try:
        stats = {
            'total_users': User.select().where(User.is_deleted == False).count(),
            'total_clinics': Clinic.select().where(Clinic.is_deleted == False).count(),
            'total_patients': Patient.select().where(Patient.is_deleted == False).count(),
            'total_appointments': Appointment.select().where(Appointment.is_deleted == False).count(),
            'pending_lab_requests': LabRequest.select().where(
                (LabRequest.is_deleted == False) & (LabRequest.status == 'REQUESTED')
            ).count(),
            'pending_deliveries': Delivery.select().where(
                (Delivery.is_deleted == False) & (Delivery.status == 'PENDING')
            ).count(),
        }
    except Exception as e:
        logger.error("Failed to fetch dashboard stats: %s", e)
        return jsonify({'error': 'Failed to fetch dashboard stats'}), 500

    return jsonify({'stats': stats}), 200


@admin_bp.route('/audit-logs', methods=['GET'])
@jwt_required()
@require_roles('ADMIN')
@limiter.limit("30 per minute")
def list_audit_logs():
    entity_type = request.args.get('entity_type')
    user_id = request.args.get('user_id')
    page = int(request.args.get('page', 1))
    per_page = min(int(request.args.get('per_page', 50)), 100)

    query = AuditLog.select().where(AuditLog.is_deleted == False)

    if entity_type:
        query = query.where(AuditLog.entity_type == entity_type)
    if user_id:
        query = query.where(AuditLog.user_id == user_id)

    total = query.count()
    total_pages = (total + per_page - 1) // per_page if total > 0 else 1
    logs = query.order_by(AuditLog.created_at.desc()).paginate(page, per_page)

    return jsonify({
        'audit_logs': [l.to_dict() for l in logs],
        'total': total,
        'page': page,
        'per_page': per_page,
        'total_pages': total_pages
    }), 200
