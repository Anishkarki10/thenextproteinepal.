import { describe, expect, it } from 'vitest'
import { discountedPrice, isoToNptInput, nptInputToIso } from './nptInput'

describe('Nepal-time datetime inputs', () => {
  it('converts a UTC timestamp to Nepal wall-clock time', () => {
    expect(isoToNptInput('2026-12-04T18:15:00Z')).toBe('2026-12-05T00:00')
    expect(isoToNptInput('2026-11-30T18:14:00Z')).toBe('2026-11-30T23:59')
  })
  it('sends input values with the +05:45 offset', () => {
    expect(nptInputToIso('2026-12-05T00:00')).toBe('2026-12-05T00:00:00+05:45')
  })
  it('round-trips', () => {
    const iso = nptInputToIso('2027-01-15T09:30')
    expect(isoToNptInput(new Date(iso).toISOString())).toBe('2027-01-15T09:30')
    expect(new Date(iso).toISOString()).toBe('2027-01-15T03:45:00.000Z')
  })
})

describe('discountedPrice preview (must match backend apply_percent_off)', () => {
  it.each([
    [350, 15, 298],
    [350, 10, 315],
    [450, 12.5, 394],
    [999, 33, 669],
    [100, 50, 50],
    [1000, 99.99, 0],
    [200, 0.25, 200],
  ])('NPR %d at %d%% off -> NPR %d', (price, percent, expected) => {
    expect(discountedPrice(price, percent)).toBe(expected)
  })
})
