"""
Simple migration runner for NHLS backend.
Usage:
  python migrate.py init       — Create initial migration from current models
  python migrate.py migrate    — Run pending migrations
  python migrate.py status     — Show migration status
"""
import sys
import os
import importlib
import logging
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s: %(message)s')
logger = logging.getLogger(__name__)

MIGRATIONS_DIR = os.path.join(os.path.dirname(__file__), 'migrations', 'versions')


def get_db():
    from app.database import get_database, init_db_proxy
    db = get_database()
    init_db_proxy()
    return db


def ensure_migration_table(db):
    db.execute_sql("""
        CREATE TABLE IF NOT EXISTS schema_migrations (
            id INT AUTO_INCREMENT PRIMARY KEY,
            version VARCHAR(50) NOT NULL UNIQUE,
            name VARCHAR(255) NOT NULL,
            applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)


def get_applied(db):
    cursor = db.execute_sql("SELECT version FROM schema_migrations ORDER BY version")
    return {row[0] for row in cursor.fetchall()}


def get_pending(applied):
    if not os.path.exists(MIGRATIONS_DIR):
        return []
    files = sorted(f for f in os.listdir(MIGRATIONS_DIR) if f.endswith('.py') and not f.startswith('_'))
    pending = []
    for f in files:
        version = f.replace('.py', '')
        if version not in applied:
            pending.append((version, f))
    return pending


def cmd_init():
    db = get_db()
    ensure_migration_table(db)

    os.makedirs(MIGRATIONS_DIR, exist_ok=True)

    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    migration_file = os.path.join(MIGRATIONS_DIR, f'{timestamp}_initial.py')

    migration_content = '''"""
Initial migration — create all tables.
"""

def up(db):
    """Apply migration."""
    from app.models import (
        Clinic, User, Patient, Appointment, ConsultationNote,
        LabRequest, LabResult, Prescription, Delivery, Notification, AuditLog
    )
    db.create_tables([
        Clinic, User, Patient, Appointment, ConsultationNote,
        LabRequest, LabResult, Prescription, Delivery, Notification, AuditLog
    ], safe=True)


def down(db):
    """Rollback migration."""
    from app.models import (
        AuditLog, Notification, Delivery, Prescription, LabResult, LabRequest,
        ConsultationNote, Appointment, Patient, User, Clinic
    )
    db.drop_tables([
        AuditLog, Notification, Delivery, Prescription, LabResult, LabRequest,
        ConsultationNote, Appointment, Patient, User, Clinic
    ], safe=True)
'''
    with open(migration_file, 'w') as f:
        f.write(migration_content)

    db.execute_sql(
        "INSERT INTO schema_migrations (version, name) VALUES (%s, %s)",
        [timestamp, 'initial']
    )
    db.close()
    logger.info("Initial migration created: %s", migration_file)


def cmd_migrate():
    db = get_db()
    ensure_migration_table(db)
    applied = get_applied(db)
    pending = get_pending(applied)

    if not pending:
        logger.info("No pending migrations.")
        return

    for version, filename in pending:
        logger.info("Applying migration: %s", filename)
        spec = importlib.util.spec_from_file_location(
            f'migration_{version}',
            os.path.join(MIGRATIONS_DIR, filename)
        )
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)

        module.up(db)

        db.execute_sql(
            "INSERT INTO schema_migrations (version, name) VALUES (%s, %s)",
            [version, filename.replace('.py', '')]
        )
        logger.info("Applied: %s", filename)

    db.close()
    logger.info("All migrations applied.")


def cmd_status():
    db = get_db()
    ensure_migration_table(db)
    applied = get_applied(db)
    pending = get_pending(applied)

    print("\n=== Migration Status ===")
    print(f"Applied: {len(applied)}")
    print(f"Pending: {len(pending)}")

    if applied:
        print("\nApplied migrations:")
        for v in sorted(applied):
            print(f"  [x] {v}")

    if pending:
        print("\nPending migrations:")
        for v, f in pending:
            print(f"  [ ] {v} ({f})")

    db.close()


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)

    command = sys.argv[1]
    if command == 'init':
        cmd_init()
    elif command == 'migrate':
        cmd_migrate()
    elif command == 'status':
        cmd_status()
    else:
        print(f"Unknown command: {command}")
        print(__doc__)
        sys.exit(1)
