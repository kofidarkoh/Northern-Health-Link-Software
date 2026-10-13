"""Migrate clinics for ownership + Northern Region district master list.

- Adds clinics.ownership (default PUBLIC for existing rows).
- Creates districts table and seeds the 16 Northern Region MMDAs
  (verified against the Local Government Service, lgs.gov.gh).
- Reports existing clinic/patient district strings that match no
  master-list entry (left untouched, for admin decision).

Usage: python3 migrate_clinics.py   (from repo root)
"""
import logging

from app.database import get_database, db_proxy, close_database
from app.models.clinic import Clinic
from app.models.district import District
from app.models.patient import Patient

logger = logging.getLogger(__name__)

# (name, assembly_type, capital) — source: Local Government Service, Northern RCC
NORTHERN_MMDAS = [
    ('Tamale Metropolitan', 'Metropolitan', 'Tamale'),
    ('Sagnerigu Municipal', 'Municipal', 'Sagnerigu'),
    ('Savelugu Municipal', 'Municipal', 'Savelugu'),
    ('Gushegu Municipal', 'Municipal', 'Gushegu'),
    ('Yendi Municipal', 'Municipal', 'Yendi'),
    ('Nanumba North Municipal', 'Municipal', 'Bimbilla'),
    ('Karaga District', 'District', 'Karaga'),
    ('Kpandai District', 'District', 'Kpandai'),
    ('Kumbungu District', 'District', 'Kumbungu'),
    ('Mion District', 'District', 'Sang'),
    ('Nanton District', 'District', 'Nanton'),
    ('Nanumba South District', 'District', 'Wulensi'),
    ('Saboba District', 'District', 'Saboba'),
    ('Tatale Sanguli District', 'District', 'Tatale'),
    ('Tolon District', 'District', 'Tolon'),
    ('Zabzugu District', 'District', 'Zabzugu'),
]


def migrate():
    db = get_database()
    if db_proxy.obj is None:
        db_proxy.initialize(db)
    db.connect(reuse_if_open=True)
    try:
        cols = [c.name for c in db.get_columns('clinics')]
        if 'ownership' not in cols:
            db.execute_sql(
                "ALTER TABLE clinics ADD COLUMN ownership VARCHAR(20) NOT NULL DEFAULT 'PUBLIC'")
            print('Added clinics.ownership.')
        else:
            print('clinics.ownership already exists.')
        if 'address' not in [c.name for c in db.get_columns('clinics')]:
            db.execute_sql("ALTER TABLE clinics ADD COLUMN address VARCHAR(255) NULL")
            print('Added clinics.address.')
        else:
            print('clinics.address already exists.')
        if 'address' not in [c.name for c in db.get_columns('patients')]:
            db.execute_sql("ALTER TABLE patients ADD COLUMN address VARCHAR(255) NULL")
            print('Added patients.address.')
        else:
            print('patients.address already exists.')

        db.create_tables([District], safe=True)
        added = 0
        for name, atype, capital in NORTHERN_MMDAS:
            _, created = District.get_or_create(
                name=name,
                defaults={'region': 'Northern', 'assembly_type': atype,
                          'capital': capital})
            added += int(created)
        print(f'Districts seeded: {added} new, {District.select().count()} total.')

        known = {d.name.strip().lower() for d in District.select()}
        bad_clinics = [(c.id, c.name, c.district) for c in Clinic.select().where(Clinic.is_deleted == False)  # noqa: E712
                       if (c.district or '').strip().lower() not in known]
        active_patients = list(Patient.select().where(Patient.is_deleted == False))  # noqa: E712
        unmatched = sorted({(p.district or '') for p in active_patients
                            if (p.district or '').strip().lower() not in known})
        unmatched_patient_count = sum(1 for p in active_patients
                                      if (p.district or '').strip().lower() not in known)
        print(f'Clinics with non-master district ({len(bad_clinics)}):')
        for cid, name, dist in bad_clinics:
            print(f'  #{cid} {name!r} -> {dist!r}')
        print(f'Patient districts not in master list ({unmatched_patient_count} of {len(active_patients)} patients):')
        for dist in unmatched:
            print(f'  {dist!r}')
    finally:
        close_database()


if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO)
    migrate()
