#!/bin/bash
# Production entrypoint. Uses the project-root venv (NOT backend/venv) and the
# gevent WebSocket worker required by Flask-SocketIO. Keep workers at 1 unless
# SOCKETIO_MESSAGE_QUEUE=1 is set in the environment, otherwise workers
# cannot broadcast to each other.
cd "$(dirname "$0")"
source ../venv/bin/activate
exec gunicorn -k geventwebsocket.gunicorn.workers.GeventWebSocketWorker -w 1 --timeout 120 -b 127.0.0.1:5000 wsgi:app
