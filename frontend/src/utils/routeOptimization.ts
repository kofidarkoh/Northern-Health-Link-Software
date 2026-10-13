import type { Delivery } from '../types'

const DISTRICTS = [
  'Tamale', 'Savelugu', 'Karaga', 'Gushegu',
  'Yendi', 'Bimbilla', 'Kpandai', 'Dambai',
  'Wa', 'Bolgatanga', 'Navrongo', 'Techiman',
  'Sunyani', 'Kumasi', 'Accra', 'Ouagadougou',
]

const DISTANCE_MATRIX: Record<string, Record<string, number>> = {
  Tamale:      { Tamale: 0, Savelugu: 24, Karaga: 45, Gushegu: 65, Yendi: 95, Bimbilla: 130, Wa: 170, Bolgatanga: 160, Accra: 620, Kumasi: 380 },
  Savelugu:    { Tamale: 24, Savelugu: 0, Karaga: 30, Gushegu: 50, Yendi: 80, Bimbilla: 115, Wa: 150, Bolgatanga: 145, Accra: 600, Kumasi: 360 },
  Karaga:      { Tamale: 45, Savelugu: 30, Karaga: 0, Gushegu: 35, Yendi: 65, Bimbilla: 100, Wa: 130, Bolgatanga: 175, Accra: 640, Kumasi: 400 },
  Gushegu:     { Tamale: 65, Savelugu: 50, Karaga: 35, Gushegu: 0, Yendi: 45, Bimbilla: 80, Wa: 160, Bolgatanga: 200, Accra: 660, Kumasi: 420 },
  Yendi:       { Tamale: 95, Savelugu: 80, Karaga: 65, Gushegu: 45, Yendi: 0, Bimbilla: 40, Wa: 200, Bolgatanga: 230, Accra: 690, Kumasi: 450 },
  Bimbilla:    { Tamale: 130, Savelugu: 115, Karaga: 100, Gushegu: 80, Yendi: 40, Bimbilla: 0, Wa: 230, Bolgatanga: 260, Accra: 720, Kumasi: 480 },
  Wa:          { Tamale: 170, Savelugu: 150, Karaga: 130, Gushegu: 160, Yendi: 200, Bimbilla: 230, Wa: 0, Bolgatanga: 110, Accra: 570, Kumasi: 330 },
  Bolgatanga:  { Tamale: 160, Savelugu: 145, Karaga: 175, Gushegu: 200, Yendi: 230, Bimbilla: 260, Wa: 110, Bolgatanga: 0, Accra: 560, Kumasi: 320 },
  Accra:       { Tamale: 620, Savelugu: 600, Karaga: 640, Gushegu: 660, Yendi: 690, Bimbilla: 720, Wa: 570, Bolgatanga: 560, Accra: 0, Kumasi: 250 },
  Kumasi:      { Tamale: 380, Savelugu: 360, Karaga: 400, Gushegu: 420, Yendi: 450, Bimbilla: 480, Wa: 330, Bolgatanga: 320, Accra: 250, Kumasi: 0 },
}

function extractDistrict(address: string): string {
  const normalized = address.toLowerCase()
  for (const district of DISTRICTS) {
    if (normalized.includes(district.toLowerCase())) {
      return district
    }
  }
  return 'Tamale'
}

function getDistance(a: string, b: string): number {
  const da = DISTANCE_MATRIX[a]
  if (da && da[b] !== undefined) return da[b]
  return 80
}

function nearestNeighborTSP(deliveries: Delivery[]): Delivery[] {
  if (deliveries.length <= 2) return deliveries

  const items = deliveries.map((d) => ({
    delivery: d,
    district: extractDistrict(d.delivery_address),
  }))

  const visited = new Set<number>()
  const route: typeof items = []

  let current = items[0]
  route.push(current)
  visited.add(current.delivery.id)

  while (visited.size < items.length) {
    let nearestIdx = -1
    let nearestDist = Infinity

    for (let i = 0; i < items.length; i++) {
      if (visited.has(items[i].delivery.id)) continue
      const dist = getDistance(current.district, items[i].district)
      if (dist < nearestDist) {
        nearestDist = dist
        nearestIdx = i
      }
    }

    if (nearestIdx === -1) break
    current = items[nearestIdx]
    route.push(current)
    visited.add(current.delivery.id)
  }

  return route.map((r) => r.delivery)
}

export interface OptimizedRoute {
  deliveries: Delivery[]
  totalDistance: number
  estimatedTimeMinutes: number
  stops: { district: string; deliveryId: number; distance: number }[]
}

export function optimizeRoute(deliveries: Delivery[]): OptimizedRoute {
  const sorted = nearestNeighborTSP(deliveries)
  const stops: OptimizedRoute['stops'] = []
  let totalDistance = 0

  for (let i = 0; i < sorted.length; i++) {
    const district = extractDistrict(sorted[i].delivery_address)
    const distance = i === 0 ? 0 : getDistance(extractDistrict(sorted[i - 1].delivery_address), district)
    totalDistance += distance
    stops.push({
      district,
      deliveryId: sorted[i].id,
      distance,
    })
  }

  const estimatedTimeMinutes = Math.round((totalDistance / 50) * 60)

  return { deliveries: sorted, totalDistance, estimatedTimeMinutes, stops }
}
