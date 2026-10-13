import logging
from functools import wraps
from flask import jsonify
from flask_jwt_extended import get_jwt

logger = logging.getLogger(__name__)


def get_current_user_clinic_id():
    try:
        claims = get_jwt()
        return claims.get('clinic_id')
    except Exception:
        return None


def get_current_user_role():
    try:
        claims = get_jwt()
        return claims.get('role', '')
    except Exception:
        return ''


def require_roles(*allowed_roles):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            try:
                claims = get_jwt()
                user_role = claims.get('role', '')
            except Exception as e:
                logger.error("Failed to get JWT claims: %s", e)
                return jsonify({'error': 'Authentication error'}), 401

            if user_role not in allowed_roles:
                return jsonify({
                    'error': 'Insufficient permissions',
                    'required': list(allowed_roles),
                    'current': user_role
                }), 403

            return f(*args, **kwargs)
        return decorated_function
    return decorator
