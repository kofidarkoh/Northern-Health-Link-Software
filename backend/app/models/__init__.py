import logging
from app.models.base import BaseModel
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
from app.database import get_database, db_proxy, connect_with_retry

logger = logging.getLogger(__name__)


def create_tables():
    try:
        db = get_database()
        if db_proxy.obj is None:
            db_proxy.initialize(db)

        if not connect_with_retry():
            raise RuntimeError("Cannot connect to database for table creation")

        db.create_tables([
            Clinic,
            User,
            Patient,
            Appointment,
            ConsultationNote,
            LabRequest,
            LabResult,
            Prescription,
            Delivery,
            Notification,
            AuditLog
        ], safe=True)

        db.close()
        logger.info("Database tables created successfully")

        _migrate_fcm_token()
    except Exception as e:
        logger.exception("Failed to create database tables: %s", e)
        raise


def _migrate_fcm_token():
    """Add fcm_token column to users table if it doesn't exist."""
    try:
        db = get_database()
        if db_proxy.obj is None:
            db_proxy.initialize(db)
        cursor = db.execute_sql(
            "SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS "
            "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'fcm_token'"
        )
        if cursor.fetchone()[0] == 0:
            db.execute_sql("ALTER TABLE users ADD COLUMN fcm_token VARCHAR(255) NULL")
            logger.info("Added fcm_token column to users table")
        db.close()
    except Exception as e:
        logger.warning("fcm_token migration skipped: %s", e)


__all__ = [
    'BaseModel',
    'Clinic',
    'User',
    'Patient',
    'Appointment',
    'ConsultationNote',
    'LabRequest',
    'LabResult',
    'Prescription',
    'Delivery',
    'Notification',
    'AuditLog',
    'create_tables'
]
