import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app
from app.database import get_database, init_db_proxy
from app.models.clinic import Clinic
from app.models.user import User
from app.models.patient import Patient
from app.models.appointment import Appointment
from app.models.consultation import ConsultationNote
from app.models.lab import LabRequest, LabResult
from app.models.prescription import Prescription
from app.models.delivery import Delivery
from app.models.notification import Notification
from app.models.audit_log import AuditLog


def reset_and_seed():
    app = create_app()
    with app.app_context():
        db = get_database()
        init_db_proxy()

        print("Dropping all tables...")
        db.execute_sql('SET FOREIGN_KEY_CHECKS = 0')
        for model in [Notification, AuditLog, Delivery, Prescription, LabResult, LabRequest, ConsultationNote, Appointment, Patient, User, Clinic]:
            table_name = model._meta.table_name
            db.execute_sql(f'DROP TABLE IF EXISTS {table_name}')
            print(f"  Dropped: {table_name}")
        db.execute_sql('SET FOREIGN_KEY_CHECKS = 1')

        print("\nCreating tables...")
        db.create_tables([Clinic, User, Patient, Appointment, ConsultationNote, LabRequest, LabResult, Prescription, Delivery, Notification, AuditLog])
        print("  All tables created.")

        print("\nSeeding data...")
        from seed import seed_database
        seed_database()


if __name__ == '__main__':
    reset_and_seed()
