from peewee import CharField, TextField, ForeignKeyField, DateTimeField, SQL
from app.models.base import BaseModel
from app.models.patient import Patient
from app.models.user import User
from app.models.consultation import ConsultationNote


class Prescription(BaseModel):
    patient = ForeignKeyField(Patient, backref='prescriptions', null=False)
    consultation_note = ForeignKeyField(ConsultationNote, backref='prescriptions', null=True)
    prescribed_by = ForeignKeyField(User, backref='prescriptions_created', null=False)
    medication_name = CharField(max_length=160, null=False)
    dosage = CharField(max_length=120, null=False)
    frequency = CharField(max_length=120, null=True)
    duration = CharField(max_length=120, null=True)
    instructions = TextField(null=True)

    class Meta:
        table_name = 'prescriptions'

    def to_dict(self):
        return {
            'id': self.id,
            'patient_id': self.patient_id,
            'consultation_note_id': self.consultation_note_id,
            'prescribed_by': self.prescribed_by_id,
            'medication_name': self.medication_name,
            'dosage': self.dosage,
            'frequency': self.frequency,
            'duration': self.duration,
            'instructions': self.instructions,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
