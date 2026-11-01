import { afterEach, describe, expect, it, vi } from 'vitest'
import { api, currentPrice, type ProductVariant } from './api'

const variant = (overrides: Partial<ProductVariant> = {}): ProductVariant => ({
  id: 1,
  label: '500 g',
  pack_size: '500g',
  price_npr: 350,
  discounted_price_npr: null,
  is_enquiry_only: false,
  stock_qty: 10,
  sort_order: 0,
  ...overrides,
})

describe('currentPrice', () => {
  it('returns the list price when there is no discount', () => {
    expect(currentPrice(variant())).toBe(350)
  })
  it('returns the discounted price while a discount is active', () => {
    expect(currentPrice(variant({ discounted_price_npr: 298 }))).toBe(298)
  })
  it('returns null for an enquiry-only variant with no price', () => {
    expect(currentPrice(variant({ price_npr: null, is_enquiry_only: true }))).toBeNull()
  })
})

describe('api error handling', () => {
  afterEach(() => vi.unstubAllGlobals())

  const respond = (status: number, body: unknown) =>
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status })))

  const order = () =>
    api.createOrder({
      customer: { name: 'A', phone: '9800000000', address: 'KTM' },
      items: [{ variant_id: 1, quantity: 1 }],
      payment_method: 'cod',
      delivery_zone: 'inside_valley',
    })

  it('surfaces the backend `error` message', async () => {
    respond(409, { error: 'Not enough stock' })
    await expect(order()).rejects.toThrow('Not enough stock')
  })

  it('surfaces the first field-level validation error', async () => {
    respond(400, { errors: { delivery_zone: "Must be one of ['inside_valley', 'outside_valley']" } })
    await expect(order()).rejects.toThrow('Must be one of')
  })

  it('falls back to the HTTP status', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('<html>', { status: 502 })))
    await expect(order()).rejects.toThrow('Request failed (502)')
  })

  it('sends the delivery zone in the order payload', async () => {
    respond(201, { id: 1 })
    await order()
    const [, init] = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(JSON.parse(init.body).delivery_zone).toBe('inside_valley')
  })
})
