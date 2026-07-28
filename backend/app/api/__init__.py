from flask import Blueprint

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')
patients_bp = Blueprint('patients', __name__, url_prefix='/api/patients')
clinical_bp = Blueprint('clinical', __name__, url_prefix='/api/clinical')
prescriptions_bp = Blueprint('prescriptions', __name__, url_prefix='/api/prescriptions')
deliveries_bp = Blueprint('deliveries', __name__, url_prefix='/api/deliveries')
notifications_bp = Blueprint('notifications', __name__, url_prefix='/api/notifications')
admin_bp = Blueprint('admin', __name__, url_prefix='/api/admin')
lab_bp = Blueprint('lab', __name__, url_prefix='/api/lab')

from app.api import auth, patients, clinical, prescriptions, deliveries, notifications, admin, lab


def register_blueprints(app):
    app.register_blueprint(auth_bp)
    app.register_blueprint(patients_bp)
    app.register_blueprint(clinical_bp)
    app.register_blueprint(prescriptions_bp)
    app.register_blueprint(deliveries_bp)
    app.register_blueprint(notifications_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(lab_bp)
