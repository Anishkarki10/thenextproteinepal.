// Flat per-order delivery charges. Display only - the backend adds the real
// charge (DELIVERY_CHARGES_NPR in app/config.py); keep the two in sync.
export const DELIVERY_ZONES = {
  inside_valley: { label: 'Inside Valley', hint: 'Kathmandu, Lalitpur & Bhaktapur', chargeNpr: 100 },
  outside_valley: { label: 'Outside Valley', hint: 'Rest of Nepal', chargeNpr: 170 },
} as const

export type DeliveryZone = keyof typeof DELIVERY_ZONES

export function deliveryChargeFor(zone: DeliveryZone | null): number {
  return zone ? DELIVERY_ZONES[zone].chargeNpr : 0
}
