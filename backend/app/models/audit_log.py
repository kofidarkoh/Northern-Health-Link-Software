from peewee import CharField, TextField, ForeignKeyField, DateTimeField, SQL
from app.models.base import BaseModel
from app.models.user import User


class AuditLog(BaseModel):
    user = ForeignKeyField(User, backref='audit_logs', null=True)
    action = CharField(max_length=120, null=False)
    entity_type = CharField(max_length=80, null=False)
    entity_id = CharField(max_length=50, null=True)
    details = TextField(null=True)

    class Meta:
        table_name = 'audit_logs'

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'action': self.action,
            'entity_type': self.entity_type,
            'entity_id': self.entity_id,
            'details': self.details,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
