import logging
from flask_socketio import SocketIO
from flask_caching import Cache
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_jwt_extended import JWTManager
from flask_cors import CORS

logger = logging.getLogger(__name__)

socketio = SocketIO()
cache = Cache()
limiter = Limiter(key_func=get_remote_address)
jwt = JWTManager()
cors = CORS()


def init_extensions(app):
    cache.init_app(app)
    limiter.init_app(app)
    jwt.init_app(app)

    @jwt.token_in_blocklist_loader
    def check_if_token_revoked(jwt_header, jwt_payload):
        jti = jwt_payload.get('jti')
        if not jti:
            return True
        token_in_blocklist = cache.get(f'blacklist_{jti}')
        return token_in_blocklist is not None
    cors.init_app(app, resources={
        r"/api/*": {
            "origins": app.config.get('CORS_ORIGINS', ['http://localhost:3000']),
            "methods": ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"],
            "supports_credentials": True
        }
    })

    redis_url = app.config.get('REDIS_URL')
    use_message_queue = bool(app.config.get('SOCKETIO_MESSAGE_QUEUE'))
    socketio_kwargs = {
        'cors_allowed_origins': app.config.get('CORS_ORIGINS', ['http://localhost:3000']),
        'async_mode': 'gevent',
        'ping_timeout': 60,
        'ping_interval': 25,
        'allow_upgrades': True,
        # Flask >= 3.1 makes RequestContext.session read-only, which breaks
        # Flask-SocketIO's managed-session handling on every socket event.
        # Socket auth state lives in events._SID_AUTH instead.
        'manage_session': False,
    }
    if redis_url and use_message_queue:
        try:
            import redis
            r = redis.from_url(
                redis_url,
                socket_connect_timeout=3,
                socket_timeout=5,
                health_check_interval=30,
            )
            r.ping()
            # Non-blocking pub/sub sanity check: subscribe + one poll so a
            # misconfigured Redis fails fast here instead of spamming
            # "Cannot receive from redis... retrying" from the listen thread.
            ps = r.pubsub(ignore_subscribe_messages=True)
            ps.subscribe('socketio')
            ps.get_message(timeout=1)
            ps.unsubscribe('socketio')
            ps.close()
            socketio_kwargs['message_queue'] = redis_url
            logger.info("Redis connected successfully for SocketIO")
        except Exception:
            logger.warning(
                "Redis unavailable for SocketIO, using in-memory",
                exc_info=True,
            )
            socketio_kwargs['message_queue'] = None
    else:
        if redis_url and not use_message_queue:
            logger.info("SocketIO using in-memory queue (SOCKETIO_MESSAGE_QUEUE not enabled)")
        socketio_kwargs['message_queue'] = None

    socketio.init_app(app, **socketio_kwargs)
