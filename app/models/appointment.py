from peewee import CharField, TextField, ForeignKeyField, DateTimeField, SQL
from app.models.base import BaseModel
from app.models.patient import Patient
from app.models.user import User
from app.models.clinic import Clinic


class Appointment(BaseModel):
    patient = ForeignKeyField(Patient, backref='appointments', null=False)
    clinic = ForeignKeyField(Clinic, backref='appointments', null=False)
    specialist = ForeignKeyField(User, backref='specialist_appointments', null=False)
    appointment_time = DateTimeField(null=False)
    status = CharField(max_length=20, default='REQUESTED', null=False)
    video_room_url = TextField(null=True)
    created_by = ForeignKeyField(User, backref='created_appointments', null=False)

    class Meta:
        table_name = 'appointments'

    def to_dict(self):
        return {
            'id': self.id,
            'patient_id': self.patient_id,
            'clinic_id': self.clinic_id,
            'specialist_id': self.specialist_id,
            'appointment_time': self.appointment_time.isoformat() if self.appointment_time else None,
            'status': self.status,
            'video_room_url': self.video_room_url,
            'created_by': self.created_by_id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
