import logging
import os

logger = logging.getLogger(__name__)

def send_push_notification(fcm_token: str, title: str, body: str, data: dict = None):
    """Send push notification via Expo Push Notification Service."""
    if not fcm_token:
        return

    try:
        import requests
        url = 'https://exp.host/--/api/v2/push/send'
        payload = {
            'to': fcm_token,
            'title': title,
            'body': body,
            'data': data or {},
            'sound': 'default',
            'badge': 1,
        }
        response = requests.post(url, json=payload, timeout=10)
        if response.status_code != 200:
            logger.warning("Push notification failed: %s", response.text)
    except Exception as e:
        logger.error("Error sending push notification: %s", e)

def send_push_to_user(user, title: str, body: str, data: dict = None):
    """Send push notification to a user if they have an FCM token."""
    if hasattr(user, 'fcm_token') and user.fcm_token:
        send_push_notification(user.fcm_token, title, body, data)
