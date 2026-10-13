from peewee import CharField, TextField, ForeignKeyField, DateTimeField, SQL
from app.models.base import BaseModel
from app.models.user import User
from app.models.patient import Patient


class Notification(BaseModel):
    user = ForeignKeyField(User, backref='notifications', null=True)
    patient = ForeignKeyField(Patient, backref='notifications', null=True)
    title = CharField(max_length=160, null=False)
    message = TextField(null=False)
    read_at = DateTimeField(null=True)

    class Meta:
        table_name = 'notifications'

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'patient_id': self.patient_id,
            'title': self.title,
            'message': self.message,
            'read_at': self.read_at.isoformat() if self.read_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
