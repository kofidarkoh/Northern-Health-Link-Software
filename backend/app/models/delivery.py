from peewee import CharField, TextField, ForeignKeyField, DateTimeField, SQL
from app.models.base import BaseModel
from app.models.prescription import Prescription
from app.models.user import User


class Delivery(BaseModel):
    prescription = ForeignKeyField(Prescription, backref='deliveries', null=False)
    rider = ForeignKeyField(User, backref='assigned_deliveries', null=True)
    requested_by = ForeignKeyField(User, backref='delivery_requests', null=False)
    delivery_address = TextField(null=False)
    status = CharField(max_length=20, default='PENDING', null=False)
    status_note = TextField(null=True)

    class Meta:
        table_name = 'deliveries'

    def to_dict(self):
        return {
            'id': self.id,
            'prescription_id': self.prescription_id,
            'rider_id': self.rider_id,
            'requested_by': self.requested_by_id,
            'delivery_address': self.delivery_address,
            'status': self.status,
            'status_note': self.status_note,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
