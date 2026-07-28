import logging
from flask_socketio import SocketIO
from flask_caching import Cache
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from flask_marshmallow import Marshmallow

logger = logging.getLogger(__name__)

socketio = SocketIO()
cache = Cache()
limiter = Limiter(key_func=get_remote_address)
jwt = JWTManager()
cors = CORS()
ma = Marshmallow()


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
    socketio_kwargs = {
        'cors_allowed_origins': app.config.get('CORS_ORIGINS', ['http://localhost:3000']),
        'async_mode': 'gevent',
        'ping_timeout': 60,
        'ping_interval': 25,
        'allow_upgrades': True,
    }
    if redis_url:
        try:
            import redis
            r = redis.from_url(redis_url, socket_connect_timeout=3)
            r.ping()
            socketio_kwargs['message_queue'] = redis_url
            logger.info("Redis connected successfully for SocketIO")
        except Exception as e:
            logger.warning("Redis unavailable for SocketIO, using in-memory: %s", e)
            socketio_kwargs['message_queue'] = None

    socketio.init_app(app, **socketio_kwargs)
