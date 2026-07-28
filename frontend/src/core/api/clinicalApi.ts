import { apiClient } from './client'
import type {
  Appointment,
  ConsultationNote,
  LabRequest,
  LabResult,
  User,
  PaginatedMeta,
} from '../../types'

export const clinicalApi = {
  getAppointment: (id: number) =>
    apiClient
      .get<{ appointment: Appointment }>(`/api/clinical/appointments/${id}`)
      .then((r) => r.data),

  listAppointments: (params?: Record<string, string | number | undefined>) =>
    apiClient
      .get<PaginatedMeta & { appointments: Appointment[] }>('/api/clinical/appointments', { params })
      .then((r) => r.data),

  updateAppointmentStatus: (id: number, data: { status: string; video_room_url?: string }) =>
    apiClient
      .patch<{ appointment: Appointment }>(`/api/clinical/appointments/${id}/status`, data)
      .then((r) => r.data),

  createAppointment: (data: Record<string, unknown>) =>
    apiClient.post<{ appointment: Appointment }>('/api/clinical/appointments', data).then((r) => r.data),

  createConsultationNote: (data: Record<string, unknown>) =>
    apiClient
      .post<{ note: ConsultationNote }>('/api/clinical/consultation-notes', data)
      .then((r) => r.data),

  listSpecialists: (params?: Record<string, string | number | undefined>) =>
    apiClient
      .get<PaginatedMeta & { specialists: User[] }>('/api/clinical/specialists', { params })
      .then((r) => r.data),

  listLabRequests: (params?: Record<string, string | number | undefined>) =>
    apiClient
      .get<PaginatedMeta & { lab_requests: LabRequest[] }>('/api/clinical/lab-requests', { params })
      .then((r) => r.data),

  createLabRequest: (data: Record<string, unknown>) =>
    apiClient.post<{ lab_request: LabRequest }>('/api/clinical/lab-requests', data).then((r) => r.data),

  listLabResults: (params?: Record<string, string | number | undefined>) =>
    apiClient
      .get<PaginatedMeta & { lab_results: LabResult[] }>('/api/clinical/lab-results', { params })
      .then((r) => r.data),

  createLabResult: (data: { lab_request_id: number; result_summary: string; file_url?: string }) =>
    apiClient.post<{ lab_result: LabResult }>('/api/clinical/lab-results', data).then((r) => r.data),
}
