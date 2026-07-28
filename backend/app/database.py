import logging
import time
from playhouse.pool import PooledMySQLDatabase
from peewee import Proxy
import os

logger = logging.getLogger(__name__)

db_proxy = Proxy()
_db_instance = None


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
        ssl_config = {}
        ssl_ca = os.environ.get('MYSQL_SSL_CA')
        if ssl_ca:
            ssl_config['ca'] = ssl_ca

        _db_instance = PooledMySQLDatabase(
            os.environ.get('MYSQL_DATABASE', 'defaultdb'),
            user=os.environ.get('MYSQL_USER'),
            password=os.environ.get('MYSQL_PASSWORD'),
            host=os.environ.get('MYSQL_HOST'),
            port=int(os.environ.get('MYSQL_PORT', 3306)),
            max_connections=30,
            stale_timeout=300,
            timeout=10,
            charset='utf8mb4',
            ssl_disabled=False if ssl_config else True,
            ssl=ssl_config if ssl_config else None
        )

    return _db_instance


def connect_with_retry(max_retries=3, retry_delay=2):
    db = get_database()
    for attempt in range(max_retries):
        try:
            if db.is_closed():
                db.connect(reuse_if_open=True)
            return True
        except Exception as e:
            logger.warning("DB connection attempt %d failed: %s", attempt + 1, e)
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
