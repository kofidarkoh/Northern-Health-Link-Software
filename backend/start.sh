#!/bin/bash
cd /home/godfather/Desktop/Project/NHLS/backend
source venv/bin/activate
gunicorn -k gevent -w 1 --timeout 120 -b 127.0.0.1:5000 wsgi:app
