from gevent import monkey
monkey.patch_all()

import os
import signal
import logging
from app import create_app, socketio
from app.database import close_database

logger = logging.getLogger(__name__)

config_name = os.environ.get('FLASK_ENV', 'development')
app = create_app(config_name)


def shutdown_handler(signum, frame):
    logger.info("Received signal %s, shutting down gracefully...", signum)
    close_database()
    logger.info("Shutdown complete")


signal.signal(signal.SIGTERM, shutdown_handler)
signal.signal(signal.SIGINT, shutdown_handler)

if __name__ == '__main__':
    socketio.run(
        app,
        host='127.0.0.1' if config_name != 'production' else '0.0.0.0',
        port=int(os.environ.get('PORT', 5000)),
        debug=config_name == 'development',
        use_reloader=True
    )
