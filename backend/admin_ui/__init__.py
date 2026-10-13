"""Admin web console (htmx + modern CSS) served from the same Flask app.

Pages are static shells; all data loads as HTML partials that require
an ADMIN JWT in the Authorization header (injected by auth.js).

Routes live in sibling modules (imported below for their side effects):
helpers — pagination; pages — shells; partials — tables;
details — drawers; reports — reports + CSV; actions — writes.
"""
from flask import Blueprint
import os

admin_web_bp = Blueprint(
    'admin_web',
    __name__,
    url_prefix='/admin',
    template_folder='templates',
    static_folder='static',
    static_url_path='/static',
)


def _static_versions():
    """Map static filename -> mtime int, read once at startup for ?v= cache-busting."""
    versions = {}
    static_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'static')
    try:
        for name in os.listdir(static_dir):
            p = os.path.join(static_dir, name)
            if os.path.isfile(p):
                versions[name] = int(os.path.getmtime(p))
    except OSError:
        pass
    return versions


_STATIC_VERSIONS = _static_versions()


@admin_web_bp.after_request
def _no_store_html(resp):
    """Admin HTML must never be browser-cached — stale shells cause ghost JS errors."""
    if resp.mimetype == 'text/html':
        resp.headers['Cache-Control'] = 'no-store'
    return resp


@admin_web_bp.context_processor
def _inject_static_ver():
    def static_ver(filename):
        url = '/admin/static/%s' % filename
        v = _STATIC_VERSIONS.get(filename)
        return '%s?v=%d' % (url, v) if v else url
    return {'static_ver': static_ver}


@admin_web_bp.context_processor
def _inject_maintenance():
    """Expose maintenance banner state to every admin shell (fail-open)."""
    try:
        from app.models.system_setting import get_settings
        s = get_settings()
        return {'maintenance_on': s.get('maintenance_mode') == '1',
                'maintenance_msg': s.get('maintenance_message', '')}
    except Exception:
        return {'maintenance_on': False, 'maintenance_msg': ''}


from admin_ui import actions, details, helpers, pages, partials, reports  # noqa: E402,F401
