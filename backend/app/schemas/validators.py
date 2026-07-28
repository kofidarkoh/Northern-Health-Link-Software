import re
from marshmallow import Schema, fields, validate, validates, ValidationError
from app.models.clinic import Clinic

EMAIL_REGEX = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')


class PatientCreateSchema(Schema):
    full_name = fields.Str(
        required=True,
        validate=validate.Length(min=2, max=140)
    )
    age = fields.Int(
        allow_none=True,
        validate=validate.Range(min=0, max=150)
    )
    gender = fields.Str(
        required=True,
        validate=validate.OneOf(['Male', 'Female', 'Other'])
    )
    contact_phone = fields.Str(
        allow_none=True,
        validate=validate.Length(max=30)
    )
    district = fields.Str(
        required=True,
        validate=validate.Length(min=2, max=120)
    )
    medical_history = fields.Str(
        allow_none=True,
        validate=validate.Length(max=5000)
    )
    emergency_contact = fields.Str(
        allow_none=True,
        validate=validate.Length(max=160)
    )
    clinic_id = fields.Int(required=True)

    @validates('clinic_id')
    def validate_clinic_id(self, value, **kwargs):
        clinic = Clinic.get_or_none(Clinic.id == value)
        if not clinic:
            raise ValidationError('Clinic not found.')


class PatientUpdateSchema(Schema):
    full_name = fields.Str(
        allow_none=True,
        validate=validate.Length(min=2, max=140)
    )
    age = fields.Int(
        allow_none=True,
        validate=validate.Range(min=0, max=150)
    )
    gender = fields.Str(
        allow_none=True,
        validate=validate.OneOf(['Male', 'Female', 'Other'])
    )
    contact_phone = fields.Str(
        allow_none=True,
        validate=validate.Length(max=30)
    )
    district = fields.Str(
        allow_none=True,
        validate=validate.Length(min=2, max=120)
    )
    medical_history = fields.Str(
        allow_none=True,
        validate=validate.Length(max=5000)
    )
    emergency_contact = fields.Str(
        allow_none=True,
        validate=validate.Length(max=160)
    )


class PatientSearchSchema(Schema):
    search = fields.Str(load_default='', allow_none=True)
    gender = fields.Str(
        allow_none=True,
        validate=validate.OneOf(['Male', 'Female', 'Other'])
    )
    district = fields.Str(allow_none=True)
    clinic_id = fields.Int(allow_none=True)
    page = fields.Int(load_default=1, validate=validate.Range(min=1))
    per_page = fields.Int(load_default=50, validate=validate.Range(min=1, max=100))


class AppointmentCreateSchema(Schema):
    patient_id = fields.Int(required=True)
    clinic_id = fields.Int(required=True)
    specialist_id = fields.Int(required=True)
    appointment_time = fields.DateTime(required=True)

    @validates('patient_id')
    def validate_patient_id(self, value, **kwargs):
        from app.models.patient import Patient
        if not Patient.get_or_none(Patient.id == value):
            raise ValidationError('Patient not found.')

    @validates('clinic_id')
    def validate_clinic_id(self, value, **kwargs):
        if not Clinic.get_or_none(Clinic.id == value):
            raise ValidationError('Clinic not found.')

    @validates('specialist_id')
    def validate_specialist_id(self, value, **kwargs):
        from app.models.user import User
        specialist = User.get_or_none((User.id == value) & (User.role == 'SPECIALIST'))
        if not specialist:
            raise ValidationError('Specialist not found.')


class AppointmentStatusSchema(Schema):
    status = fields.Str(
        required=True,
        validate=validate.OneOf(['REQUESTED', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'])
    )
    video_room_url = fields.Str(allow_none=True, validate=validate.Length(max=500))


class ConsultationNoteCreateSchema(Schema):
    appointment_id = fields.Int(required=True)
    diagnosis = fields.Str(required=True, validate=validate.Length(min=1, max=10000))
    recommendations = fields.Str(allow_none=True, validate=validate.Length(max=10000))
    referral_notes = fields.Str(allow_none=True, validate=validate.Length(max=10000))
    treatment_instructions = fields.Str(allow_none=True, validate=validate.Length(max=10000))

    @validates('appointment_id')
    def validate_appointment_id(self, value, **kwargs):
        from app.models.appointment import Appointment
        if not Appointment.get_or_none(Appointment.id == value):
            raise ValidationError('Appointment not found.')


class LabRequestCreateSchema(Schema):
    patient_id = fields.Int(required=True)
    test_type = fields.Str(required=True, validate=validate.Length(min=1, max=140))
    clinical_reason = fields.Str(allow_none=True, validate=validate.Length(max=5000))

    @validates('patient_id')
    def validate_patient_id(self, value, **kwargs):
        from app.models.patient import Patient
        if not Patient.get_or_none(Patient.id == value):
            raise ValidationError('Patient not found.')


class LabResultCreateSchema(Schema):
    lab_request_id = fields.Int(required=True)
    result_summary = fields.Str(required=True, validate=validate.Length(min=1, max=50000))
    file_url = fields.Str(allow_none=True, validate=validate.Length(max=500))

    @validates('lab_request_id')
    def validate_lab_request_id(self, value, **kwargs):
        from app.models.lab import LabRequest
        if not LabRequest.get_or_none(LabRequest.id == value):
            raise ValidationError('Lab request not found.')


class PrescriptionCreateSchema(Schema):
    patient_id = fields.Int(required=True)
    consultation_note_id = fields.Int(allow_none=True)
    medication_name = fields.Str(required=True, validate=validate.Length(min=1, max=160))
    dosage = fields.Str(required=True, validate=validate.Length(min=1, max=120))
    frequency = fields.Str(allow_none=True, validate=validate.Length(max=120))
    duration = fields.Str(allow_none=True, validate=validate.Length(max=120))
    instructions = fields.Str(allow_none=True, validate=validate.Length(max=5000))

    @validates('patient_id')
    def validate_patient_id(self, value, **kwargs):
        from app.models.patient import Patient
        if not Patient.get_or_none(Patient.id == value):
            raise ValidationError('Patient not found.')

    @validates('consultation_note_id')
    def validate_consultation_note_id(self, value, **kwargs):
        if value is not None:
            from app.models.consultation import ConsultationNote
            if not ConsultationNote.get_or_none(ConsultationNote.id == value):
                raise ValidationError('Consultation note not found.')


class DeliveryCreateSchema(Schema):
    prescription_id = fields.Int(required=True)
    rider_id = fields.Int(allow_none=True)
    delivery_address = fields.Str(required=True, validate=validate.Length(min=5, max=1000))

    @validates('prescription_id')
    def validate_prescription_id(self, value, **kwargs):
        from app.models.prescription import Prescription
        if not Prescription.get_or_none(Prescription.id == value):
            raise ValidationError('Prescription not found.')

    @validates('rider_id')
    def validate_rider_id(self, value, **kwargs):
        if value is not None:
            from app.models.user import User
            rider = User.get_or_none((User.id == value) & (User.role == 'RIDER'))
            if not rider:
                raise ValidationError('Rider not found.')


class DeliveryStatusSchema(Schema):
    status = fields.Str(
        required=True,
        validate=validate.OneOf(['PENDING', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'FAILED'])
    )
    status_note = fields.Str(allow_none=True, validate=validate.Length(max=1000))


class UserCreateSchema(Schema):
    email = fields.Email(allow_none=True, load_default=None)
    phone = fields.Str(allow_none=True, validate=validate.Length(max=30))
    password = fields.Str(required=True, validate=validate.Length(min=8, max=128))
    full_name = fields.Str(required=True, validate=validate.Length(min=2, max=120))
    role = fields.Str(
        required=True,
        validate=validate.OneOf(['CLINIC_STAFF', 'SPECIALIST', 'LAB_OFFICER', 'RIDER', 'ADMIN'])
    )
    clinic_id = fields.Int(allow_none=True)
    speciality = fields.Str(allow_none=True, validate=validate.Length(max=120))

    @validates('email')
    def validate_email(self, value, **kwargs):
        if value and not EMAIL_REGEX.match(value):
            raise ValidationError('Invalid email format.')

    @validates('password')
    def validate_password(self, value, **kwargs):
        from app.services.auth_service import validate_password_strength
        errors = validate_password_strength(value)
        if errors:
            raise ValidationError(errors)


class ClinicCreateSchema(Schema):
    name = fields.Str(required=True, validate=validate.Length(min=2, max=120))
    district = fields.Str(required=True, validate=validate.Length(min=2, max=120))
    contact_phone = fields.Str(allow_none=True, validate=validate.Length(max=30))
