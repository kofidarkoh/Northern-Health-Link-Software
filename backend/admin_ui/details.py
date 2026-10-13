"""Admin detail-drawer endpoints (read-only, ADMIN JWT required)."""
from flask import render_template
from flask_jwt_extended import jwt_required

from admin_ui import admin_web_bp
from app.middleware.auth import require_roles
from app.models.appointment import Appointment
from app.models.audit_log import AuditLog
from app.models.clinic import Clinic
from app.models.consultation import ConsultationNote
from app.models.delivery import Delivery
from app.models.lab import LabRequest, LabResult
from app.models.patient import Patient
from app.models.prescription import Prescription
from app.models.user import User


# ---------- detail drawers (read-only, ADMIN) ----------
@admin_web_bp.route('/partials/users/<int:uid>')
@jwt_required()
@require_roles('ADMIN')
def partial_user_detail(uid):
    u = User.get_or_none(User.id == uid)
    if not u or u.is_deleted:
        return '<div class="alert err">User not found.</div>', 404
    clinic = Clinic.get_or_none(Clinic.id == u.clinic_id)
    return render_template('admin/_user_detail.html', u=u, clinic=clinic)


@admin_web_bp.route('/partials/patients/<int:pid>')
@jwt_required()
@require_roles('ADMIN')
def partial_patient_detail(pid):
    p = Patient.get_or_none(Patient.id == pid)
    if not p or p.is_deleted:
        return '<div class="alert err">Patient not found.</div>', 404
    clinic = Clinic.get_or_none(Clinic.id == p.clinic_id)
    reg = User.get_or_none(User.id == p.registered_by_id)
    appts = list(Appointment.select().where(
        (Appointment.patient_id == p.id) & (Appointment.is_deleted == False)  # noqa: E712
    ).order_by(Appointment.appointment_time.desc()).limit(10))
    labs = list(LabRequest.select().where(
        (LabRequest.patient_id == p.id) & (LabRequest.is_deleted == False)  # noqa: E712
    ).order_by(LabRequest.created_at.desc()).limit(10))
    rxs = list(Prescription.select().where(
        (Prescription.patient_id == p.id) & (Prescription.is_deleted == False)  # noqa: E712
    ).order_by(Prescription.created_at.desc()).limit(10))
    users = {u.id: u.full_name for u in User.select()}
    return render_template('admin/_patient_detail.html', p=p, clinic=clinic, reg=reg,
                           appts=appts, labs=labs, rxs=rxs, users=users)


@admin_web_bp.route('/partials/appointments/<int:aid>')
@jwt_required()
@require_roles('ADMIN')
def partial_appointment_detail(aid):
    a = Appointment.get_or_none(Appointment.id == aid)
    if not a or a.is_deleted:
        return '<div class="alert err">Appointment not found.</div>', 404
    patient = Patient.get_or_none(Patient.id == a.patient_id)
    clinic = Clinic.get_or_none(Clinic.id == a.clinic_id)
    spec = User.get_or_none(User.id == a.specialist_id)
    note = ConsultationNote.get_or_none(ConsultationNote.appointment_id == a.id)
    rxs = []
    if note:
        rxs = list(Prescription.select().where(
            (Prescription.consultation_note_id == note.id) & (Prescription.is_deleted == False)  # noqa: E712
        ))
    return render_template('admin/_appointment_detail.html', a=a, patient=patient,
                           clinic=clinic, spec=spec, note=note, rxs=rxs)


@admin_web_bp.route('/partials/labs/<int:lid>')
@jwt_required()
@require_roles('ADMIN')
def partial_lab_detail(lid):
    r = LabRequest.get_or_none(LabRequest.id == lid)
    if not r or r.is_deleted:
        return '<div class="alert err">Lab request not found.</div>', 404
    patient = Patient.get_or_none(Patient.id == r.patient_id)
    req = User.get_or_none(User.id == r.requested_by_id)
    res = LabResult.get_or_none(LabResult.lab_request_id == r.id)
    uploader = User.get_or_none(User.id == res.uploaded_by_id) if res else None
    return render_template('admin/_lab_detail.html', r=r, patient=patient,
                           req=req, res=res, uploader=uploader)


@admin_web_bp.route('/partials/prescriptions/<int:xid>')
@jwt_required()
@require_roles('ADMIN')
def partial_prescription_detail(xid):
    p = Prescription.get_or_none(Prescription.id == xid)
    if not p or p.is_deleted:
        return '<div class="alert err">Prescription not found.</div>', 404
    patient = Patient.get_or_none(Patient.id == p.patient_id)
    doc = User.get_or_none(User.id == p.prescribed_by_id)
    note = ConsultationNote.get_or_none(ConsultationNote.id == p.consultation_note_id) if p.consultation_note_id else None
    appt = Appointment.get_or_none(Appointment.id == note.appointment_id) if note else None
    delivery = Delivery.get_or_none(
        (Delivery.prescription_id == p.id) & (Delivery.is_deleted == False))  # noqa: E712
    rider = User.get_or_none(User.id == delivery.rider_id) if delivery and delivery.rider_id else None
    return render_template('admin/_prescription_detail.html', p=p, patient=patient,
                           doc=doc, note=note, appt=appt, delivery=delivery, rider=rider)


@admin_web_bp.route('/partials/deliveries/<int:did>')
@jwt_required()
@require_roles('ADMIN')
def partial_delivery_detail(did):
    d = Delivery.get_or_none(Delivery.id == did)
    if not d or d.is_deleted:
        return '<div class="alert err">Delivery not found.</div>', 404
    rx = Prescription.get_or_none(Prescription.id == d.prescription_id)
    patient = Patient.get_or_none(Patient.id == rx.patient_id) if rx else None
    rider = User.get_or_none(User.id == d.rider_id) if d.rider_id else None
    requester = User.get_or_none(User.id == d.requested_by_id)
    return render_template('admin/_delivery_detail.html', d=d, rx=rx,
                           patient=patient, rider=rider, requester=requester)


@admin_web_bp.route('/partials/audit-logs/<int:lid>')
@jwt_required()
@require_roles('ADMIN')
def partial_audit_detail(lid):
    import json
    l = AuditLog.get_or_none(AuditLog.id == lid)
    if not l or l.is_deleted:
        return '<div class="alert err">Audit event not found.</div>', 404
    actor = User.get_or_none(User.id == l.user_id)
    try:
        parsed = json.loads(l.details) if l.details else None
    except (TypeError, ValueError):
        parsed = {'raw': (l.details or '')[:2000]}
    return render_template('admin/_audit_detail.html', l=l, actor=actor, details=parsed)
