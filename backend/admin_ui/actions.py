"""Admin write actions (ADMIN JWT required; every mutation is audited)."""
import logging

from flask import jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from admin_ui import admin_web_bp
from app.middleware.auth import require_roles
from app.models.appointment import Appointment
from app.models.clinic import Clinic
from app.models.delivery import Delivery
from app.models.notification import Notification
from app.models.user import User
from app.services.audit_service import record_audit
from app.services.auth_service import create_user

logger = logging.getLogger(__name__)

# Maintenance mode blocks admin write actions except the settings toggle itself.
_EXEMPT_FROM_MAINTENANCE = ('/actions/settings',)


@admin_web_bp.before_request
def _maintenance_guard():
    from flask import request as _req
    if _req.method != 'POST' or not _req.path.startswith('/admin/actions/'):
        return None
    if any(_req.path.endswith(p) for p in _EXEMPT_FROM_MAINTENANCE):
        return None
    try:
        from app.models.system_setting import get_setting
        if get_setting('maintenance_mode') == '1':
            return ('<div class="alert err">Maintenance mode is ON — write actions are '
                    'paused. Turn it off in <a href="/admin/settings">Settings</a>.</div>', 503)
    except Exception:
        pass  # settings unreadable -> fail open, don't brick the console
    return None


# ---------- actions ----------
@admin_web_bp.route('/actions/users', methods=['POST'])
@jwt_required()
@require_roles('ADMIN')
def action_create_user():
    data = request.form.to_dict()
    try:
        user = create_user(
            password=data.get('password', ''),
            full_name=data.get('full_name', ''),
            role=data.get('role', ''),
            email=data.get('email') or None,
            phone=data.get('phone') or None,
            clinic_id=int(data['clinic_id']) if data.get('clinic_id') else None,
            speciality=data.get('speciality') or None,
            profile_picture=data.get('profile_picture') or None,
        )
    except Exception as e:
        logger.error('Admin web create user failed: %s', e)
        return f'<div class="alert err">Failed: {e}</div>', 400
    if not user:
        return '<div class="alert err">Email already exists.</div>', 409
    record_audit(int(get_jwt_identity()), 'USER_CREATED', 'users', user.id, {'user_id': user.user_id})
    return (
        f'<div class="alert ok">'
        f'Created <b>{user.full_name}</b> — User ID: <b>{user.user_id}</b></div>'
    )


def _validate_clinic_form():
    """Returns (name, district, phone, ownership, address, error_html)."""
    from app.models.district import District
    name = (request.form.get('name') or '').strip()
    district = (request.form.get('district') or '').strip()
    phone = (request.form.get('contact_phone') or '').strip() or None
    ownership = (request.form.get('ownership') or '').strip().upper()
    address = (request.form.get('address') or '').strip() or None
    if not name or not district:
        return None, None, None, None, None, '<div class="alert err">Name and district are required.</div>'
    if ownership not in Clinic.OWNERSHIP_CHOICES:
        return None, None, None, None, None, '<div class="alert err">Ownership must be Public, Private, Faith-based or NGO.</div>'
    if not District.get_or_none(
            (District.name == district) & (District.is_deleted == False)):  # noqa: E712
        return None, None, None, None, None, '<div class="alert err">District must be a Northern Region MMDA.</div>'
    if address is not None and len(address) > 255:
        return None, None, None, None, None, '<div class="alert err">Address is too long (max 255 characters).</div>'
    return name, district, phone, ownership, address, None


@admin_web_bp.route('/actions/clinics', methods=['POST'])
@jwt_required()
@require_roles('ADMIN')
def action_create_clinic():
    name, district, phone, ownership, address, err = _validate_clinic_form()
    if err:
        return err, 400
    clinic = Clinic.create(name=name, district=district, contact_phone=phone,
                           ownership=ownership, address=address)
    record_audit(int(get_jwt_identity()), 'CLINIC_CREATED', 'clinics', clinic.id,
                 {'name': name, 'ownership': ownership, 'address': address})
    return f'<div class="alert ok">Created clinic <b>{name}</b>.</div>'


@admin_web_bp.route('/actions/notify', methods=['POST'])
@jwt_required()
@require_roles('ADMIN')
def action_broadcast():
    from app.services.notification_service import create_notification
    role = request.form.get('role') or ''
    clinic_id = request.form.get('clinic_id') or ''
    title = (request.form.get('title') or '').strip()
    message = (request.form.get('message') or '').strip()
    if not title or not message:
        return '<div class="alert err">Title and message are required.</div>', 400
    query = User.select().where((User.is_deleted == False) & (User.active == True))  # noqa: E712
    if role:
        query = query.where(User.role == role)
    if clinic_id.isdigit():
        query = query.where(User.clinic_id == int(clinic_id))
    try:
        from app.models.system_setting import get_setting
        cap = min(max(int(get_setting('broadcast_recipient_cap')), 1), 5000)
    except Exception:
        cap = 500
    targets = list(query.limit(cap))
    if not targets:
        return '<div class="alert err">No matching recipients.</div>', 404
    total_matching = query.count()
    sent = 0
    for t in targets:
        if create_notification(t.id, title, message, user=t):
            sent += 1
    record_audit(int(get_jwt_identity()), 'NOTIFICATION_SENT', 'notifications', None,
                 {'title': title, 'count': sent, 'role': role, 'clinic_id': clinic_id})
    warn = (f' <span class="muted">(cap reached — {total_matching} matched, first {cap} notified)</span>'
            if total_matching > len(targets) else '')
    return f'<div class="alert ok">Sent to <b>{sent}</b> user(s).{warn}</div>'


@admin_web_bp.route('/actions/notifications/<int:note_id>/read', methods=['POST'])
@jwt_required()
@require_roles('ADMIN')
def action_mark_read(note_id):
    from datetime import datetime
    note = Notification.get_or_none(Notification.id == note_id)
    if not note:
        return jsonify({'error': 'Not found'}), 404
    note.read_at = datetime.now()
    note.save()
    return jsonify({'message': 'read'})


@admin_web_bp.route('/actions/users/<int:user_id>/status', methods=['POST'])
@jwt_required()
@require_roles('ADMIN')
def action_toggle_status(user_id):
    user = User.get_or_none(User.id == user_id)
    if not user:
        return '<span style="color:red">Not found</span>', 404
    user.active = not user.active
    user.save()
    record_audit(int(get_jwt_identity()), 'USER_UPDATED', 'users', user.id, {'active': user.active})
    label = 'Active' if user.active else 'Inactive'
    cls = 'p-green' if user.active else 'p-grey'
    return f'<span class="pill {cls}">{label}</span>'


@admin_web_bp.route('/actions/users/<int:user_id>/reset-password', methods=['POST'])
@jwt_required()
@require_roles('ADMIN')
def action_reset_password(user_id):
    import secrets
    import string
    from app.services.auth_service import hash_password

    user = User.get_or_none(User.id == user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    if int(get_jwt_identity()) == user_id:
        return jsonify({'error': 'Use profile settings for your own password'}), 400
    alphabet = string.ascii_letters + string.digits
    while True:
        temp = ''.join(secrets.choice(alphabet) for _ in range(12))
        if any(c.isupper() for c in temp) and any(c.islower() for c in temp) and any(c.isdigit() for c in temp):
            break
    user.password_hash = hash_password(temp)
    user.must_change_password = True
    user.save()
    record_audit(int(get_jwt_identity()), 'PASSWORD_RESET_ADMIN', 'users', user.id, {'user_id': user.user_id})
    return jsonify({'temporary_password': temp})


@admin_web_bp.route('/actions/users/<int:user_id>/delete', methods=['POST'])
@jwt_required()
@require_roles('ADMIN')
def action_delete_user(user_id):
    user = User.get_or_none(User.id == user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    if int(get_jwt_identity()) == user_id:
        return jsonify({'error': 'Cannot delete your own account'}), 400
    user.is_deleted = True
    user.active = False
    user.save()
    record_audit(int(get_jwt_identity()), 'USER_DELETED', 'users', user.id, {'user_id': user.user_id})
    return jsonify({'message': 'deleted'})


@admin_web_bp.route('/actions/users/<int:user_id>/edit', methods=['POST'])
@jwt_required()
@require_roles('ADMIN')
def action_edit_user(user_id):
    me = int(get_jwt_identity())
    user = User.get_or_none(User.id == user_id)
    if not user or user.is_deleted:
        return '<div class="alert err">User not found.</div>', 404
    data = request.form.to_dict()
    role = (data.get('role') or user.role).strip().upper()
    if role not in ('ADMIN', 'CLINIC_STAFF', 'SPECIALIST', 'LAB_OFFICER', 'RIDER'):
        return '<div class="alert err">Invalid role.</div>', 400
    if me == user_id and (role != 'ADMIN' or data.get('active') == '0'):
        return '<div class="alert err">Cannot strip your own admin access here.</div>', 400
    clinic_raw = (data.get('clinic_id') or '').strip()
    clinic_id = int(clinic_raw) if clinic_raw.isdigit() else None
    if clinic_id and not Clinic.get_or_none(Clinic.id == clinic_id):
        return '<div class="alert err">Clinic not found.</div>', 404
    user.full_name = (data.get('full_name') or user.full_name).strip()
    user.role = role
    user.clinic_id = clinic_id
    user.speciality = (data.get('speciality') or '').strip() or None
    user.phone = (data.get('phone') or '').strip() or None
    user.profile_picture = (data.get('profile_picture') or '').strip() or None
    email = (data.get('email') or '').strip() or None
    if email and email != user.email:
        if User.get_or_none(User.email == email):
            return '<div class="alert err">Email already in use.</div>', 409
        user.email = email
    if data.get('active') in ('0', '1'):
        user.active = data.get('active') == '1'
    user.save()
    record_audit(me, 'USER_UPDATED', 'users', user.id,
                 {'role': role, 'clinic_id': clinic_id, 'active': user.active})
    return f'<div class="alert ok">Updated <b>{user.full_name}</b> ({user.user_id}).</div>'


@admin_web_bp.route('/actions/clinics/<int:clinic_id>/edit', methods=['POST'])
@jwt_required()
@require_roles('ADMIN')
def action_edit_clinic(clinic_id):
    clinic = Clinic.get_or_none(Clinic.id == clinic_id)
    if not clinic or clinic.is_deleted:
        return '<div class="alert err">Clinic not found.</div>', 404
    name, district, phone, ownership, address, err = _validate_clinic_form()
    if err:
        return err, 400
    clinic.name, clinic.district, clinic.contact_phone = name, district, phone
    clinic.ownership = ownership
    clinic.address = address
    clinic.save()
    record_audit(int(get_jwt_identity()), 'CLINIC_UPDATED', 'clinics', clinic.id,
                 {'name': name, 'ownership': ownership, 'address': address})
    return f'<div class="alert ok">Updated clinic <b>{name}</b>.</div>'


@admin_web_bp.route('/actions/clinics/<int:clinic_id>/delete', methods=['POST'])
@jwt_required()
@require_roles('ADMIN')
def action_delete_clinic(clinic_id):
    clinic = Clinic.get_or_none(Clinic.id == clinic_id)
    if not clinic or clinic.is_deleted:
        return jsonify({'error': 'Clinic not found'}), 404
    linked = User.select().where((User.clinic_id == clinic_id) & (User.is_deleted == False)).count()  # noqa: E712
    if linked:
        return jsonify({'error': f'Clinic has {linked} active user(s); reassign first'}), 400
    clinic.is_deleted = True
    clinic.save()
    record_audit(int(get_jwt_identity()), 'CLINIC_DELETED', 'clinics', clinic.id, {'name': clinic.name})
    return jsonify({'message': 'deleted'})


@admin_web_bp.route('/actions/deliveries/<int:delivery_id>/assign', methods=['POST'])
@jwt_required()
@require_roles('ADMIN')
def action_assign_delivery(delivery_id):
    from app.services.notification_service import create_notification
    d = Delivery.get_or_none(Delivery.id == delivery_id)
    if not d or d.is_deleted:
        return '<div class="alert err">Delivery not found.</div>', 404
    rider_raw = (request.form.get('rider_id') or '').strip()
    if not rider_raw.isdigit():
        return '<div class="alert err">Select a rider.</div>', 400
    rider = User.get_or_none(User.id == int(rider_raw))
    if not rider or rider.role != 'RIDER' or rider.is_deleted or not rider.active:
        return '<div class="alert err">Rider must be an active RIDER account.</div>', 400
    d.rider_id = rider.id
    d.save()
    record_audit(int(get_jwt_identity()), 'DELIVERY_STATUS_UPDATED', 'deliveries', d.id,
                 {'rider_id': rider.id})
    create_notification(rider.id, 'Delivery assigned',
                        f'Delivery #{d.id} assigned: {(d.delivery_address or "")[:120]}', user=rider)
    return f'<div class="alert ok">Assigned to <b>{rider.full_name}</b>.</div>'


@admin_web_bp.route('/actions/deliveries/<int:delivery_id>/status', methods=['POST'])
@jwt_required()
@require_roles('ADMIN')
def action_delivery_status(delivery_id):
    from app.services.notification_service import create_notification
    d = Delivery.get_or_none(Delivery.id == delivery_id)
    if not d or d.is_deleted:
        return '<div class="alert err">Delivery not found.</div>', 404
    status = (request.form.get('status') or '').strip().upper()
    note = (request.form.get('status_note') or '').strip() or None
    if status not in ('PENDING', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'FAILED'):
        return '<div class="alert err">Invalid status.</div>', 400
    d.status, d.status_note = status, note
    d.save()
    record_audit(int(get_jwt_identity()), 'DELIVERY_STATUS_UPDATED', 'deliveries', d.id,
                 {'status': status})
    if d.rider_id:
        create_notification(d.rider_id, f'Delivery {status.lower().replace("_", " ")}',
                            f'Delivery #{d.id} marked {status} by admin.', user=None)
    return f'<div class="alert ok">Delivery #{d.id} → <b>{status}</b>.</div>'


@admin_web_bp.route('/actions/appointments/<int:appt_id>/status', methods=['POST'])
@jwt_required()
@require_roles('ADMIN')
def action_appointment_status(appt_id):
    a = Appointment.get_or_none(Appointment.id == appt_id)
    if not a or a.is_deleted:
        return '<div class="alert err">Appointment not found.</div>', 404
    status = (request.form.get('status') or '').strip().upper()
    if status not in ('REQUESTED', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'):
        return '<div class="alert err">Invalid status.</div>', 400
    a.status = status
    video = (request.form.get('video_room_url') or '').strip()
    if video or 'video_room_url' in request.form:
        a.video_room_url = video or None
    a.save()
    record_audit(int(get_jwt_identity()), 'APPOINTMENT_STATUS_UPDATED', 'appointments', a.id,
                 {'status': status})
    return f'<div class="alert ok">Appointment #{a.id} → <b>{status}</b>.</div>'


@admin_web_bp.route('/actions/settings', methods=['POST'])
@jwt_required()
@require_roles('ADMIN')
def action_update_settings():
    """Update allow-listed SystemSetting keys. Audited; no secrets involved."""
    from app.models.system_setting import (SETTING_META, get_settings,
                                           set_setting, validate_setting)
    submitted = {k: request.form.get(k) for k in SETTING_META
                 if request.form.get(k) is not None}
    if not submitted:
        return '<div class="alert err">No settings submitted.</div>', 400
    current = get_settings()
    errors, changed = [], {}
    for key, raw in submitted.items():
        ok, res = validate_setting(key, raw)
        if not ok:
            errors.append(res)
            continue
        if current.get(key) != res:
            changed[key] = (current.get(key), res)
    if errors:
        return f'<div class="alert err">{" ".join(errors)}</div>', 400
    if not changed:
        return '<div class="alert ok">Settings unchanged.</div>'
    for key, (old, new) in changed.items():
        set_setting(key, new)
    record_audit(int(get_jwt_identity()), 'SETTING_UPDATED', 'system_settings', None,
                 {k: {'old': o, 'new': n} for k, (o, n) in changed.items()})
    names = ', '.join(SETTING_META[k]['label'] for k in changed)
    return f'<div class="alert ok">Updated: <b>{names}</b>.</div>'
