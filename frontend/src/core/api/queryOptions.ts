/**
 * TanStack Query freshness presets (ms).
 * Global default (app/_layout.tsx) is 120s. Override per data volatility:
 * - reference: rarely changes (specialists, clinics) -> 10 min
 * - live: status-driven lists riders act on (appointments, deliveries) -> 60s
 */
export const STALE = {
  reference: 10 * 60 * 1000,
  live: 60 * 1000,
} as const
