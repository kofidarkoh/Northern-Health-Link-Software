"""Seed ~100 linked demo records for testing (patients + appointments + labs + Rx + deliveries + notifications).

Usage:
    ./venv/bin/python seed_demo100.py [--count 100] [--seed 42]

Safe: reuses existing clinics/users from seed.py, skips if demo data already present
unless --force is passed. All FK constraints respected.
"""
import argparse
import random
from datetime import datetime, timedelta

FIRST = ["Amina", "Fatima", "Ibrahim", "Salma", "Abdul", "Kwame", "Yaw", "Akosua", "Efua",
         "Kofi", "Ama", "Kojo", "Adwoa", "Yaw", "Fuseina", "Memuna", "Alhassan", "Baba",
         "Lariba", "Azara", "Mariam", "Issah", "Sulemana", "Rashida", "Hawa"]
LAST = ["Mensah", "Owusu", "Boateng", "Diallo", "Bah", "Sow", "Traore", "Konate", "Osei",
        "Addo", "Abdulai", "Mahama", "Iddrisu", "Yakubu", "Fuseini", "Alhassan", "Karim", "Sule"]
DISTRICTS = ["Karaga District", "Gushegu Municipal", "Savelugu Municipal", "Tamale Metropolitan",
             "Tolon District", "Kumbungu District", "Yendi Municipal"]
TESTS = ["Malaria RDT", "Full Blood Count", "Blood Glucose", "HIV Screening", "Hepatitis B",
         "Urinalysis", "Typhoid Test", "Hemoglobin", "Chest X-ray", "Sputum TB Test"]
MEDS = [("Artemether-Lumefantrine", "80/480mg", "Twice daily", "3 days"),
        ("Amoxicillin", "500mg", "Three times daily", "7 days"),
        ("Paracetamol", "500mg", "Twice daily", "5 days"),
        ("ORS Sachets", "1 sachet/L", "After stool", "3 days"),
        ("Iron + Folic Acid", "60mg", "Once daily", "30 days"),
        ("Ciprofloxacin", "500mg", "Twice daily", "7 days")]
APPT_STATUS = ["REQUESTED", "SCHEDULED", "SCHEDULED", "IN_PROGRESS", "COMPLETED", "COMPLETED", "CANCELLED"]
DELIVERY_STATUS = ["PENDING", "PENDING", "PICKED_UP", "IN_TRANSIT", "DELIVERED", "DELIVERED", "FAILED"]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--count", type=int, default=100)
    ap.add_argument("--seed", type=int, default=42)
    ap.add_argument("--force", action="store_true", help="seed even if demo data exists")
    args = ap.parse_args()
    random.seed(args.seed)

    from app import create_app
    app = create_app()
    with app.app_context():
        from app.database import get_database
        from app.models.clinic import Clinic
        from app.models.user import User
        from app.models.patient import Patient
        from app.models.appointment import Appointment
        from app.models.consultation import ConsultationNote
        from app.models.lab import LabRequest, LabResult
        from app.models.prescription import Prescription
        from app.models.delivery import Delivery
        from app.models.notification import Notification

        db = get_database()
        db.connect(reuse_if_open=True)

        if Patient.select().count() >= args.count and not args.force:
            print(f"Already have {Patient.select().count()} patients. Use --force to add more.")
            return

        clinics = list(Clinic.select())
        staff = list(User.select().where(User.role == "CLINIC_STAFF"))
        specs = list(User.select().where(User.role == "SPECIALIST"))
        lab_officers = list(User.select().where(User.role == "LAB_OFFICER"))
        riders = list(User.select().where(User.role == "RIDER"))
        admins = list(User.select().where(User.role == "ADMIN"))
        if not (clinics and staff and specs):
            raise SystemExit("Run seed.py first (need clinics + staff + specialists).")

        n = args.count
        now = datetime.now()
        patients, appointments, prescriptions = [], [], []
        for i in range(n):
            c = random.choice(clinics)
            s = random.choice(staff)
            name = f"{random.choice(FIRST)} {random.choice(LAST)}"
            p = Patient.create(
                clinic=c.id, registered_by=s.id, full_name=name,
                age=random.randint(1, 85), gender=random.choice(["Male", "Female", "Female", "Male", "Other"]),
                contact_phone=f"+2335{random.randint(10000000, 59999999)}",
                district=random.choice(DISTRICTS),
                medical_history=random.choice([None, "Hypertension", "Asthma", "Diabetes", "None significant"]),
                emergency_contact=f"+2335{random.randint(10000000, 59999999)}",
            )
            patients.append(p)

        for p in patients:
            if random.random() < 0.7:
                sp = random.choice(specs)
                st = random.choice(APPT_STATUS)
                a = Appointment.create(
                    patient=p.id, clinic=p.clinic_id, specialist=sp.id,
                    appointment_time=now - timedelta(days=random.randint(0, 30), hours=random.randint(0, 12)),
                    status=st,
                    video_room_url=f"https://meet.nhls.local/{p.id}-{random.randint(1000,9999)}" if st != "CANCELLED" else None,
                    created_by=random.choice(staff).id,
                )
                appointments.append(a)
                if st == "COMPLETED":
                    ConsultationNote.create(
                        appointment=a.id, specialist=sp.id,
                        diagnosis=random.choice(["Uncomplicated malaria", "URTI", "Gastroenteritis", "Hypertension review", "Anemia"]),
                        recommendations="Follow up in 2 weeks.",
                        treatment_instructions="As prescribed.",
                    )
            if random.random() < 0.6:
                lr = LabRequest.create(
                    patient=p.id, requested_by=random.choice(staff + specs).id,
                    test_type=random.choice(TESTS),
                    clinical_reason="Fever workup",
                    status=random.choice(["REQUESTED", "REQUESTED", "RESULT_UPLOADED"]),
                )
                if lr.status == "RESULT_UPLOADED" and lab_officers:
                    LabResult.create(lab_request=lr.id, uploaded_by=random.choice(lab_officers).id,
                                     result_summary=random.choice(["Negative", "Positive — treat per protocol", "Within normal limits"]))
            if random.random() < 0.55:
                med, dose, freq, dur = random.choice(MEDS)
                rx = Prescription.create(
                    patient=p.id, prescribed_by=random.choice(specs).id,
                    medication_name=med, dosage=dose, frequency=freq, duration=dur,
                    instructions="Take with food. Return if worsening.",
                )
                prescriptions.append(rx)
                if random.random() < 0.7:
                    Delivery.create(
                        prescription=rx.id,
                        rider=random.choice(riders).id if riders and random.random() < 0.8 else None,
                        requested_by=random.choice(staff).id,
                        delivery_address=f"{random.randint(1,99)} {random.choice(['Hospital Rd','Market St','Clinic Junction'])}, {p.district}",
                        status=random.choice(DELIVERY_STATUS),
                    )

        # notifications to admins + a few staff (for inbox/broadcast testing)
        for a in admins[:1]:
            for k in range(10):
                Notification.create(user=a.id, title=random.choice(
                    ["Lab queue backlog", "Rider delayed", "New appointment spike", "Stock reminder"]),
                    message="Auto-generated demo alert for admin console testing.")

        print(f"Seeded {len(patients)} patients, {len(appointments)} appointments, "
              f"{LabRequest.select().count()} lab requests, {len(prescriptions)} prescriptions, "
              f"{Delivery.select().count()} deliveries.")


if __name__ == "__main__":
    main()
