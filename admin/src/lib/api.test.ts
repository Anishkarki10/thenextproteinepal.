import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const store = new Map<string, string>()
const location = { href: '' }

beforeEach(() => {
  store.clear()
  location.href = ''
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
  })
  vi.stubGlobal('window', { location })
})
afterEach(() => vi.unstubAllGlobals())

const respond = (status: number, body?: unknown) =>
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(new Response(body === undefined ? null : JSON.stringify(body), { status })),
  )

describe('admin api', () => {
  it('sends the bearer token', async () => {
    const { api, setToken } = await import('./api')
    setToken('abc')
    respond(200, [])
    await api.listDiscounts()
    const [url, init] = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(url).toMatch(/\/api\/admin\/discounts$/)
    expect(init.headers.Authorization).toBe('Bearer abc')
  })

  it('clears the token and redirects to /admin/login on 401', async () => {
    const { api, setToken, getToken } = await import('./api')
    setToken('expired')
    respond(401, { msg: 'Token has expired' })
    await expect(api.listDiscounts()).rejects.toThrow('Unauthorized')
    expect(getToken()).toBeNull()
    expect(location.href).toBe('/admin/login')
  })

  it('surfaces overlap errors from the discount API', async () => {
    const { api } = await import('./api')
    respond(409, { error: 'This overlaps another discount on the same product (15% off, id 1)' })
    await expect(
      api.createDiscount({ product_id: 1, percent: 10, label: null, starts_at: '2026-12-01T00:00:00+05:45', ends_at: null }),
    ).rejects.toThrow('overlaps')
  })

  it('handles 204 on delete', async () => {
    const { api } = await import('./api')
    respond(204)
    await expect(api.deleteDiscount(1)).resolves.toBeUndefined()
    expect((fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0][1].method).toBe('DELETE')
  })
})
