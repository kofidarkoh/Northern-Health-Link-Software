import re
import random
import logging
import bcrypt
from datetime import datetime, timedelta, timezone
from flask_jwt_extended import create_access_token, create_refresh_token
from app.models.user import User, ROLE_PREFIXES

logger = logging.getLogger(__name__)

PASSWORD_MIN_LENGTH = 8
EMAIL_REGEX = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')


def validate_password_strength(password):
    errors = []
    if len(password) < PASSWORD_MIN_LENGTH:
        errors.append(f'Password must be at least {PASSWORD_MIN_LENGTH} characters long')
    if not re.search(r'[A-Z]', password):
        errors.append('Password must contain at least one uppercase letter')
    if not re.search(r'[a-z]', password):
        errors.append('Password must contain at least one lowercase letter')
    if not re.search(r'\d', password):
        errors.append('Password must contain at least one digit')
    return errors


def validate_email_format(email):
    if not EMAIL_REGEX.match(email):
        return False
    return True


def generate_user_id(role):
    prefix = ROLE_PREFIXES.get(role)
    if not prefix:
        raise ValueError(f'Invalid role: {role}')

    for _ in range(20):
        digits = ''.join(random.choices('0123456789', k=6))
        candidate = f'{prefix}-{digits}'
        if not User.get_or_none(User.user_id == candidate):
            return candidate

    raise RuntimeError('Failed to generate unique user ID after 20 attempts')


def hash_password(password):
    password_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password_bytes, salt).decode('utf-8')


def verify_password(password, password_hash):
    password_bytes = password.encode('utf-8')
    hash_bytes = password_hash.encode('utf-8')
    return bcrypt.checkpw(password_bytes, hash_bytes)


def authenticate_user(user_id, password):
    user = User.get_or_none(User.user_id == user_id)
    if not user:
        logger.info("Login attempt for non-existent user_id: %s", user_id)
        return None

    if not verify_password(password, user.password_hash):
        logger.warning("Failed login attempt for user_id: %s", user_id)
        return None

    if not user.active:
        logger.warning("Login attempt for deactivated user_id: %s", user_id)
        return None

    return user


def generate_tokens(user):
    additional_claims = {
        'role': user.role,
        'clinic_id': user.clinic_id
    }

    access_token = create_access_token(
        identity=str(user.id),
        additional_claims=additional_claims
    )
    refresh_token = create_refresh_token(
        identity=str(user.id),
        additional_claims=additional_claims
    )

    return access_token, refresh_token


def create_user(password, full_name, role, email=None, phone=None, clinic_id=None, speciality=None):
    user_id = generate_user_id(role)

    if email:
        existing = User.get_or_none(User.email == email)
        if existing:
            return None

    password_hash = hash_password(password)

    user = User.create(
        user_id=user_id,
        email=email or None,
        phone=phone,
        password_hash=password_hash,
        full_name=full_name,
        role=role,
        clinic_id=clinic_id,
        speciality=speciality,
        active=True
    )

    return user
