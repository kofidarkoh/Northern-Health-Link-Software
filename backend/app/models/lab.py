from peewee import CharField, TextField, ForeignKeyField, DateTimeField, SQL
from app.models.base import BaseModel
from app.models.patient import Patient
from app.models.user import User


class LabRequest(BaseModel):
    patient = ForeignKeyField(Patient, backref='lab_requests', null=False)
    requested_by = ForeignKeyField(User, backref='lab_requests_created', null=False)
    test_type = CharField(max_length=140, null=False)
    clinical_reason = TextField(null=True)
    status = CharField(max_length=30, default='REQUESTED', null=False)

    class Meta:
        table_name = 'lab_requests'

    def to_dict(self):
        return {
            'id': self.id,
            'patient_id': self.patient_id,
            'requested_by': self.requested_by_id,
            'test_type': self.test_type,
            'clinical_reason': self.clinical_reason,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class LabResult(BaseModel):
    lab_request = ForeignKeyField(LabRequest, backref='results', null=False)
    uploaded_by = ForeignKeyField(User, backref='lab_results_uploaded', null=False)
    result_summary = TextField(null=False)
    file_url = TextField(null=True)

    class Meta:
        table_name = 'lab_results'

    def to_dict(self):
        return {
            'id': self.id,
            'lab_request_id': self.lab_request_id,
            'uploaded_by': self.uploaded_by_id,
            'result_summary': self.result_summary,
            'file_url': self.file_url,
            'uploaded_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
