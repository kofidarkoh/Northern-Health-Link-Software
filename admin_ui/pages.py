"""Admin shell pages (unauthenticated static shells; data loads via gated partials)."""
from flask import render_template

from admin_ui import admin_web_bp
from app.models.clinic import Clinic
from app.models.user import User


# ---------- pages ----------
@admin_web_bp.route('/login')
def login_page():
    return render_template('admin/login.html', active='')


@admin_web_bp.route('/')
def dashboard_page():
    return render_template('admin/dashboard.html', active='dashboard')


@admin_web_bp.route('/users')
def users_page():
    clinics = Clinic.select().where(Clinic.is_deleted == False).order_by(Clinic.name.asc())  # noqa: E712
    return render_template('admin/users.html', clinics=list(clinics), active='users')


@admin_web_bp.route('/clinics')
def clinics_page():
    from app.models.district import District
    districts = list(District.select().where(District.is_deleted == False).order_by(District.name.asc()))  # noqa: E712
    return render_template('admin/clinics.html', districts=districts,
                           ownerships=Clinic.OWNERSHIP_CHOICES, active='clinics')


@admin_web_bp.route('/patients')
def patients_page():
    clinics = Clinic.select().where(Clinic.is_deleted == False).order_by(Clinic.name.asc())  # noqa: E712
    return render_template('admin/patients.html', clinics=list(clinics), active='patients')


@admin_web_bp.route('/appointments')
def appointments_page():
    specialists = list(User.select().where(
        (User.is_deleted == False) & (User.role == 'SPECIALIST')  # noqa: E712
    ).order_by(User.full_name.asc()))
    clinics = list(Clinic.select().where(Clinic.is_deleted == False).order_by(Clinic.name.asc()))  # noqa: E712
    return render_template('admin/appointments.html', specialists=specialists,
                           clinics=clinics, active='appointments')


@admin_web_bp.route('/labs')
def labs_page():
    clinics = list(Clinic.select().where(Clinic.is_deleted == False).order_by(Clinic.name.asc()))  # noqa: E712
    return render_template('admin/labs.html', clinics=clinics, active='labs')


@admin_web_bp.route('/prescriptions')
def prescriptions_page():
    return render_template('admin/prescriptions.html', active='prescriptions')


@admin_web_bp.route('/deliveries')
def deliveries_page():
    riders = list(User.select().where(
        (User.is_deleted == False) & (User.role == 'RIDER') & (User.active == True)  # noqa: E712
    ).order_by(User.full_name.asc()))
    return render_template('admin/deliveries.html', riders=riders, active='deliveries')


@admin_web_bp.route('/notifications')
def notifications_page():
    clinics = Clinic.select().where(Clinic.is_deleted == False).order_by(Clinic.name.asc())  # noqa: E712
    return render_template('admin/notifications.html', clinics=list(clinics), active='notifications')


@admin_web_bp.route('/consultations')
def consultations_page():
    specialists = User.select().where(
        (User.is_deleted == False) & (User.role == 'SPECIALIST')  # noqa: E712
    ).order_by(User.full_name.asc())
    return render_template('admin/consultations.html', specialists=list(specialists),
                           active='consultations')


@admin_web_bp.route('/reports')
def reports_page():
    return render_template('admin/reports.html', active='reports')


@admin_web_bp.route('/settings')
def settings_page():
    from datetime import datetime
    from flask import current_app
    import os
    from app.models.system_setting import SETTING_META, get_settings
    cfg = current_app.config
    cors = cfg.get('CORS_ORIGINS', [])
    try:
        User.select().limit(1).count()
        db_status = 'reachable'
    except Exception:
        db_status = 'unreachable'
    info = {
        'env': os.environ.get('FLASK_ENV', 'development'),
        'debug': bool(cfg.get('DEBUG', False)),
        'server_time': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        'db_status': db_status,
        'jwt_access_expires_s': int(cfg.get('JWT_ACCESS_TOKEN_EXPIRES', 1800)),
        'jwt_refresh_expires_s': int(cfg.get('JWT_REFRESH_TOKEN_EXPIRES', 259200)),
        'cors_origin_count': len(cors) if isinstance(cors, list) else 0,
        'db_host': cfg.get('MYSQL_HOST', ''),
        'db_name': cfg.get('MYSQL_DATABASE', ''),
        'db_user': cfg.get('MYSQL_USER', ''),
        'db_password_set': bool(os.environ.get('MYSQL_PASSWORD')),
        'db_ssl': bool(cfg.get('MYSQL_SSL_CA')),
        'redis_configured': bool(os.environ.get('REDIS_URL')),
        'socketio_queue': bool(cfg.get('SOCKETIO_MESSAGE_QUEUE', False)),
        'upload_folder': cfg.get('UPLOAD_FOLDER', ''),
        'max_upload_mb': round(int(cfg.get('MAX_CONTENT_LENGTH', 16777216)) / (1024 * 1024), 1),
        'cache_type': str(cfg.get('CACHE_TYPE', '—')),
    }
    return render_template('admin/settings.html', info=info,
                           settings=get_settings(), meta=SETTING_META, active='settings')


@admin_web_bp.route('/audit-logs')
def audit_page():
    users = User.select().where(User.is_deleted == False).order_by(User.full_name.asc())  # noqa: E712
    return render_template('admin/audit.html', users=list(users), active='audit')


@admin_web_bp.route('/account')
def account_page():
    return render_template('admin/account.html', active='account')
