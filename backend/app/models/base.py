from peewee import Model, DateTimeField, BooleanField, SQL
from datetime import datetime
from app.database import db_proxy


class BaseModel(Model):
    created_at = DateTimeField(
        default=datetime.now,
        constraints=[SQL('DEFAULT CURRENT_TIMESTAMP')]
    )
    updated_at = DateTimeField(
        default=datetime.now,
        constraints=[SQL('DEFAULT CURRENT_TIMESTAMP')]
    )
    is_deleted = BooleanField(default=False)

    def save(self, *args, **kwargs):
        self.updated_at = datetime.now()
        return super().save(*args, **kwargs)

    def soft_delete(self):
        self.is_deleted = True
        self.save()

    class Meta:
        database = db_proxy
        abstract = True
