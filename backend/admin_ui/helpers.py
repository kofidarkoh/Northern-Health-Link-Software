"""Shared pagination helpers for the admin web console."""
from flask import request


def _default_per_page():
    """Admin-configurable page size (SystemSetting, fallback 50)."""
    try:
        from app.models.system_setting import get_setting
        return min(max(int(get_setting('admin_default_page_size')), 1), 100)
    except Exception:
        return 50


def _pagination_args(default_per_page=None):
    if default_per_page is None:
        default_per_page = _default_per_page()
    try:
        page = max(int(request.args.get('page', 1)), 1)
    except (TypeError, ValueError):
        page = 1
    try:
        per_page = min(max(int(request.args.get('per_page', default_per_page)), 1), 100)
    except (TypeError, ValueError):
        per_page = default_per_page
    return page, per_page


def _paginate_list(items, page, per_page):
    total = len(items)
    total_pages = max((total + per_page - 1) // per_page, 1)
    page = min(page, total_pages)
    return items[(page - 1) * per_page:page * per_page], total, page, total_pages
