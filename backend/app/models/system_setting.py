"""DB-backed operational settings (key/value, ADMIN-editable, consumed by the app).

Defaults live here; rows are only written when an admin changes a value.
Reads fall back to defaults so the app works before any row exists.
"""
from app.models.base import BaseModel
from peewee import CharField, TextField


# Allow-listed keys + type metadata. Anything not here cannot be set.
SETTING_META = {
    'maintenance_mode': {
        'label': 'Maintenance mode',
        'kind': 'bool',
        'default': '0',
        'help': 'Blocks admin write actions (except this settings card). Banner shown to admins.',
    },
    'maintenance_message': {
        'label': 'Maintenance message',
        'kind': 'text',
        'default': 'Scheduled maintenance in progress. Read-only access only.',
        'max': 300,
        'help': 'Shown in the banner while maintenance mode is on.',
    },
    'broadcast_recipient_cap': {
        'label': 'Broadcast recipient cap',
        'kind': 'int',
        'default': '500',
        'min': 1,
        'max': 5000,
        'help': 'Maximum users a single broadcast alert may notify (was hardcoded 500).',
    },
    'admin_default_page_size': {
        'label': 'Admin default page size',
        'kind': 'int',
        'default': '50',
        'min': 10,
        'max': 100,
        'help': 'Rows per page in admin tables when no per_page is given (was hardcoded 50).',
    },
}


class SystemSetting(BaseModel):
    key = CharField(64, unique=True, index=True)
    value = TextField()

    class Meta:
        table_name = 'system_settings'

    def to_dict(self):
        return {
            'key': self.key,
            'value': self.value,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }


def get_settings():
    """Return {key: value} for all allow-listed keys, DB row or default."""
    from app.models.system_setting import SystemSetting as S
    defaults = {k: m['default'] for k, m in SETTING_META.items()}
    try:
        rows = {r.key: r.value for r in S.select().where(S.key.in_(list(defaults)))}
    except Exception:
        rows = {}
    defaults.update(rows)
    return defaults


def get_setting(key):
    return get_settings().get(key, SETTING_META.get(key, {}).get('default', ''))


def set_setting(key, value):
    """Upsert a single setting. Caller must validate against SETTING_META."""
    row, _ = SystemSetting.get_or_create(key=key, defaults={'value': value})
    if row.value != value:
        row.value = value
        row.save()
    return row


def validate_setting(key, value):
    """Validate + normalize an incoming value. Returns (ok, normalized_or_error)."""
    meta = SETTING_META.get(key)
    if not meta:
        return False, f'Unknown setting: {key}'
    kind = meta['kind']
    if kind == 'bool':
        if value not in ('0', '1'):
            return False, f'{meta["label"]} must be on or off.'
        return True, value
    if kind == 'int':
        try:
            n = int(value)
        except (TypeError, ValueError):
            return False, f'{meta["label"]} must be a whole number.'
        if not (meta['min'] <= n <= meta['max']):
            return False, f'{meta["label"]} must be between {meta["min"]} and {meta["max"]}.'
        return True, str(n)
    # text
    v = (value or '').strip()
    if len(v) > meta['max']:
        return False, f'{meta["label"]} is too long (max {meta["max"]} characters).'
    return True, v
