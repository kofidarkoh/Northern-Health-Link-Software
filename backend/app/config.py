import os
import secrets
import tempfile
from dotenv import load_dotenv

load_dotenv()


def _resolve_mysql_ssl_ca():
    """CA bundle path for MySQL TLS, or None.

    Accepts a file path (MYSQL_SSL_CA) or inline PEM text
    (MYSQL_SSL_CA_CONTENT). File deploys like Render have no place to put a
    cert file, so pasting the Aiven CA certificate into the dashboard as
    MYSQL_SSL_CA_CONTENT is the recommended path — it is materialised to a
    temp file here. Returns None when neither is set (plain connection).
    """
    path = os.environ.get('MYSQL_SSL_CA')
    if path:
        return path
    pem = os.environ.get('MYSQL_SSL_CA_CONTENT')
    if pem and 'BEGIN CERTIFICATE' in pem:
        if '\n' not in pem:
            pem = pem.replace('\\n', '\n')
        if not pem.endswith('\n'):
            pem += '\n'
        ca_file = os.path.join(tempfile.gettempdir(), 'nhls-mysql-ca.pem')
        with open(ca_file, 'w') as f:
            f.write(pem)
        os.chmod(ca_file, 0o600)
        return ca_file
    return None


class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or secrets.token_hex(32)
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or secrets.token_hex(32)
    JWT_ACCESS_TOKEN_EXPIRES = 1800  # 30 minutes
    JWT_REFRESH_TOKEN_EXPIRES = 259200  # 3 days

    MYSQL_HOST = os.environ.get('MYSQL_HOST', 'localhost')
    MYSQL_PORT = int(os.environ.get('MYSQL_PORT', 3306))
    MYSQL_DATABASE = os.environ.get('MYSQL_DATABASE', 'nhls_dev')
    MYSQL_USER = os.environ.get('MYSQL_USER', 'root')
    MYSQL_PASSWORD = os.environ.get('MYSQL_PASSWORD', '')
    MYSQL_SSL_CA = _resolve_mysql_ssl_ca()

    REDIS_URL = os.environ.get('REDIS_URL', 'redis://localhost:6379/0')
    # Opt-in flag for SocketIO Redis message queue. Only needed when running
    # multiple server processes/workers that must broadcast to each other.
    # Single-process `python run.py` dev runs should leave this off (in-memory).
    SOCKETIO_MESSAGE_QUEUE = os.environ.get('SOCKETIO_MESSAGE_QUEUE', '').lower() in ('1', 'true', 'yes', 'on')

    _PORT = os.environ.get('PORT', '5000')
    _SELF_ORIGINS = [f'http://localhost:{_PORT}', f'http://127.0.0.1:{_PORT}']
    CORS_ORIGINS = list(dict.fromkeys(
        os.environ.get('CORS_ORIGINS', 'http://localhost:3000,http://localhost:8081,http://localhost:19000,http://localhost:19001,http://localhost:19002,http://localhost:19006,http://127.0.0.1:3000,http://127.0.0.1:8081,http://127.0.0.1:19000,http://127.0.0.1:19001,http://127.0.0.1:19002,http://127.0.0.1:19006').split(',') + _SELF_ORIGINS
    ))

    UPLOAD_FOLDER = os.environ.get('UPLOAD_FOLDER', 'uploads/lab_results')
    MAX_CONTENT_LENGTH = int(os.environ.get('MAX_CONTENT_LENGTH', 16 * 1024 * 1024))

    SESSION_COOKIE_SECURE = True
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'


class DevelopmentConfig(Config):
    DEBUG = True
    SESSION_COOKIE_SECURE = False
    CACHE_TYPE = 'SimpleCache'
    CACHE_DEFAULT_TIMEOUT = 60


class TestingConfig(Config):
    TESTING = True
    SESSION_COOKIE_SECURE = False
    CACHE_TYPE = 'SimpleCache'
    CACHE_DEFAULT_TIMEOUT = 0


class ProductionConfig(Config):
    DEBUG = False
    CACHE_TYPE = 'RedisCache'
    CACHE_REDIS_URL = os.environ.get('REDIS_URL')
    CACHE_DEFAULT_TIMEOUT = 300


config = {
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}
