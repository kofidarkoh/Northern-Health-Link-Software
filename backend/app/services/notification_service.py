import logging
from datetime import datetime
from app.models.notification import Notification
from app.extensions import socketio
from app.services.push_service import send_push_to_user

logger = logging.getLogger(__name__)


def create_notification(user_id, title, message, patient_id=None, user=None):
    try:
        notification = Notification.create(
            user_id=user_id,
            patient_id=patient_id,
            title=title,
            message=message
        )

        try:
            socketio.emit('notification', notification.to_dict(), room=f'user_{user_id}')
        except Exception as e:
            logger.warning("SocketIO emit failed for notification to user %s: %s", user_id, e)

        try:
            if user is None:
                from app.models.user import User
                user = User.get_or_none(User.id == user_id)
            send_push_to_user(user, title, message, {'notification_id': str(notification.id)})
        except Exception:
            pass

        return notification
    except Exception as e:
        logger.error("Notification create error for user %s: %s", user_id, e)
        return None


def get_user_notifications(user_id, unread_only=False):
    query = Notification.select().where(
        (Notification.user_id == user_id) &
        (Notification.is_deleted == False)
    )

    if unread_only:
        query = query.where(Notification.read_at.is_null())

    return query.order_by(Notification.created_at.desc())


def mark_notification_read(notification_id, user_id):
    notification = Notification.get_or_none(
        (Notification.id == notification_id) &
        (Notification.user_id == user_id)
    )
    if notification:
        notification.read_at = datetime.now()
        notification.save()
        return True
    return False
