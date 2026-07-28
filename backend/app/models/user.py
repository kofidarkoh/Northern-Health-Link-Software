import random
import string
from peewee import CharField, BooleanField, ForeignKeyField, DateTimeField, SQL
from app.models.base import BaseModel
from app.models.clinic import Clinic

ROLE_PREFIXES = {
    'ADMIN': 'AD',
    'CLINIC_STAFF': 'CS',
    'SPECIALIST': 'SP',
    'LAB_OFFICER': 'LO',
    'RIDER': 'RD',
}


class User(BaseModel):
    clinic = ForeignKeyField(Clinic, backref='users', null=True)
    user_id = CharField(max_length=9, unique=True, null=False, index=True)
    full_name = CharField(max_length=120, null=False)
    email = CharField(max_length=160, unique=True, null=True)
    phone = CharField(max_length=30, null=True)
    password_hash = CharField(max_length=255, null=False)
    role = CharField(max_length=20, null=False)
    speciality = CharField(max_length=120, null=True)
    active = BooleanField(default=True, null=False)
    fcm_token = CharField(max_length=255, null=True)

    class Meta:
        table_name = 'users'

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'clinic_id': self.clinic_id,
            'full_name': self.full_name,
            'email': self.email,
            'phone': self.phone,
            'role': self.role,
            'speciality': self.speciality,
            'active': self.active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
