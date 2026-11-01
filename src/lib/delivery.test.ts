import { describe, expect, it } from 'vitest'
import { DELIVERY_ZONES, deliveryChargeFor } from './delivery'

describe('delivery zones', () => {
  it('match the backend charges (app/config.py DELIVERY_CHARGES_NPR)', () => {
    expect(DELIVERY_ZONES.inside_valley.chargeNpr).toBe(100)
    expect(DELIVERY_ZONES.outside_valley.chargeNpr).toBe(170)
  })
  it('use the same keys the backend accepts', () => {
    expect(Object.keys(DELIVERY_ZONES).sort()).toEqual(['inside_valley', 'outside_valley'])
  })
  it('charges nothing until a zone is chosen', () => {
    expect(deliveryChargeFor(null)).toBe(0)
    expect(deliveryChargeFor('inside_valley')).toBe(100)
    expect(deliveryChargeFor('outside_valley')).toBe(170)
  })
})
