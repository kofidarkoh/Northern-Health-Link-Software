import { Redirect } from 'expo-router'
import { useAuth } from '../../../src/features/auth'
import {
  ClinicDashboard,
  SpecialistDashboard,
  LabDashboard,
  RiderDashboard,
} from '../../../src/features/dashboard'

export default function DashboardScreen() {
  const { user } = useAuth()

  switch (user?.role) {
    case 'ADMIN':
      return <Redirect href="/(app)/(tabs)" />
    case 'CLINIC_STAFF':
      return <ClinicDashboard />
    case 'SPECIALIST':
      return <SpecialistDashboard />
    case 'LAB_OFFICER':
      return <LabDashboard />
    case 'RIDER':
      return <RiderDashboard />
    default:
      return <Redirect href="/(app)/(tabs)" />
  }
}
