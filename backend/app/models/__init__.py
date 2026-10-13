import logging
import os
from app.models.base import BaseModel
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
from app.models.system_setting import SystemSetting
from app.database import get_database, db_proxy, connect_with_retry, get_last_connection_error

logger = logging.getLogger(__name__)


def create_tables():
    try:
        db = get_database()
        if db_proxy.obj is None:
            db_proxy.initialize(db)

        if not connect_with_retry():
            last_err = get_last_connection_error()
            raise RuntimeError(
                f"Cannot connect to database for table creation "
                f"({os.environ.get('MYSQL_HOST', 'localhost')}:"
                f"{os.environ.get('MYSQL_PORT', 3306)}/"
                f"{os.environ.get('MYSQL_DATABASE', 'nhls_dev')}): {last_err}"
            )

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
            District,
            Notification,
            AuditLog,
            SystemSetting
        ], safe=True)

        db.close()
        logger.info("Database tables created successfully")

        # NOTE: schema changes are versioned in migrations/versions/ — run
        # `python migrate.py migrate` on deploy. The old boot-time ALTER
        # patching (_migrate_columns, deprecated below) no longer runs here.
    except Exception as e:
        logger.exception("Failed to create database tables: %s", e)
        raise


def _add_column_if_missing(db, table, column, col_type):
    cursor = db.execute_sql(
        "SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS "
        f"WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = '{table}' AND COLUMN_NAME = '{column}'"
    )
    if cursor.fetchone()[0] == 0:
        db.execute_sql(f"ALTER TABLE {table} ADD COLUMN {column} {col_type}")
        logger.info("Added %s column to %s table", column, table)


def _migrate_columns():
    """DEPRECATED fallback — do not call from ``create_tables``.

    Boot-time ALTER patching is superseded by versioned migrations in
    ``backend/migrations/versions/`` (run via ``python migrate.py migrate``;
    0002_legacy_extra_columns covers exactly these columns idempotently).
    Kept only so old deployment notes referencing it stay searchable.
    """
    try:
        db = get_database()
        if db_proxy.obj is None:
            db_proxy.initialize(db)
        _add_column_if_missing(db, 'users', 'fcm_token', 'VARCHAR(255) NULL')
        _add_column_if_missing(db, 'users', 'security_question', 'VARCHAR(200) NULL')
        _add_column_if_missing(db, 'users', 'security_answer', 'VARCHAR(200) NULL')
        _add_column_if_missing(db, 'clinics', 'ownership', "VARCHAR(20) NOT NULL DEFAULT 'PUBLIC'")
        _add_column_if_missing(db, 'clinics', 'address', 'VARCHAR(255) NULL')
        _add_column_if_missing(db, 'patients', 'address', 'VARCHAR(255) NULL')
        db.close()
    except Exception as e:
        logger.warning("Column migration skipped: %s", e)


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
    'District',
    'Notification',
    'AuditLog',
    'SystemSetting',
    'create_tables'
]
