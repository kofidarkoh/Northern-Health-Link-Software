from peewee import CharField
from app.models.base import BaseModel


class District(BaseModel):
    """Master list of Northern Region MMDAs (seeded, admin-selectable)."""
    name = CharField(max_length=120, null=False, unique=True)
    region = CharField(max_length=80, null=False, default='Northern')
    assembly_type = CharField(max_length=20, null=False, default='District')
    capital = CharField(max_length=120, null=True)

    class Meta:
        table_name = 'districts'

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'region': self.region,
            'assembly_type': self.assembly_type,
            'capital': self.capital,
        }
