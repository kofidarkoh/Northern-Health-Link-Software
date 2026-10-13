import logging
import json
from app.models.audit_log import AuditLog
from app.models.user import User

logger = logging.getLogger(__name__)


def record_audit(user_id, action, entity_type, entity_id=None, details=None):
    try:
        user = User.get_or_none(User.id == user_id)
        if not user:
            logger.warning("Audit log skipped: user %s not found", user_id)
            return

        details_json = json.dumps(details) if details else None

        AuditLog.create(
            user_id=user_id,
            action=action,
            entity_type=entity_type,
            entity_id=str(entity_id) if entity_id else None,
            details=details_json
        )
    except Exception as e:
        logger.error("Audit log error for action=%s entity=%s: %s", action, entity_type, e)
