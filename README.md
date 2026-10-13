# Northern Health Link Software (NHLS)

A mobile-first healthcare platform connecting rural clinics in Northern Ghana with medical specialists through video consultation, lab result sharing, digital prescriptions, and medication delivery tracking.

## Problem

Over 70% of specialists in Northern Ghana are based in Tamale. Patients from rural districts like Karaga and Gushegu travel 4+ hours for basic specialist consultation. This causes delays in diagnosis, increased costs, and avoidable mortality.

## Solution

Northern Health Link enables rural clinics to:
- Register patients and manage medical records
- Schedule and conduct video consultations with specialists
- Request and receive lab results digitally
- Create and manage digital prescriptions
- Track medication delivery via motorcycle fleet
- Receive real-time notifications for all healthcare events

## Tech Stack

### Backend
- **Framework:** Flask (Python)
- **Database:** MySQL (local dev / Aiven.io production)
- **ORM:** Peewee
- **Authentication:** Flask-JWT-Extended (JWT)
- **Real-time:** Flask-SocketIO (gevent)
- **Caching:** Flask-Caching
- **Rate Limiting:** Flask-Limiter
- **CORS:** Flask-CORS
- **Validation:** Marshmallow

### Admin Web Console
- **Stack:** htmx + W3.CSS (vendored, works offline) + Jinja partials, served by Flask at `/admin/*`
- **Pages:** Login, Dashboard, Users, Clinics, Audit Logs (+ clinical operations views)

### Frontend
- **Framework:** React Native (Expo SDK 57)
- **Language:** TypeScript
- **Navigation:** Expo Router
- **UI Library:** React Native Paper (Material Design)
- **State Management:** Zustand, TanStack Query v5
- **HTTP Client:** Axios with JWT interceptor
- **Real-time:** Socket.IO client
- **Storage:** expo-secure-store, localStorage (web)

## User Roles

| Role | Responsibilities |
|------|-----------------|
| **ADMIN** | Web console only: users, clinics, dashboard, audit logs, reports (htmx admin UI, not in the mobile app) |
| **CLINIC_STAFF** | Register patients, schedule appointments, request labs, request deliveries |
| **SPECIALIST** | Conduct consultations, record diagnosis, create prescriptions |
| **LAB_OFFICER** | Receive lab requests, upload test results |
| **RIDER** | Update medication delivery status (pending/picked up/in transit/delivered/failed) |

## Project Structure

```
NHLS/
├── app/                  # Flask backend package
│   ├── api/              # Blueprints (auth, patients, clinical, prescriptions, deliveries, notifications, admin, lab)
│   ├── models/           # Peewee ORM models
│   ├── services/         # Business logic (auth, patient, audit, notification)
│   ├── schemas/          # Marshmallow validators
│   └── middleware/       # RBAC decorators
├── admin_ui/             # htmx admin web console (templates, static, views)
├── migrations/           # Versioned schema migrations (`python migrate.py migrate`)
├── uploads/              # Lab result files + avatars (gitignored, ephemeral on Render)
├── wsgi.py               # Production entry (gevent)
├── run.py                # Dev entry
├── migrate.py            # Migration runner
├── seed.py               # Database seeder
├── backup.sh             # Dated mysqldump backups with pruning
├── requirements.txt      # Python dependencies (repo root so Render finds them)
├── render.yaml           # Render blueprint
└── .env                  # Environment config
├── frontend/
│   ├── app/                  # Expo Router screens
│   │   ├── (auth)/           # Login
│   │   └── (app)/            # Main app (tabs, feature screens)
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── core/api/         # API clients (Axios)
│   │   ├── features/         # Auth, notifications, offline stores
│   │   ├── constants/        # Colors, spacing, layout
│   │   ├── navigation/       # Role-based route config
│   │   ├── types/            # TypeScript interfaces
│   │   └── utils/            # Helpers (apiError, routeOptimization)
│   └── web/                  # Self-hosted icon fonts
└── NHLS_UPDATED.txt          # Project report (current; NHLS_LEGACY_SUPERSEDED.txt is a stale draft)
```

## Database Schema (11 Tables)

| Table | Description |
|-------|-------------|
| `clinics` | Rural clinics and health centres |
| `users` | All system users with roles |
| `patients` | Patient records with medical history |
| `appointments` | Consultation schedules with status tracking |
| `consultation_notes` | Specialist diagnosis and recommendations |
| `lab_requests` | Laboratory test requests |
| `lab_results` | Uploaded test results with file links |
| `prescriptions` | Digital medication prescriptions |
| `deliveries` | Medication delivery tracking |
| `notifications` | Real-time alerts for all events |
| `audit_logs` | System activity audit trail |

All tables use soft delete, foreign key relationships, and timestamp tracking.

## API Endpoints (~30)

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | User login (returns JWT + refresh token) |
| POST | `/api/auth/register` | Register user (admin only) |
| POST | `/api/auth/refresh` | Refresh access token |
| DELETE | `/api/auth/logout` | Logout (blacklists both tokens) |
| GET | `/api/auth/me` | Get current user profile |
| PATCH | `/api/auth/me` | Update profile (name, phone) |
| PUT | `/api/auth/me/password` | Change password |

### Patients
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/patients` | Register patient (clinic staff) |
| GET | `/api/patients` | Search patients |
| GET | `/api/patients/:id` | Get patient details |
| PUT | `/api/patients/:id` | Update patient |
| DELETE | `/api/patients/:id` | Delete patient (admin) |

### Clinical
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/clinical/appointments` | Create appointment |
| PATCH | `/api/clinical/appointments/:id/status` | Update appointment status |
| GET | `/api/clinical/appointments/:id` | Get appointment details |
| POST | `/api/clinical/consultation-notes` | Record consultation notes |
| POST | `/api/clinical/lab-requests` | Create lab request |
| GET | `/api/clinical/lab-requests` | List lab requests |
| POST | `/api/clinical/lab-results` | Upload lab results |
| GET | `/api/clinical/lab-results` | List lab results |
| GET | `/api/clinical/specialists` | List specialists |
| POST | `/api/lab/results/upload` | Upload lab result file (multipart) |

### Prescriptions
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/prescriptions` | Create prescription |
| GET | `/api/prescriptions` | List prescriptions |
| GET | `/api/prescriptions/:id` | Get prescription details |

### Deliveries
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/deliveries` | Request delivery |
| GET | `/api/deliveries` | List deliveries |
| PATCH | `/api/deliveries/:id/status` | Update delivery status |

### Notifications
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notifications` | List notifications |
| PATCH | `/api/notifications/:id/read` | Mark as read |
| PATCH | `/api/notifications/read-all` | Mark all as read |
| POST | `/api/notifications/register-device` | Register push device token |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/users` | List users |
| POST | `/api/admin/users` | Create user |
| PATCH | `/api/admin/users/:id` | Update user |
| DELETE | `/api/admin/users/:id` | Delete user |
| POST | `/api/admin/users/:id/reset-password` | Admin reset (temporary password, must-change enforced) |
| POST | `/api/admin/avatar` | Upload user avatar (multipart) |
| GET | `/api/admin/clinics` | List clinics |
| POST | `/api/admin/clinics` | Create clinic |
| GET | `/api/admin/dashboard` | Dashboard stats |
| GET | `/api/admin/audit-logs` | List audit logs |

### Admin Web Console (htmx, same Flask app)
| Page | URL | Description |
|------|-----|-------------|
| Login | `/admin/login` | Admin-only sign in (JWT) |
| Dashboard | `/admin/` | System stats |
| Users | `/admin/users` | Table, filters, activate toggle, reset, create + avatars |
| Clinics | `/admin/clinics` | Clinic list with counts |
| Audit Logs | `/admin/audit-logs` | Activity trail with filters |

## Frontend Screens

### Authentication
- `/(auth)/login` — Login with army green theme (User ID + password)
- `/(auth)/forgot-password` + `/(auth)/reset-password` — User-ID + security-question recovery flow

### Tabs (Role-based)
- `/(tabs)/` — Home dashboard with quick actions (admins see a web-console notice here)
- `/(tabs)/notifications` — Real-time notifications with mark-all-read
- `/(tabs)/profile` — Account settings, offline mode, sync status, help

### Feature Screens (field roles)
- `/patients` — Patient list and registration
- `/appointments` — Appointment management
- `/consultations` — Consultation workspace
- `/lab-requests` — Lab request management
- `/lab-results` — Lab result viewing and upload
- `/prescriptions` — Prescription management
- `/deliveries` — Delivery tracking with route optimization
- `/sync` — Offline sync management console
- `/dashboard` — Role dashboard (clinic/specialist/lab/rider)
- `/profile/edit` — Edit profile
- `/profile/change-password` — Change password (forced after admin reset)

> Admin screens (users, clinics, audit logs, admin dashboard) live in the htmx web console (`/admin/*`), not the mobile app.

## Setup

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Configure .env
cp .env.example .env
# Edit .env with MySQL credentials, JWT secret, CORS origins

# Initialize database
python seed.py

# Run development server
python run.py

# Run production server
./start.sh
```

### Frontend

```bash
cd frontend
npm install

# Start Expo dev server
npx expo start

# Open in browser
# http://localhost:8081
```

### Seed Data (login with User ID)

| User ID | Password | Role |
|-------|----------|------|
| AD-100001 | Admin123! | ADMIN (web console) |
| CS-200001 | Password123! | CLINIC_STAFF |
| SP-300001 | Password123! | SPECIALIST |
| LO-400001 | Password123! | LAB_OFFICER |
| RD-500001 | Password123! | RIDER |

## Key Features

### Security
- JWT authentication with access + refresh token pair
- Token blacklisting on logout (both tokens invalidated)
- Role-based access control (RBAC) on every endpoint (uppercase roles in JWT claims, numeric identity)
- Temporary passwords force a change on next login (`must_change_password`)
- bcrypt password hashing
- Rate limiting on all endpoints
- Audit logging for all critical actions
- CORS protection

### Offline Support
- Zustand store with localStorage/SecureStore persistence
- Action queue for offline operations
- Manual offline mode toggle
- Sync dashboard with retry logic (max 3 attempts)
- Offline status banner on home screen
- Per-query freshness tuning (reference data 10 min, live lists 60s) + immutable caching for uploads

### Operations
- `backup.sh` — dated `mysqldump` backups with 14-day pruning

### Route Optimization (Riders)
- Nearest-neighbor TSP algorithm
- Distance matrix for Northern Ghana districts
- Optimized delivery itinerary with estimated distance/time
- Visual stop-by-stop breakdown

### Notifications
- Real-time WebSocket alerts via Socket.IO
- Mark individual/all notifications as read
- Unread badge counter

## Testing

```bash
# Frontend TypeScript check
cd frontend
npx tsc --noEmit
```

Backend verification is done via Flask test client + headless browser passes
(login → role flows → admin console). No automated pytest suite is checked in yet
(`tests/` is a placeholder).

## Future Enhancements

- AI-assisted preliminary disease risk assessment
- Multilingual support (local Ghanaian languages)
- Integration with national health information systems
- Telepharmacy services
- Data analytics for public health surveillance
- SMS alerts for notifications
- Expanded geographical coverage to more districts

## Project Report

This project was submitted in partial fulfillment of the requirements for the degree of Bachelor of Computer Applications at SASTRA Deemed University.

**Author:** Enoch Yaw Godseye-Agyapong (Reg. No: 22223070273)
**Supervisor:** Dr. L. Prabaharan, School of Computing

See `NHLS_UPDATED.txt` for the complete project report including system analysis, DFD diagrams, database design, coding documentation, testing results, and implementation details. (`NHLS_LEGACY_SUPERSEDED.txt` is a stale draft describing a Node.js/Express/PostgreSQL stack that was never implemented — do not use it.)

## License

Academic project — SASTRA Deemed University
