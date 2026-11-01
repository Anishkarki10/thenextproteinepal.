import { describe, expect, it } from 'vitest'
import { formatNepaliDate, formatNepaliDateTime } from './datetime'

describe('Nepal time formatting', () => {
  it('shifts UTC by +5:45 regardless of the machine timezone', () => {
    expect(formatNepaliDateTime('2026-11-30T18:14:00Z')).toBe('Nov 30, 2026, 11:59 PM NPT')
  })
  it('rolls over to the next Nepal day', () => {
    expect(formatNepaliDate('2026-12-04T18:15:00Z')).toBe('Dec 5, 2026')
  })
})
