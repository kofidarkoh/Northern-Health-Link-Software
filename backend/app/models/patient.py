from peewee import CharField, IntegerField, TextField, ForeignKeyField, DateTimeField, SQL, CompositeKey
from app.models.base import BaseModel
from app.models.clinic import Clinic
from app.models.user import User


class Patient(BaseModel):
    clinic = ForeignKeyField(Clinic, backref='patients', null=False)
    registered_by = ForeignKeyField(User, backref='registered_patients', null=False)
    full_name = CharField(max_length=140, null=False)
    age = IntegerField(null=True)
    gender = CharField(max_length=20, null=False)
    contact_phone = CharField(max_length=30, null=True)
    district = CharField(max_length=120, null=False)
    medical_history = TextField(null=True)
    emergency_contact = CharField(max_length=160, null=True)

    class Meta:
        table_name = 'patients'

    def to_dict(self):
        return {
            'id': self.id,
            'clinic_id': self.clinic_id,
            'registered_by': self.registered_by_id,
            'full_name': self.full_name,
            'age': self.age,
            'gender': self.gender,
            'contact_phone': self.contact_phone,
            'district': self.district,
            'medical_history': self.medical_history,
            'emergency_contact': self.emergency_contact,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
