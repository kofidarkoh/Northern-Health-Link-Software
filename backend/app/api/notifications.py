import logging
from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.api import notifications_bp
from app.services.notification_service import (
    get_user_notifications, mark_notification_read
)
from app.extensions import limiter

logger = logging.getLogger(__name__)


@notifications_bp.route('/', methods=['GET'])
@jwt_required()
@limiter.limit("60 per minute")
def list_notifications():
    identity = get_jwt_identity()
    unread_only = request.args.get('unread_only', 'false').lower() == 'true'
    page = int(request.args.get('page', 1))
    per_page = min(int(request.args.get('per_page', 50)), 100)

    try:
        notifications = get_user_notifications(int(identity), unread_only)
        total = notifications.count()
        total_pages = (total + per_page - 1) // per_page if total > 0 else 1
        notifications = notifications.paginate(page, per_page)
    except Exception as e:
        logger.error("Failed to fetch notifications for user %s: %s", identity, e)
        return jsonify({'error': 'Failed to fetch notifications'}), 500

    return jsonify({
        'notifications': [n.to_dict() for n in notifications],
        'total': total,
        'page': page,
        'per_page': per_page,
        'total_pages': total_pages
    }), 200


@notifications_bp.route('/<int:notification_id>/read', methods=['PATCH'])
@jwt_required()
@limiter.limit("60 per minute")
def mark_read(notification_id):
    identity = get_jwt_identity()

    try:
        success = mark_notification_read(notification_id, int(identity))
    except Exception as e:
        logger.error("Failed to mark notification %s as read: %s", notification_id, e)
        return jsonify({'error': 'Failed to update notification'}), 500

    if not success:
        return jsonify({'error': 'Notification not found'}), 404

    return jsonify({'message': 'Notification marked as read'}), 200


@notifications_bp.route('/read-all', methods=['PATCH'])
@jwt_required()
@limiter.limit("30 per minute")
def mark_all_read():
    from datetime import datetime
    from app.models.notification import Notification

    identity = get_jwt_identity()

    try:
        Notification.update(
            read_at=datetime.now()
        ).where(
            (Notification.user_id == int(identity)) &
            (Notification.read_at.is_null()) &
            (Notification.is_deleted == False)
        ).execute()
    except Exception as e:
        logger.error("Failed to mark all notifications read for user %s: %s", identity, e)
        return jsonify({'error': 'Failed to update notifications'}), 500

    return jsonify({'message': 'All notifications marked as read'}), 200


@notifications_bp.route('/register-device', methods=['POST'])
@jwt_required()
def register_device():
    from app.models.user import User
    user_id = get_jwt_identity()
    user = User.get_or_none(User.user_id == user_id)
    if not user:
        return {'error': 'User not found'}, 404
    data = request.get_json()
    fcm_token = data.get('token')
    platform = data.get('platform', 'unknown')
    if not fcm_token:
        return {'error': 'Token required'}, 400
    user.fcm_token = fcm_token
    user.save()
    return {'message': 'Device registered'}, 200
