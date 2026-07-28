import logging
import hashlib
import json
from app.models.patient import Patient
from app.models.clinic import Clinic
from app.extensions import cache

logger = logging.getLogger(__name__)


def generate_search_cache_key(filters):
    filter_str = json.dumps(filters, sort_keys=True)
    return hashlib.md5(filter_str.encode()).hexdigest()


def search_patients(filters):
    query = Patient.select().where(Patient.is_deleted == False)

    if filters.get('search'):
        search = filters['search']
        query = query.where(
            (Patient.full_name.contains(search)) |
            (Patient.district.contains(search)) |
            (Patient.contact_phone.contains(search))
        )

    if filters.get('gender'):
        query = query.where(Patient.gender == filters['gender'])

    if filters.get('district'):
        query = query.where(Patient.district.contains(filters['district']))

    if filters.get('clinic_id'):
        query = query.where(Patient.clinic_id == filters['clinic_id'])

    total = query.count()

    page = filters.get('page', 1)
    per_page = filters.get('per_page', 50)
    total_pages = (total + per_page - 1) // per_page if total > 0 else 1

    patients = query.order_by(Patient.created_at.desc()).paginate(page, per_page)

    return {
        'patients': [enrich_patient(p) for p in patients],
        'total': total,
        'page': page,
        'per_page': per_page,
        'total_pages': total_pages
    }


def get_patient_by_id(patient_id):
    patient = Patient.get_or_none(
        (Patient.id == patient_id) & (Patient.is_deleted == False)
    )
    if not patient:
        return None
    return enrich_patient(patient)


def check_duplicate_patient(full_name, contact_phone, clinic_id, exclude_id=None):
    query = Patient.select().where(
        (Patient.clinic_id == clinic_id) &
        (Patient.is_deleted == False)
    )

    if contact_phone:
        query = query.where(
            (Patient.full_name.contains(full_name)) |
            (Patient.contact_phone == contact_phone)
        )
    else:
        query = query.where(Patient.full_name.contains(full_name))

    if exclude_id:
        query = query.where(Patient.id != exclude_id)

    return query.count() > 0


def create_patient(data, user_id):
    clinic_id = data['clinic_id']

    patient = Patient.create(
        clinic_id=clinic_id,
        registered_by=user_id,
        full_name=data['full_name'],
        age=data.get('age'),
        gender=data['gender'],
        contact_phone=data.get('contact_phone'),
        district=data['district'],
        medical_history=data.get('medical_history'),
        emergency_contact=data.get('emergency_contact')
    )

    clear_patient_list_cache()

    return enrich_patient(patient)


def update_patient(patient_id, data):
    patient = Patient.get_or_none(Patient.id == patient_id)
    if not patient:
        return None

    updatable_fields = [
        'full_name', 'age', 'gender', 'contact_phone',
        'district', 'medical_history', 'emergency_contact'
    ]

    for field in updatable_fields:
        if field in data:
            setattr(patient, field, data[field])

    patient.save()

    try:
        cache.delete(f'patient_detail:{patient_id}')
    except Exception as e:
        logger.warning("Cache delete failed for patient %s: %s", patient_id, e)

    clear_patient_list_cache()

    return enrich_patient(patient)


def soft_delete_patient(patient_id):
    patient = Patient.get_or_none(Patient.id == patient_id)
    if not patient:
        return False

    patient.soft_delete()

    try:
        cache.delete(f'patient_detail:{patient_id}')
    except Exception as e:
        logger.warning("Cache delete failed for patient %s: %s", patient_id, e)

    clear_patient_list_cache()

    return True


def enrich_patient(patient):
    patient_dict = patient.to_dict()

    try:
        clinic = Clinic.get_or_none(Clinic.id == patient.clinic_id)
        if clinic:
            patient_dict['clinic_name'] = clinic.name
            patient_dict['clinic_district'] = clinic.district
        else:
            patient_dict['clinic_name'] = None
            patient_dict['clinic_district'] = None
    except Exception:
        patient_dict['clinic_name'] = None
        patient_dict['clinic_district'] = None

    return patient_dict


def clear_patient_list_cache():
    try:
        cache.delete('patient_list')
    except Exception as e:
        logger.warning("Failed to clear patient list cache: %s", e)
