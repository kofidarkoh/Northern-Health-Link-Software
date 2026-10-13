from peewee import CharField, TextField, ForeignKeyField, DateTimeField, SQL
from app.models.base import BaseModel
from app.models.appointment import Appointment
from app.models.user import User


class ConsultationNote(BaseModel):
    appointment = ForeignKeyField(Appointment, backref='consultation_notes', null=False)
    specialist = ForeignKeyField(User, backref='consultation_notes', null=False)
    diagnosis = TextField(null=False)
    recommendations = TextField(null=True)
    referral_notes = TextField(null=True)
    treatment_instructions = TextField(null=True)

    class Meta:
        table_name = 'consultation_notes'

    def to_dict(self):
        return {
            'id': self.id,
            'appointment_id': self.appointment_id,
            'specialist_id': self.specialist_id,
            'diagnosis': self.diagnosis,
            'recommendations': self.recommendations,
            'referral_notes': self.referral_notes,
            'treatment_instructions': self.treatment_instructions,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
