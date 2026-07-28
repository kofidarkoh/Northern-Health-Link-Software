from peewee import CharField, IntegerField, DateTimeField, SQL
from app.models.base import BaseModel


class Clinic(BaseModel):
    name = CharField(max_length=120, null=False)
    district = CharField(max_length=120, null=False)
    contact_phone = CharField(max_length=30, null=True)

    class Meta:
        table_name = 'clinics'

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'district': self.district,
            'contact_phone': self.contact_phone,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
