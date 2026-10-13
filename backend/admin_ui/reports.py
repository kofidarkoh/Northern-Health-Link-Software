"""Admin reports partial + windowed CSV exports (ADMIN JWT required)."""
from flask import render_template, request
from flask_jwt_extended import jwt_required

from admin_ui import admin_web_bp
from app.middleware.auth import require_roles
from app.models.appointment import Appointment
from app.models.consultation import ConsultationNote
from app.models.delivery import Delivery
from app.models.lab import LabRequest
from app.models.notification import Notification
from app.models.patient import Patient
from app.models.prescription import Prescription


# ---------- reports + CSV exports ----------
@admin_web_bp.route('/partials/reports')
@jwt_required()
@require_roles('ADMIN')
def partial_reports():
    from datetime import datetime, timedelta
    from peewee import fn
    try:
        days = min(max(int(request.args.get('days', 30)), 7), 365)
    except (TypeError, ValueError):
        days = 30
    since = datetime.now() - timedelta(days=days)
    appt_by_status = {r['status']: r['n'] for r in (
        Appointment.select(Appointment.status, fn.COUNT(Appointment.id).alias('n'))
        .where((Appointment.is_deleted == False) & (Appointment.created_at >= since))  # noqa: E712
        .group_by(Appointment.status).dicts())}
    del_by_status = {r['status']: r['n'] for r in (
        Delivery.select(Delivery.status, fn.COUNT(Delivery.id).alias('n'))
        .where((Delivery.is_deleted == False) & (Delivery.created_at >= since))  # noqa: E712
        .group_by(Delivery.status).dicts())}
    labs_requested = LabRequest.select().where(
        (LabRequest.is_deleted == False) & (LabRequest.status == 'REQUESTED')  # noqa: E712
    ).count()
    labs_done = LabRequest.select().where(
        (LabRequest.is_deleted == False) & (LabRequest.status == 'RESULT_UPLOADED')  # noqa: E712
    ).count()
    labs_requested_w = LabRequest.select().where(
        (LabRequest.is_deleted == False) & (LabRequest.status == 'REQUESTED')  # noqa: E712
        & (LabRequest.created_at >= since)
    ).count()
    labs_done_w = LabRequest.select().where(
        (LabRequest.is_deleted == False) & (LabRequest.status == 'RESULT_UPLOADED')  # noqa: E712
        & (LabRequest.created_at >= since)
    ).count()
    rx_30 = Prescription.select().where(
        (Prescription.is_deleted == False) & (Prescription.created_at >= since)  # noqa: E712
    ).count()
    consults_30 = ConsultationNote.select().where(
        (ConsultationNote.is_deleted == False) & (ConsultationNote.created_at >= since)  # noqa: E712
    ).count()
    patients_new = Patient.select().where(
        (Patient.is_deleted == False) & (Patient.created_at >= since)  # noqa: E712
    ).count()
    notifs_sent = Notification.select().where(
        (Notification.is_deleted == False) & (Notification.created_at >= since)  # noqa: E712
    ).count()
    top_districts = list(
        Patient.select(Patient.district, fn.COUNT(Patient.id).alias('n'))
        .where(Patient.is_deleted == False)  # noqa: E712
        .group_by(Patient.district).order_by(fn.COUNT(Patient.id).desc()).limit(10).dicts())
    district_total = sum((r['n'] or 0) for r in top_districts)
    return render_template('admin/_report_cards.html', days=days, since=since,
                           appt_by_status=appt_by_status, del_by_status=del_by_status,
                           labs_requested=labs_requested, labs_done=labs_done,
                           labs_requested_w=labs_requested_w, labs_done_w=labs_done_w,
                           rx_count=rx_30, consults=consults_30,
                           patients_new=patients_new, notifs_sent=notifs_sent,
                           top_districts=top_districts, district_total=district_total)


@admin_web_bp.route('/reports/appointments.csv')
@jwt_required()
@require_roles('ADMIN')
def reports_appointments_csv():
    import csv
    import io
    from datetime import datetime, timedelta
    from flask import Response
    try:
        days = min(max(int(request.args.get('days', 30)), 7), 365)
    except (TypeError, ValueError):
        days = 30
    since = datetime.now() - timedelta(days=days)
    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow(['id', 'patient', 'clinic', 'specialist', 'status',
                'appointment_time', 'created_at'])
    for a in Appointment.select().where(
            (Appointment.is_deleted == False) &  # noqa: E712
            (Appointment.created_at >= since)).order_by(Appointment.id.asc()):
        try:
            pname = a.patient.full_name if a.patient_id else ''
        except Exception:
            pname = ''
        try:
            cname = a.clinic.name if a.clinic_id else ''
        except Exception:
            cname = ''
        try:
            sname = a.specialist.full_name if a.specialist_id else ''
        except Exception:
            sname = ''
        w.writerow([a.id, pname, cname, sname, a.status,
                    a.appointment_time, a.created_at])
    return Response(buf.getvalue(), mimetype='text/csv',
                    headers={'Content-Disposition': 'attachment; filename=appointments.csv'})


@admin_web_bp.route('/reports/deliveries.csv')
@jwt_required()
@require_roles('ADMIN')
def reports_deliveries_csv():
    import csv
    import io
    from datetime import datetime, timedelta
    from flask import Response
    try:
        days = min(max(int(request.args.get('days', 30)), 7), 365)
    except (TypeError, ValueError):
        days = 30
    since = datetime.now() - timedelta(days=days)
    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow(['id', 'patient', 'medication', 'rider', 'status', 'address', 'updated_at'])
    for d in Delivery.select().where(
            (Delivery.is_deleted == False) &  # noqa: E712
            (Delivery.created_at >= since)).order_by(Delivery.id.asc()):
        try:
            rx = d.prescription
            pname = rx.patient.full_name if rx and rx.patient_id else ''
            med = rx.medication_name if rx else ''
        except Exception:
            pname, med = '', ''
        try:
            rname = d.rider.full_name if d.rider_id else ''
        except Exception:
            rname = ''
        w.writerow([d.id, pname, med, rname, d.status,
                    (d.delivery_address or '').replace('\n', ' '), d.updated_at])
    return Response(buf.getvalue(), mimetype='text/csv',
                    headers={'Content-Disposition': 'attachment; filename=deliveries.csv'})
