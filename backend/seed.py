import logging
from app.database import get_database, close_database
from app.models.clinic import Clinic
from app.models.user import User
from app.services.auth_service import hash_password

logger = logging.getLogger(__name__)


def seed_database():
    db = get_database()
    db.connect(reuse_if_open=True)

    try:
        if Clinic.select().count() > 0:
            print("Database already seeded. Skipping.")
            return

        print("Seeding database...")

        clinics_data = [
            {'name': 'Savelugu Rural Clinic', 'district': 'Savelugu District', 'contact_phone': '+233200000001'},
            {'name': 'Karaga Health Centre', 'district': 'Karaga District', 'contact_phone': '+233200000002'},
            {'name': 'Gushegu Municipal Hospital', 'district': 'Gushegu Municipal', 'contact_phone': '+233200000003'},
            {'name': 'Tamale Teaching Hospital', 'district': 'Tamale Metro', 'contact_phone': '+233200000004'},
        ]

        clinics = []
        for clinic_data in clinics_data:
            clinic = Clinic.create(**clinic_data)
            clinics.append(clinic)
            print(f"  Created clinic: {clinic.name}")

        users_data = [
            {
                'user_id': 'AD-100001',
                'email': 'admin@northernhealthlink.org',
                'phone': '+233200000000',
                'password': 'Admin123!',
                'full_name': 'System Administrator',
                'role': 'ADMIN',
                'clinic_id': None
            },
            {
                'user_id': 'CS-200001',
                'email': 'amina@savelugu.org',
                'phone': '+233200000001',
                'password': 'Password123!',
                'full_name': 'Nurse Amina',
                'role': 'CLINIC_STAFF',
                'clinic_id': clinics[0].id
            },
            {
                'user_id': 'CS-200002',
                'email': 'fatima@karaga.org',
                'phone': '+233200000002',
                'password': 'Password123!',
                'full_name': 'Nurse Fatima',
                'role': 'CLINIC_STAFF',
                'clinic_id': clinics[1].id
            },
            {
                'user_id': 'SP-300001',
                'email': 'ibrahim@tamale.org',
                'phone': '+233200000003',
                'password': 'Password123!',
                'full_name': 'Dr. Ibrahim',
                'role': 'SPECIALIST',
                'speciality': 'General Medicine',
                'clinic_id': clinics[3].id
            },
            {
                'user_id': 'SP-300002',
                'email': 'salma@tamale.org',
                'phone': '+233200000004',
                'password': 'Password123!',
                'full_name': 'Dr. Salma',
                'role': 'SPECIALIST',
                'speciality': 'Pediatrics',
                'clinic_id': clinics[3].id
            },
            {
                'user_id': 'LO-400001',
                'email': 'mohammed@tamale.org',
                'phone': '+233200000005',
                'password': 'Password123!',
                'full_name': 'Lab Officer Mohammed',
                'role': 'LAB_OFFICER',
                'clinic_id': clinics[3].id
            },
            {
                'user_id': 'RD-500001',
                'email': 'abdul@northernhealthlink.org',
                'phone': '+233200000006',
                'password': 'Password123!',
                'full_name': 'Rider Abdul',
                'role': 'RIDER',
                'clinic_id': clinics[3].id
            },
            {
                'user_id': 'RD-500002',
                'email': 'kwame@northernhealthlink.org',
                'phone': '+233200000007',
                'password': 'Password123!',
                'full_name': 'Rider Kwame',
                'role': 'RIDER',
                'clinic_id': clinics[3].id
            },
        ]

        for user_data in users_data:
            password = user_data.pop('password')
            password_hash = hash_password(password)
            user = User.create(
                **user_data,
                password_hash=password_hash
            )
            print(f"  Created user: {user.full_name} ({user.role}) -> {user.user_id}")

        print("\nDatabase seeding completed!")
        print("\n--- Login Credentials ---")
        print("Admin:      AD-100001 / Admin123!")
        print("Staff:      CS-200001 / Password123!")
        print("Staff:      CS-200002 / Password123!")
        print("Specialist: SP-300001 / Password123!")
        print("Specialist: SP-300002 / Password123!")
        print("Lab:        LO-400001 / Password123!")
        print("Rider:      RD-500001 / Password123!")
        print("Rider:      RD-500002 / Password123!")

    except Exception as e:
        logger.exception("Database seeding failed: %s", e)
        print(f"Seeding failed: {e}")
        raise
    finally:
        db.close()


if __name__ == '__main__':
    from app import create_app
    app = create_app()
    with app.app_context():
        seed_database()
