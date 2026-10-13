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
from app.models.district import District
from app.models.notification import Notification
from app.models.audit_log import AuditLog


def seed_districts():
    from migrate_clinics import NORTHERN_MMDAS
    added = 0
    for name, atype, capital in NORTHERN_MMDAS:
        _, created = District.get_or_create(
            name=name,
            defaults={'region': 'Northern', 'assembly_type': atype,
                      'capital': capital})
        added += int(created)
    print(f"  Seeded districts: {added} new, {District.select().count()} total.")


def reset_and_seed():
    app = create_app()
    with app.app_context():
        db = get_database()
        init_db_proxy()

        print("Dropping all tables...")
        db.execute_sql('SET FOREIGN_KEY_CHECKS = 0')
        for model in [Notification, AuditLog, Delivery, Prescription, LabResult, LabRequest, ConsultationNote, Appointment, Patient, User, Clinic, District]:
            table_name = model._meta.table_name
            db.execute_sql(f'DROP TABLE IF EXISTS {table_name}')
            print(f"  Dropped: {table_name}")
        db.execute_sql('SET FOREIGN_KEY_CHECKS = 1')

        print("\nCreating tables...")
        db.create_tables([Clinic, User, Patient, Appointment, ConsultationNote, LabRequest, LabResult, Prescription, Delivery, District, Notification, AuditLog])
        print("  All tables created.")

        print("\nSeeding districts...")
        seed_districts()

        print("\nSeeding data...")
        from seed import seed_database
        seed_database()


if __name__ == '__main__':
    reset_and_seed()
