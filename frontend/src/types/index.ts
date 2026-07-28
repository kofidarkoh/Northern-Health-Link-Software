export type UserRole = 'ADMIN' | 'CLINIC_STAFF' | 'SPECIALIST' | 'LAB_OFFICER' | 'RIDER'

export interface User {
  id: number
  user_id: string
  email: string
  phone: string | null
  full_name: string
  role: UserRole
  clinic_id: number | null
  speciality: string | null
  active: boolean
  created_at: string
  updated_at: string
}

export interface Clinic {
  id: number
  name: string
  district: string
  contact_phone: string | null
  created_at: string
  updated_at: string
}

export interface Patient {
  id: number
  clinic_id: number
  registered_by: number
  full_name: string
  age: number | null
  gender: 'Male' | 'Female' | 'Other'
  contact_phone: string | null
  district: string
  medical_history: string | null
  emergency_contact: string | null
  created_at: string
  updated_at: string
}

export type AppointmentStatus = 'REQUESTED' | 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'

export interface Appointment {
  id: number
  patient_id: number
  clinic_id: number
  specialist_id: number
  appointment_time: string
  status: AppointmentStatus
  video_room_url: string | null
  created_by: number
  created_at: string
  updated_at: string
}

export interface ConsultationNote {
  id: number
  appointment_id: number
  specialist_id: number
  diagnosis: string
  recommendations: string | null
  referral_notes: string | null
  treatment_instructions: string | null
  created_at: string
  updated_at: string
}

export type LabRequestStatus = 'REQUESTED' | 'RESULT_UPLOADED'

export interface LabRequest {
  id: number
  patient_id: number
  requested_by: number
  test_type: string
  clinical_reason: string | null
  status: LabRequestStatus
  created_at: string
  updated_at: string
}

export interface LabResult {
  id: number
  lab_request_id: number
  uploaded_by: number
  result_summary: string
  file_url: string | null
  uploaded_at: string
  updated_at: string
}

export interface Prescription {
  id: number
  patient_id: number
  consultation_note_id: number | null
  prescribed_by: number
  medication_name: string
  dosage: string
  frequency: string | null
  duration: string | null
  instructions: string | null
  created_at: string
  updated_at: string
}

export type DeliveryStatus = 'PENDING' | 'PICKED_UP' | 'IN_TRANSIT' | 'DELIVERED' | 'FAILED'

export interface Delivery {
  id: number
  prescription_id: number
  rider_id: number | null
  requested_by: number
  delivery_address: string
  status: DeliveryStatus
  status_note: string | null
  created_at: string
  updated_at: string
}

export interface Notification {
  id: number
  user_id: number
  patient_id: number | null
  title: string
  message: string
  notification_type: string | null
  read_at: string | null
  created_at: string
  updated_at: string
}

export interface AuditLog {
  id: number
  user_id: number | null
  action: string
  entity_type: string
  entity_id: string | null
  details: string | null
  created_at: string
  updated_at: string
}

export interface PaginatedMeta {
  total: number
  page: number
  per_page: number
  total_pages: number
}

export interface LoginRequest {
  user_id: string
  password: string
}

export interface LoginResponse {
  access_token: string
  refresh_token: string
  user: User
}

export interface DashboardStats {
  total_users: number
  total_clinics: number
  total_patients: number
  total_appointments: number
  pending_lab_requests: number
  pending_deliveries: number
}
