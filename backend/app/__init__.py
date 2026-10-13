import os
import logging
import atexit
from flask import Flask, jsonify, request, send_from_directory
from werkzeug.utils import safe_join
from app.config import config
from app.extensions import init_extensions, socketio, limiter
from app.database import get_database, db_proxy, close_database
from app.logging_config import setup_logging

setup_logging()
logger = logging.getLogger(__name__)


def create_app(config_name=None):
    if config_name is None:
        config_name = os.environ.get('FLASK_ENV', 'development')

    app = Flask(__name__)
    app.config.from_object(config[config_name])

    os.makedirs(app.config.get('UPLOAD_FOLDER', 'uploads/lab_results'), exist_ok=True)

    init_extensions(app)

    db = get_database()
    db_proxy.initialize(db)

    @app.before_request
    def before_request():
        try:
            if db_proxy.obj is None:
                db_proxy.initialize(get_database())
            if db_proxy.is_closed():
                db_proxy.connect()
        except Exception as e:
            logger.error("Database connection failed: %s", e)
            return jsonify({'error': 'Service temporarily unavailable'}), 503

    @app.teardown_request
    def teardown_request(exception):
        if exception:
            logger.error("Request exception: %s", exception)
        try:
            if db_proxy.obj is not None and not db_proxy.is_closed():
                db_proxy.close()
        except Exception as e:
            logger.error("Error closing database connection: %s", e)

    @app.after_request
    def add_security_headers(response):
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['X-Frame-Options'] = 'DENY'
        response.headers['X-XSS-Protection'] = '1; mode=block'
        response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        if app.config.get('ENV') == 'production' or not app.debug:
            response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
        return response

    @app.errorhandler(429)
    def rate_limit_exceeded(e):
        return jsonify({
            'error': 'Rate limit exceeded',
            'message': str(e.description),
            'retry_after': '60'
        }), 429, {'Retry-After': '60'}

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({'error': 'Not found'}), 404

    @app.errorhandler(400)
    def bad_request(e):
        return jsonify({'error': 'Bad request'}), 400

    @app.errorhandler(405)
    def method_not_allowed(e):
        return jsonify({'error': 'Method not allowed'}), 405

    @app.errorhandler(500)
    def internal_error(e):
        logger.exception("Internal server error: %s", e)
        return jsonify({'error': 'Internal server error'}), 500

    @app.errorhandler(503)
    def service_unavailable(e):
        return jsonify({'error': 'Service temporarily unavailable'}), 503

    @app.route('/health')
    @limiter.exempt
    def health_check():
        health = {
            'status': 'healthy',
            'service': 'Northern Health Link API',
            'version': '1.0.0'
        }
        try:
            if db.is_closed():
                db.connect()
            db.execute_sql('SELECT 1')
            health['database'] = 'connected'
        except Exception as e:
            health['status'] = 'degraded'
            health['database'] = 'disconnected'
            logger.warning("Health check DB failure: %s", e)

        try:
            from app.extensions import cache
            cache.set('_health_check', True, timeout=5)
            health['cache'] = 'connected'
        except Exception as e:
            health['cache'] = 'unavailable'
            logger.warning("Health check cache failure: %s", e)

        status_code = 200 if health['status'] == 'healthy' else 503
        return jsonify(health), status_code

    @app.route('/uploads/<path:filename>')
    @limiter.limit("60 per minute")
    def serve_upload(filename):
        # PHI (lab result files, profile photos) must never be served
        # anonymously. <img>/<embed> tags cannot send Authorization headers,
        # so a valid JWT is accepted either as a Bearer header or as ?token=.
        from flask_jwt_extended import verify_jwt_in_request, decode_token
        query_token = request.args.get('token')
        try:
            if query_token:
                decoded = decode_token(query_token)
                # decode_token skips the blocklist callback -> enforce logout here.
                from app.extensions import cache
                if cache.get("blacklist_%s" % decoded.get('jti')) is not None:
                    return jsonify({'error': 'Token has been revoked'}), 401
            else:
                verify_jwt_in_request()
        except Exception:
            return jsonify({'error': 'Authentication required'}), 401

        upload_root = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'uploads')
        path = safe_join(upload_root, filename)
        if not path:
            return jsonify({'error': 'Not found'}), 404
        # Filenames are uuid-based and immutable, but the content is PHI:
        # per-user caching only, never shared caches.
        resp = send_from_directory(upload_root, filename)
        resp.headers['Cache-Control'] = 'private, max-age=3600, immutable'
        return resp

    from app.api import register_blueprints
    register_blueprints(app)

    from admin_ui import admin_web_bp
    app.register_blueprint(admin_web_bp)

    from app.socket.events import register_socket_events
    register_socket_events(socketio)

    from app.models import create_tables
    try:
        with app.app_context():
            create_tables()
    except Exception as e:
        logger.exception("Failed to create database tables: %s", e)

    atexit.register(close_database)

    return app
