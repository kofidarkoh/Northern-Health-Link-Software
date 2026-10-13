import os
from gevent import monkey
monkey.patch_all()

from app import create_app, socketio

config_name = os.environ.get('FLASK_ENV', 'production')
app = create_app(config_name)
