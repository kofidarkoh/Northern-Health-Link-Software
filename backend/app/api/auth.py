import logging
import secrets
from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app.api import auth_bp
from app.services.auth_service import (
    authenticate_user, generate_tokens, create_user,
    validate_password_strength, validate_email_format,
    hash_password, verify_password
)
from app.services.audit_service import record_audit
from app.extensions import limiter, cache

logger = logging.getLogger(__name__)


@auth_bp.route('/login', methods=['POST'])
@limiter.limit("5 per minute")
def login():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    user_id = data.get('user_id', '').strip().upper()
    password = data.get('password')

    if not user_id or not password:
        return jsonify({'error': 'User ID and password are required'}), 400

    user = authenticate_user(user_id, password)
    if not user:
        return jsonify({'error': 'Invalid user ID or password'}), 401

    access_token, refresh_token = generate_tokens(user)

    record_audit(user.id, 'LOGIN', 'users', user.id, {'user_id': user_id})

    return jsonify({
        'access_token': access_token,
        'refresh_token': refresh_token,
        'user': user.to_dict()
    }), 200


@auth_bp.route('/register', methods=['POST'])
@jwt_required()
@limiter.limit("10 per hour")
def register():
    claims = get_jwt()
    if claims.get('role') != 'ADMIN':
        return jsonify({'error': 'Only administrators can register users'}), 403

    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    required_fields = ['password', 'full_name', 'role']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'{field} is required'}), 400

    password_errors = validate_password_strength(data['password'])
    if password_errors:
        return jsonify({'error': 'Weak password', 'details': password_errors}), 400

    valid_roles = ['CLINIC_STAFF', 'SPECIALIST', 'LAB_OFFICER', 'RIDER', 'ADMIN']
    if data['role'] not in valid_roles:
        return jsonify({'error': f'Invalid role. Must be one of: {valid_roles}'}), 400

    email = data.get('email', '').strip().lower()
    if email and not validate_email_format(email):
        return jsonify({'error': 'Invalid email format'}), 400

    user = create_user(
        password=data['password'],
        full_name=data['full_name'],
        role=data['role'],
        email=email or None,
        phone=data.get('phone'),
        clinic_id=data.get('clinic_id'),
        speciality=data.get('speciality')
    )

    if not user:
        return jsonify({'error': 'Email already exists'}), 409

    admin_id = get_jwt_identity()
    record_audit(int(admin_id), 'USER_CREATED', 'users', user.id, {'user_id': user.user_id})

    return jsonify({
        'message': 'User registered successfully',
        'user': user.to_dict()
    }), 201


@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
@limiter.limit("30 per minute")
def refresh():
    identity = get_jwt_identity()

    from app.models.user import User
    user = User.get_or_none(User.id == int(identity))
    if not user:
        return jsonify({'error': 'User not found'}), 404

    if not user.active:
        return jsonify({'error': 'Account is deactivated'}), 403

    access_token, _ = generate_tokens(user)

    return jsonify({
        'access_token': access_token
    }), 200


@auth_bp.route('/logout', methods=['DELETE'])
@jwt_required(verify_type=False)
@limiter.limit("30 per minute")
def logout():
    identity = get_jwt_identity()
    claims = get_jwt()

    jti = claims.get('jti')

    from app.extensions import cache
    try:
        if jti:
            cache.set(f'blacklist_{jti}', True, timeout=86400)
    except Exception as e:
        logger.warning("Failed to blacklist token: %s", e)

    data = request.get_json(silent=True) or {}
    refresh_token = data.get('refresh_token')
    if refresh_token:
        try:
            from flask_jwt_extended import decode_token
            decoded = decode_token(refresh_token)
            refresh_jti = decoded.get('jti')
            if refresh_jti:
                cache.set(f'blacklist_{refresh_jti}', True, timeout=259200)
        except Exception as e:
            logger.warning("Failed to blacklist refresh token: %s", e)

    record_audit(int(identity), 'LOGOUT', 'users', int(identity))

    return jsonify({'message': 'Logged out successfully'}), 200


@auth_bp.route('/me', methods=['GET'])
@jwt_required()
@limiter.limit("60 per minute")
def get_current_user():
    identity = get_jwt_identity()

    from app.models.user import User
    user = User.get_or_none(User.id == int(identity))
    if not user:
        return jsonify({'error': 'User not found'}), 404

    return jsonify({
        'user': user.to_dict()
    }), 200


@auth_bp.route('/me', methods=['PATCH'])
@jwt_required()
@limiter.limit("10 per minute")
def update_profile():
    identity = get_jwt_identity()

    from app.models.user import User
    user = User.get_or_none(User.id == int(identity))
    if not user:
        return jsonify({'error': 'User not found'}), 404

    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    if 'full_name' in data:
        user.full_name = data['full_name']
    if 'phone' in data:
        user.phone = data['phone']

    user.save()

    record_audit(int(identity), 'PROFILE_UPDATED', 'users', user.id, {k: v for k, v in data.items() if k != 'password'})

    return jsonify({
        'message': 'Profile updated successfully',
        'user': user.to_dict()
    }), 200


@auth_bp.route('/me/password', methods=['PUT'])
@jwt_required()
@limiter.limit("5 per minute")
def change_password():
    identity = get_jwt_identity()

    from app.models.user import User
    user = User.get_or_none(User.id == int(identity))
    if not user:
        return jsonify({'error': 'User not found'}), 404

    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    current_password = data.get('current_password')
    new_password = data.get('new_password')

    if not current_password or not new_password:
        return jsonify({'error': 'Current and new password are required'}), 400

    from app.services.auth_service import verify_password, hash_password, validate_password_strength
    if not verify_password(current_password, user.password_hash):
        return jsonify({'error': 'Current password is incorrect'}), 401

    password_errors = validate_password_strength(new_password)
    if password_errors:
        return jsonify({'error': 'Weak password', 'details': password_errors}), 400

    user.password_hash = hash_password(new_password)
    user.save()

    record_audit(int(identity), 'PASSWORD_CHANGED', 'users', user.id)

    return jsonify({'message': 'Password changed successfully'}), 200


@auth_bp.route('/forgot-password', methods=['POST'])
@limiter.limit("3 per minute")
def forgot_password():
    data = request.get_json()
    if not data or not data.get('user_id'):
        return jsonify({'error': 'User ID is required'}), 400

    user_id = data['user_id'].strip().upper()

    from app.models.user import User
    user = User.get_or_none(User.user_id == user_id)

    if not user or not user.security_question:
        return jsonify({'error': 'User not found or security question not set'}), 404

    return jsonify({
        'message': 'Security question retrieved',
        'security_question': user.security_question,
        'user_id': user_id
    }), 200


@auth_bp.route('/verify-security-answer', methods=['POST'])
@limiter.limit("5 per minute")
def verify_security_answer():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    user_id = data.get('user_id', '').strip().upper()
    answer = data.get('answer', '').strip().lower()

    if not user_id or not answer:
        return jsonify({'error': 'User ID and answer are required'}), 400

    from app.models.user import User
    user = User.get_or_none(User.user_id == user_id)

    if not user or not user.security_answer:
        return jsonify({'error': 'User not found'}), 404

    if user.security_answer.strip().lower() != answer:
        return jsonify({'error': 'Incorrect answer'}), 401

    code = secrets.token_hex(3).upper()
    cache.set(f'reset_{user_id}', code, timeout=900)
    logger.info("Password reset code for %s: %s", user_id, code)

    return jsonify({
        'message': 'Answer verified. A reset code has been generated.',
        'reset_code': code
    }), 200


@auth_bp.route('/reset-password', methods=['POST'])
@limiter.limit("5 per minute")
def reset_password():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    user_id = data.get('user_id', '').strip().upper()
    code = data.get('code', '').strip().upper()
    new_password = data.get('new_password', '')

    if not user_id or not code or not new_password:
        return jsonify({'error': 'User ID, code, and new password are required'}), 400

    stored_code = cache.get(f'reset_{user_id}')
    if not stored_code or stored_code != code:
        return jsonify({'error': 'Invalid or expired reset code'}), 400

    password_errors = validate_password_strength(new_password)
    if password_errors:
        return jsonify({'error': 'Weak password', 'details': password_errors}), 400

    from app.models.user import User
    user = User.get_or_none(User.user_id == user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    user.password_hash = hash_password(new_password)
    user.save()

    cache.delete(f'reset_{user_id}')

    record_audit(user.id, 'PASSWORD_RESET', 'users', user.id, {'user_id': user_id})

    return jsonify({'message': 'Password reset successfully'}), 200
