import logging
import time
from playhouse.pool import PooledMySQLDatabase
from peewee import Proxy
from urllib.parse import urlparse, unquote
import os

logger = logging.getLogger(__name__)

db_proxy = Proxy()
_db_instance = None
_last_connection_error = None


def get_last_connection_error():
    return _last_connection_error


def _parse_database_url(url):
    """Split a mysql://user:pass@host:port/db URL into connect kwargs."""
    parsed = urlparse(url)
    if parsed.scheme not in ('mysql', 'mysql+pymysql'):
        raise ValueError(
            "Unsupported DATABASE_URL scheme %r (expected mysql://)" % (parsed.scheme,)
        )
    return {
        'database': unquote(parsed.path.lstrip('/') or 'defaultdb'),
        'user': unquote(parsed.username or ''),
        'password': unquote(parsed.password or '') or None,
        'host': parsed.hostname or 'localhost',
        'port': parsed.port or 3306,
    }


def _db_label():
    """Password-free host:port/db label for logs."""
    db_url = os.environ.get('DATABASE_URL')
    if db_url:
        try:
            conn = _parse_database_url(db_url)
            return "%s:%s/%s" % (conn['host'], conn['port'], conn['database'])
        except ValueError:
            return '<DATABASE_URL>'
    return "%s:%s/%s" % (
        os.environ.get('MYSQL_HOST', 'localhost'),
        os.environ.get('MYSQL_PORT', 3306),
        os.environ.get('MYSQL_DATABASE', 'nhls_dev'),
    )


def get_database():
    global _db_instance
    if _db_instance is not None:
        return _db_instance

    env = os.environ.get('FLASK_ENV', 'development')

    if env == 'development':
        _db_instance = PooledMySQLDatabase(
            os.environ.get('MYSQL_DATABASE', 'nhls_dev'),
            user=os.environ.get('MYSQL_USER', 'root'),
            password=os.environ.get('MYSQL_PASSWORD', '') or None,
            host=os.environ.get('MYSQL_HOST', 'localhost'),
            port=int(os.environ.get('MYSQL_PORT', 3306)),
            max_connections=20,
            stale_timeout=300,
            timeout=10,
            charset='utf8mb4'
        )
    else:
        # Single-URL form (Render fromDatabase, Aiven connection string, …)
        # takes precedence; discrete MYSQL_* vars are the fallback.
        db_url = os.environ.get('DATABASE_URL')
        if db_url:
            conn = _parse_database_url(db_url)
        else:
            conn = {
                'database': os.environ.get('MYSQL_DATABASE', 'defaultdb'),
                'user': os.environ.get('MYSQL_USER'),
                'password': os.environ.get('MYSQL_PASSWORD'),
                'host': os.environ.get('MYSQL_HOST'),
                'port': int(os.environ.get('MYSQL_PORT', 3306)),
            }

        # Deferred import: honours MYSQL_SSL_CA *and* MYSQL_SSL_CA_CONTENT.
        from app.config import _resolve_mysql_ssl_ca
        ssl_ca = _resolve_mysql_ssl_ca()
        ssl_config = {'ca': ssl_ca} if ssl_ca else {}

        _db_instance = PooledMySQLDatabase(
            conn['database'],
            user=conn['user'],
            password=conn['password'],
            host=conn['host'],
            port=conn['port'],
            max_connections=30,
            stale_timeout=300,
            timeout=10,
            charset='utf8mb4',
            ssl_disabled=not ssl_config,
            ssl=ssl_config or None
        )

    return _db_instance


def connect_with_retry(max_retries=3, retry_delay=2):
    global _last_connection_error
    _last_connection_error = None
    db = get_database()
    for attempt in range(max_retries):
        try:
            if db.is_closed():
                db.connect(reuse_if_open=True)
            return True
        except Exception as e:
            _last_connection_error = e
            logger.warning(
                "DB connection attempt %d failed (%s): %s",
                attempt + 1,
                _db_label(),
                e,
            )
            if attempt < max_retries - 1:
                time.sleep(retry_delay * (attempt + 1))
    logger.error("Failed to connect to database after %d attempts", max_retries)
    return False


def init_db_proxy():
    db = get_database()
    db_proxy.initialize(db)
    return db


def close_database():
    try:
        db = get_database()
        if not db.is_closed():
            db.close()
            logger.info("Database connection closed")
    except Exception as e:
        logger.error("Error closing database: %s", e)
