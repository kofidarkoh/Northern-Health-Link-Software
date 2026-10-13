import logging
import os
import uuid
from flask import request, jsonify, send_from_directory
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


def _safe_page_args(default_per_page=50):
    """Parse ?page=&per_page= without 500ing on garbage input."""
    try:
        page = max(int(request.args.get('page', 1)), 1)
    except (TypeError, ValueError):
        page = 1
    try:
        per_page = min(max(int(request.args.get('per_page', default_per_page)), 1), 100)
    except (TypeError, ValueError):
        per_page = default_per_page
    return page, per_page


@admin_bp.route('/avatar', methods=['POST'])
@jwt_required()
@require_roles('ADMIN')
@limiter.limit("10 per hour")
def upload_avatar():
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    file = request.files['file']
    if not file.filename:
        return jsonify({'error': 'No file selected'}), 400
    allowed = {'.jpg', '.jpeg', '.png', '.webp'}
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in allowed:
        return jsonify({'error': f'File type {ext} not allowed (jpg, png, webp)'}), 400
    file.seek(0, os.SEEK_END)
    if file.tell() > 2 * 1024 * 1024:
        return jsonify({'error': 'File too large (max 2MB)'}), 400
    file.seek(0)

    upload_dir = os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
        'uploads', 'avatars'
    )
    os.makedirs(upload_dir, exist_ok=True)
    filename = f'{uuid.uuid4().hex}{ext}'
    file.save(os.path.join(upload_dir, filename))
    return jsonify({'file_url': f'uploads/avatars/{filename}'}), 201


@admin_bp.route('/users', methods=['GET'])
@jwt_required()
@require_roles('ADMIN')
@limiter.limit("30 per minute")
def list_users():
    role = request.args.get('role')
    search = (request.args.get('search') or '').strip()
    page, per_page = _safe_page_args()

    query = User.select().where(User.is_deleted == False)

    if role:
        query = query.where(User.role == role)

    if search:
        query = query.where(
            User.full_name.contains(search)
            | User.user_id.contains(search)
            | User.email.contains(search)
        )

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
            speciality=validated.get('speciality'),
            profile_picture=data.get('profile_picture') or None
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


@admin_bp.route('/users/<int:user_id>', methods=['GET'])
@jwt_required()
@require_roles('ADMIN')
@limiter.limit("30 per minute")
def get_user(user_id):
    user = User.get_or_none((User.id == user_id) & (User.is_deleted == False))
    if not user:
        return jsonify({'error': 'User not found'}), 404
    return jsonify({'user': user.to_dict()}), 200


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
        if 'full_name' in data and data['full_name']:
            user.full_name = str(data['full_name']).strip()
        if 'phone' in data:
            phone = str(data['phone'] or '').strip()
            if phone and len(phone) > 30:
                return jsonify({'error': 'Phone too long'}), 400
            user.phone = phone or None
        if 'clinic_id' in data:
            clinic_id = data['clinic_id']
            if clinic_id is None:
                user.clinic = None
            else:
                clinic = Clinic.get_or_none((Clinic.id == clinic_id) & (Clinic.is_deleted == False))
                if not clinic:
                    return jsonify({'error': 'Invalid clinic'}), 400
                user.clinic = clinic
        if 'role' in data:
            valid_roles = ['CLINIC_STAFF', 'SPECIALIST', 'LAB_OFFICER', 'RIDER', 'ADMIN']
            if data['role'] not in valid_roles:
                return jsonify({'error': 'Invalid role'}), 400
            user.role = data['role']
        if 'speciality' in data:
            user.speciality = data['speciality']
        if 'profile_picture' in data:
            user.profile_picture = data['profile_picture'] or None
        
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


@admin_bp.route('/users/<int:user_id>/reset-password', methods=['POST'])
@jwt_required()
@require_roles('ADMIN')
@limiter.limit("10 per hour")
def reset_user_password(user_id):
    import secrets
    import string
    from app.services.auth_service import hash_password

    user = User.get_or_none(User.id == user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    identity = get_jwt_identity()
    if int(identity) == user_id:
        return jsonify({'error': 'Use profile settings to change your own password'}), 400

    alphabet = string.ascii_letters + string.digits
    while True:
        temporary_password = ''.join(secrets.choice(alphabet) for _ in range(12))
        if (any(c.isupper() for c in temporary_password)
                and any(c.islower() for c in temporary_password)
                and any(c.isdigit() for c in temporary_password)):
            break

    try:
        user.password_hash = hash_password(temporary_password)
        user.must_change_password = True
        user.save()
    except Exception as e:
        logger.error("Failed to reset password for user %s: %s", user_id, e)
        return jsonify({'error': 'Failed to reset password'}), 500

    record_audit(int(identity), 'PASSWORD_RESET_ADMIN', 'users', user.id, {'user_id': user.user_id})

    return jsonify({
        'message': 'Password reset successfully. The user must change it on next login.',
        'temporary_password': temporary_password,
    }), 200


@admin_bp.route('/clinics', methods=['GET'])
@jwt_required()
@require_roles('ADMIN')
@limiter.limit("30 per minute")
def list_clinics():
    page, per_page = _safe_page_args()

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
            district=validated['district'].strip(),
            contact_phone=validated.get('contact_phone'),
            address=(validated.get('address') or '').strip() or None,
            ownership=validated['ownership']
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
    page, per_page = _safe_page_args()

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
