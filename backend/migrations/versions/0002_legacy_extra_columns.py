"""0002 — columns added ad-hoc after the initial deploy.

These columns were previously patched onto live databases by
``_migrate_columns()`` at every app boot (see ``app/models/__init__.py``,
now deprecated). This migration captures them as an explicit, recorded
version so ``schema_migrations`` reflects reality and boot no longer
mutates the schema. Idempotent: each ALTER is guarded by an
INFORMATION_SCHEMA check, so it is safe to run on databases that already
received the old boot-time patch.
"""

COLUMNS = [
    ('users', 'fcm_token', 'VARCHAR(255) NULL'),
    ('users', 'security_question', 'VARCHAR(200) NULL'),
    ('users', 'security_answer', 'VARCHAR(200) NULL'),
    ('clinics', 'ownership', "VARCHAR(20) NOT NULL DEFAULT 'PUBLIC'"),
    ('clinics', 'address', 'VARCHAR(255) NULL'),
    ('patients', 'address', 'VARCHAR(255) NULL'),
]


def up(db):
    """Apply migration."""
    for table, column, col_type in COLUMNS:
        cursor = db.execute_sql(
            "SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS "
            "WHERE TABLE_SCHEMA = DATABASE() "
            f"AND TABLE_NAME = '{table}' AND COLUMN_NAME = '{column}'"
        )
        if cursor.fetchone()[0] == 0:
            db.execute_sql(f"ALTER TABLE {table} ADD COLUMN {column} {col_type}")


def down(db):
    """Rollback migration."""
    for table, column, _col_type in COLUMNS:
        cursor = db.execute_sql(
            "SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS "
            "WHERE TABLE_SCHEMA = DATABASE() "
            f"AND TABLE_NAME = '{table}' AND COLUMN_NAME = '{column}'"
        )
        if cursor.fetchone()[0] > 0:
            db.execute_sql(f"ALTER TABLE {table} DROP COLUMN {column}")
