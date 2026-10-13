"""Admin table/list partials (ADMIN JWT required; HTML for htmx swaps)."""
from flask import jsonify, render_template, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from admin_ui import admin_web_bp
from admin_ui.helpers import _paginate_list, _pagination_args
from app.middleware.auth import require_roles
from app.models.appointment import Appointment
from app.models.audit_log import AuditLog
from app.models.clinic import Clinic
from app.models.consultation import ConsultationNote
from app.models.delivery import Delivery
from app.models.lab import LabRequest, LabResult
from app.models.notification import Notification
from app.models.patient import Patient
from app.models.prescription import Prescription
from app.models.user import User


# ---------- partials ----------
@admin_web_bp.route('/partials/stats')
@jwt_required()
@require_roles('ADMIN')
def partial_stats():
    stats = {
        'total_users': User.select().where(User.is_deleted == False).count(),  # noqa: E712
        'total_clinics': Clinic.select().where(Clinic.is_deleted == False).count(),  # noqa: E712
        'total_patients': Patient.select().where(Patient.is_deleted == False).count(),  # noqa: E712
        'total_appointments': Appointment.select().where(Appointment.is_deleted == False).count(),  # noqa: E712
        'pending_lab_requests': LabRequest.select().where(
            (LabRequest.is_deleted == False) & (LabRequest.status == 'REQUESTED')  # noqa: E712
        ).count(),
        'pending_deliveries': Delivery.select().where(
            (Delivery.is_deleted == False) & (Delivery.status == 'PENDING')  # noqa: E712
        ).count(),
        'unread_notifications': Notification.select().where(
            (Notification.is_deleted == False) & (Notification.read_at.is_null())  # noqa: E712
        ).count(),
        'active_riders': User.select().where(
            (User.is_deleted == False) & (User.role == 'RIDER') & (User.active == True)  # noqa: E712
        ).count(),
    }
    return render_template('admin/_stats.html', stats=stats)


@admin_web_bp.route('/partials/users')
@jwt_required()
@require_roles('ADMIN')
def partial_users():
    role = request.args.get('role') or ''
    q = (request.args.get('q') or '').strip().lower()
    clinic_id = request.args.get('clinic_id') or ''
    page, per_page = _pagination_args()

    query = User.select().where(User.is_deleted == False)  # noqa: E712
    if role:
        query = query.where(User.role == role)
    if clinic_id.isdigit():
        query = query.where(User.clinic_id == int(clinic_id))

    users = list(query.order_by(User.created_at.desc()))
    if q:
        users = [u for u in users if q in (u.full_name or '').lower()
                 or q in (u.user_id or '').lower()
                 or q in (u.email or '').lower()]

    users, total, page, total_pages = _paginate_list(users, page, per_page)
    clinics = {c.id: c.name for c in Clinic.select()}
    return render_template('admin/_user_rows.html', users=users, clinics=clinics,
                           total=total, page=page, total_pages=total_pages, per_page=per_page,
                           role=role, q=request.args.get('q', ''), clinic_id=clinic_id)


@admin_web_bp.route('/partials/clinics')
@jwt_required()
@require_roles('ADMIN')
def partial_clinics():
    ownership = (request.args.get('ownership') or '').strip().upper()
    query = Clinic.select().where(Clinic.is_deleted == False)  # noqa: E712
    if ownership in Clinic.OWNERSHIP_CHOICES:
        query = query.where(Clinic.ownership == ownership)
    clinics = list(query.order_by(Clinic.created_at.desc()))
    counts = {}
    for c in clinics:
        counts[c.id] = {
            'users': User.select().where((User.clinic_id == c.id) & (User.is_deleted == False)).count(),  # noqa: E712
            'patients': Patient.select().where((Patient.clinic_id == c.id) & (Patient.is_deleted == False)).count(),  # noqa: E712
        }
    return render_template('admin/_clinic_rows.html', clinics=clinics, counts=counts,
                           ownership=ownership)


@admin_web_bp.route('/partials/patients')
@jwt_required()
@require_roles('ADMIN')
def partial_patients():
    q = (request.args.get('q') or '').strip().lower()
    clinic_id = request.args.get('clinic_id') or ''
    gender = request.args.get('gender') or ''
    page, per_page = _pagination_args()

    query = Patient.select().where(Patient.is_deleted == False)  # noqa: E712
    if clinic_id.isdigit():
        query = query.where(Patient.clinic_id == int(clinic_id))
    if gender:
        query = query.where(Patient.gender == gender)
    rows = list(query.order_by(Patient.created_at.desc()))
    if q:
        rows = [p for p in rows if q in (p.full_name or '').lower()
                or q in (p.district or '').lower()
                or q in (p.contact_phone or '').lower()]
    rows, total, page, total_pages = _paginate_list(rows, page, per_page)
    clinics = {c.id: c.name for c in Clinic.select()}
    return render_template('admin/_patient_rows.html', patients=rows, clinics=clinics,
                           total=total, page=page, total_pages=total_pages,
                           q=request.args.get('q', ''), clinic_id=clinic_id, gender=gender)


@admin_web_bp.route('/partials/appointments')
@jwt_required()
@require_roles('ADMIN')
def partial_appointments():
    from datetime import datetime
    status = request.args.get('status') or ''
    specialist_id = request.args.get('specialist_id') or ''
    clinic_id = request.args.get('clinic_id') or ''
    date_from = (request.args.get('date_from') or '').strip()
    date_to = (request.args.get('date_to') or '').strip()
    q = (request.args.get('q') or '').strip().lower()
    page, per_page = _pagination_args()
    query = Appointment.select().where(Appointment.is_deleted == False)  # noqa: E712
    if status:
        query = query.where(Appointment.status == status)
    if specialist_id.isdigit():
        query = query.where(Appointment.specialist_id == int(specialist_id))
    if clinic_id.isdigit():
        query = query.where(Appointment.clinic_id == int(clinic_id))
    rows = list(query.order_by(Appointment.appointment_time.desc()))
    try:
        df = datetime.strptime(date_from, '%Y-%m-%d').date() if date_from else None
    except ValueError:
        df, date_from = None, ''
    try:
        dt = datetime.strptime(date_to, '%Y-%m-%d').date() if date_to else None
    except ValueError:
        dt, date_to = None, ''
    if df:
        rows = [a for a in rows if a.appointment_time and a.appointment_time.date() >= df]
    if dt:
        rows = [a for a in rows if a.appointment_time and a.appointment_time.date() <= dt]
    patients = {p.id: p.full_name for p in Patient.select()}
    if q:
        rows = [a for a in rows if q in (patients.get(a.patient_id, '') or '').lower()]
    rows, total, page, total_pages = _paginate_list(rows, page, per_page)
    users = {u.id: f"{u.full_name} ({u.user_id})" for u in User.select()}
    return render_template('admin/_appointment_rows.html', appointments=rows,
                           patients=patients, users=users,
                           total=total, page=page, total_pages=total_pages,
                           status=status, q=request.args.get('q', ''),
                           specialist_id=specialist_id, clinic_id=clinic_id,
                           date_from=date_from, date_to=date_to)


@admin_web_bp.route('/partials/consultations')
@jwt_required()
@require_roles('ADMIN')
def partial_consultations():
    q = (request.args.get('q') or '').strip().lower()
    specialist_id = request.args.get('specialist_id') or ''
    page, per_page = _pagination_args()
    query = ConsultationNote.select().where(ConsultationNote.is_deleted == False)  # noqa: E712
    if specialist_id.isdigit():
        query = query.where(ConsultationNote.specialist_id == int(specialist_id))
    notes = list(query.order_by(ConsultationNote.created_at.desc()))
    appts = {a.id: a for a in Appointment.select()}
    patients = {p.id: p.full_name for p in Patient.select()}
    users = {u.id: f"{u.full_name} ({u.user_id})" for u in User.select()}
    rx_counts = {}
    for rx in Prescription.select().where(Prescription.is_deleted == False):  # noqa: E712
        if rx.consultation_note_id:
            rx_counts[rx.consultation_note_id] = rx_counts.get(rx.consultation_note_id, 0) + 1
    if q:
        def _hit(n):
            a = appts.get(n.appointment_id)
            blob = ' '.join([
                n.diagnosis or '', n.recommendations or '',
                patients.get(a.patient_id, '') if a else '',
                users.get(n.specialist_id, ''),
            ]).lower()
            return q in blob
        notes = [n for n in notes if _hit(n)]
    notes, total, page, total_pages = _paginate_list(notes, page, per_page)
    return render_template('admin/_consultation_rows.html', notes=notes, appts=appts,
                           patients=patients, users=users, rx_counts=rx_counts,
                           total=total, page=page, total_pages=total_pages,
                           q=request.args.get('q', ''), specialist_id=specialist_id)


@admin_web_bp.route('/partials/labs')
@jwt_required()
@require_roles('ADMIN')
def partial_labs():
    status = request.args.get('status') or ''
    clinic_id = request.args.get('clinic_id') or ''
    q = (request.args.get('q') or '').strip().lower()
    compact = request.args.get('compact') == '1'
    page, per_page = _pagination_args()
    query = LabRequest.select().where(LabRequest.is_deleted == False)  # noqa: E712
    if status:
        query = query.where(LabRequest.status == status)
    rows = list(query.order_by(LabRequest.created_at.desc()))
    patients = {p.id: p.full_name for p in Patient.select()}
    pclinics = {p.id: p.clinic_id for p in Patient.select()}
    if clinic_id.isdigit():
        rows = [r for r in rows if pclinics.get(r.patient_id) == int(clinic_id)]
    if q:
        rows = [r for r in rows if q in (r.test_type or '').lower()
                or q in (patients.get(r.patient_id, '') or '').lower()]
    rows, total, page, total_pages = _paginate_list(rows, page, per_page)
    users = {u.id: u.full_name for u in User.select()}
    res_map = {}
    for res in LabResult.select().where(LabResult.is_deleted == False):  # noqa: E712
        res_map.setdefault(res.lab_request_id, (res.result_summary or '')[:60])
    return render_template('admin/_lab_rows.html', requests=rows, patients=patients,
                           users=users, results=res_map,
                           total=total, page=page, total_pages=total_pages,
                           status=status, q=request.args.get('q', ''),
                           clinic_id=clinic_id, compact=compact)


@admin_web_bp.route('/partials/prescriptions')
@jwt_required()
@require_roles('ADMIN')
def partial_prescriptions():
    q = (request.args.get('q') or '').strip().lower()
    dst = request.args.get('dst') or ''
    page, per_page = _pagination_args()
    rows = list(Prescription.select().where(Prescription.is_deleted == False).order_by(Prescription.created_at.desc()))  # noqa: E712
    patients = {p.id: p.full_name for p in Patient.select()}
    if q:
        rows = [p for p in rows if q in (p.medication_name or '').lower()
                or q in (patients.get(p.patient_id, '') or '').lower()]
    dmap = {}
    for d in Delivery.select().where(Delivery.is_deleted == False):  # noqa: E712
        dmap.setdefault(d.prescription_id, d.status)
    if dst == 'has':
        rows = [p for p in rows if p.id in dmap]
    elif dst == 'none':
        rows = [p for p in rows if p.id not in dmap]
    elif dst == 'failed':
        rows = [p for p in rows if dmap.get(p.id) == 'FAILED']
    rows, total, page, total_pages = _paginate_list(rows, page, per_page)
    users = {u.id: u.full_name for u in User.select()}
    return render_template('admin/_prescription_rows.html', prescriptions=rows,
                           patients=patients, users=users, dstatus=dmap,
                           total=total, page=page, total_pages=total_pages,
                           q=request.args.get('q', ''), dst=dst)


@admin_web_bp.route('/partials/deliveries')
@jwt_required()
@require_roles('ADMIN')
def partial_deliveries():
    status = request.args.get('status') or ''
    rider_id = request.args.get('rider_id') or ''
    unassigned = request.args.get('unassigned') == '1'
    motion = request.args.get('motion') == '1'
    compact = request.args.get('compact') == '1'
    q = (request.args.get('q') or '').strip().lower()
    page, per_page = _pagination_args()
    query = Delivery.select().where(Delivery.is_deleted == False)  # noqa: E712
    if motion:
        query = query.where(Delivery.status.in_(['PENDING', 'PICKED_UP', 'IN_TRANSIT']))
    elif status:
        query = query.where(Delivery.status == status)
    if rider_id == '__none':
        query = query.where(Delivery.rider_id.is_null(True))
    elif rider_id.isdigit():
        query = query.where(Delivery.rider_id == int(rider_id))
    elif unassigned:
        query = query.where(Delivery.rider_id.is_null(True))
    rows = list(query.order_by(Delivery.updated_at.desc()))
    users = {u.id: f"{u.full_name} ({u.user_id})" for u in User.select()}
    if q:
        rows = [d for d in rows if q in (d.delivery_address or '').lower()
                or q in (users.get(d.rider_id, '') or '').lower()]
    rows, total, page, total_pages = _paginate_list(rows, page, per_page)
    riders = list(User.select().where(
        (User.is_deleted == False) & (User.role == 'RIDER') & (User.active == True)  # noqa: E712
    ).order_by(User.full_name.asc()))
    return render_template('admin/_delivery_rows.html', deliveries=rows, users=users,
                           riders=riders,
                           total=total, page=page, total_pages=total_pages,
                           status=status, q=request.args.get('q', ''),
                           rider_id=rider_id, unassigned=unassigned, compact=compact)


@admin_web_bp.route('/partials/notifications/mine-count')
@jwt_required()
@require_roles('ADMIN')
def partial_mine_count():
    me = int(get_jwt_identity())
    unread = Notification.select().where(
        (Notification.is_deleted == False) & (Notification.user_id == me) & (Notification.read_at.is_null())  # noqa: E712
    ).count()
    return jsonify({'unread': unread})


@admin_web_bp.route('/partials/notifications/mine')
@jwt_required()
@require_roles('ADMIN')
def partial_mine():
    me = int(get_jwt_identity())
    notes = list(Notification.select().where(
        (Notification.is_deleted == False) & (Notification.user_id == me)  # noqa: E712
    ).order_by(Notification.created_at.desc()).limit(8))
    users = {u.id: u.full_name for u in User.select()}
    patients = {p.id: p.full_name for p in Patient.select()}
    events = {}
    for n in notes:
        t = (n.title or '').upper()
        if 'APPOINT' in t or 'CONSULT' in t:
            events[n.id] = 'appointment'
        elif 'LAB' in t or 'RESULT' in t:
            events[n.id] = 'lab'
        elif 'PRESCR' in t or 'MEDICATION' in t:
            events[n.id] = 'prescription'
        elif 'DELIVER' in t or 'RIDER' in t:
            events[n.id] = 'delivery'
        else:
            events[n.id] = 'general'
    return render_template('admin/_notification_rows.html', notifications=notes, users=users,
                           patients=patients, events=events, by_role={},
                           total=len(notes), page=1, total_pages=1, q='', unread='', role='', event='')


@admin_web_bp.route('/partials/notifications')
@jwt_required()
@require_roles('ADMIN')
def partial_notifications():
    q = (request.args.get('q') or '').strip().lower()
    unread = request.args.get('unread') or ''
    role = request.args.get('role') or ''
    event = request.args.get('event') or ''
    page, per_page = _pagination_args()
    query = Notification.select().where(Notification.is_deleted == False)  # noqa: E712
    if unread == '1':
        query = query.where(Notification.read_at.is_null())
    elif unread == '0':
        query = query.where(Notification.read_at.is_null(False))
    rows = list(query.order_by(Notification.created_at.desc()))
    users = {u.id: u for u in User.select()}
    user_names = {i: u.full_name for i, u in users.items()}
    patients = {p.id: p.full_name for p in Patient.select()}

    def _event_of(n):
        t = (n.title or '').upper()
        if 'APPOINT' in t or 'CONSULT' in t:
            return 'appointment'
        if 'LAB' in t or 'RESULT' in t:
            return 'lab'
        if 'PRESCR' in t or 'MEDICATION' in t:
            return 'prescription'
        if 'DELIVER' in t or 'RIDER' in t or 'PICKUP' in t or 'TRANSIT' in t:
            return 'delivery'
        return 'general'
    events = {n.id: _event_of(n) for n in rows}
    if event:
        rows = [n for n in rows if events.get(n.id) == event]
    if role:
        rows = [n for n in rows if users.get(n.user_id) and users[n.user_id].role == role]
    if q:
        rows = [n for n in rows if q in (n.title or '').lower() or q in (n.message or '').lower()
                or q in (patients.get(n.patient_id, '') or '').lower()]
    # unread breakdown by role (over current unread filter, before pagination)
    by_role = {}
    for n in rows:
        if not n.read_at:
            r = users[n.user_id].role if users.get(n.user_id) else '—'
            by_role[r] = by_role.get(r, 0) + 1
    rows, total, page, total_pages = _paginate_list(rows, page, per_page)
    return render_template('admin/_notification_rows.html', notifications=rows, users=user_names,
                           patients=patients, events=events, by_role=by_role,
                           total=total, page=page, total_pages=total_pages, per_page=per_page,
                           q=request.args.get('q', ''), unread=unread, role=role, event=event)


@admin_web_bp.route('/partials/audit-logs')
@jwt_required()
@require_roles('ADMIN')
def partial_audit():
    import json
    entity_type = request.args.get('entity_type') or ''
    user_id = request.args.get('user_id') or ''
    page, per_page = _pagination_args()
    query = AuditLog.select().where(AuditLog.is_deleted == False)  # noqa: E712
    if entity_type:
        query = query.where(AuditLog.entity_type == entity_type)
    if user_id.isdigit():
        query = query.where(AuditLog.user_id == int(user_id))
    total = query.count()
    total_pages = max((total + per_page - 1) // per_page, 1)
    page = min(page, total_pages)
    logs = list(query.order_by(AuditLog.created_at.desc()).paginate(page, per_page))
    users = {u.id: f"{u.full_name} ({u.user_id})" for u in User.select()}
    parsed = {}
    for l in logs:
        try:
            parsed[l.id] = json.loads(l.details) if l.details else None
        except (TypeError, ValueError):
            parsed[l.id] = {'raw': (l.details or '')[:300]}
    return render_template('admin/_audit_rows.html', logs=list(logs), users=users,
                           details=parsed,
                           total=total, page=page, total_pages=total_pages, per_page=per_page,
                           entity_type=entity_type,
                           user_id=user_id if user_id.isdigit() else '')
