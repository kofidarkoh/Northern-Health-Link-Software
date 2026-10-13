"""0001 — initial schema: create all tables.

Fresh installs get the full schema from the current models. Pre-existing
databases are unaffected thanks to ``safe=True``; incremental changes live
in later migrations (see 0002).
"""


def up(db):
    """Apply migration."""
    from app.models import (
        Clinic, User, Patient, Appointment, ConsultationNote,
        LabRequest, LabResult, Prescription, Delivery, District,
        Notification, AuditLog, SystemSetting,
    )
    db.create_tables([
        Clinic, User, Patient, Appointment, ConsultationNote,
        LabRequest, LabResult, Prescription, Delivery, District,
        Notification, AuditLog, SystemSetting,
    ], safe=True)


def down(db):
    """Rollback migration."""
    from app.models import (
        AuditLog, Notification, District, Delivery, Prescription,
        LabResult, LabRequest, ConsultationNote, Appointment, Patient,
        User, Clinic, SystemSetting,
    )
    db.drop_tables([
        SystemSetting, AuditLog, Notification, District, Delivery,
        Prescription, LabResult, LabRequest, ConsultationNote,
        Appointment, Patient, User, Clinic,
    ], safe=True)
