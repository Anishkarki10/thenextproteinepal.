import { describe, expect, it } from 'vitest'
import { cartReducer, roundNpr, type CartItem } from './CartContext'

const item = (variantId: number, overrides: Partial<CartItem> = {}): CartItem => ({
  variantId,
  productSlug: 'protein-loaf',
  productName: 'Protein Loaf',
  variantLabel: '500 g',
  unitPriceNpr: 350,
  listPriceNpr: 350,
  quantity: 1,
  ...overrides,
})

describe('cartReducer', () => {
  it('adds a new item and merges quantity for the same variant', () => {
    const { quantity: _, ...newItem } = item(1)
    let state = cartReducer({ items: [] }, { type: 'ADD', item: newItem, quantity: 2 })
    state = cartReducer(state, { type: 'ADD', item: newItem, quantity: 3 })
    expect(state.items).toHaveLength(1)
    expect(state.items[0].quantity).toBe(5)
  })

  it('removes items, and drops them when quantity goes below 1', () => {
    const start = { items: [item(1), item(2)] }
    expect(cartReducer(start, { type: 'REMOVE', variantId: 1 }).items.map((i) => i.variantId)).toEqual([2])
    expect(cartReducer(start, { type: 'SET_QUANTITY', variantId: 2, quantity: 0 }).items.map((i) => i.variantId)).toEqual([1])
    expect(cartReducer(start, { type: 'SET_QUANTITY', variantId: 2, quantity: 4 }).items[1].quantity).toBe(4)
  })

  it('reprices items that are still on sale, leaves unknown variants alone', () => {
    const start = { items: [item(1), item(2, { unitPriceNpr: 298 })] }
    const prices = new Map([[1, { unitPriceNpr: 298, listPriceNpr: 350 }]])
    const next = cartReducer(start, { type: 'REPRICE', prices })
    expect(next.items[0].unitPriceNpr).toBe(298)
    expect(next.items[1].unitPriceNpr).toBe(298) // not in the map -> unchanged
  })

  it('reprices back up when a discount has ended', () => {
    const start = { items: [item(1, { unitPriceNpr: 298 })] }
    const next = cartReducer(start, { type: 'REPRICE', prices: new Map([[1, { unitPriceNpr: 350, listPriceNpr: 350 }]]) })
    expect(next.items[0].unitPriceNpr).toBe(350)
  })

  it('clears and hydrates', () => {
    expect(cartReducer({ items: [item(1)] }, { type: 'CLEAR' }).items).toEqual([])
    expect(cartReducer({ items: [] }, { type: 'HYDRATE', items: [item(9)] }).items[0].variantId).toBe(9)
  })
})

describe('roundNpr', () => {
  it('removes floating point noise', () => {
    expect(roundNpr(382.35 * 3)).toBe(1147.05)
    expect(roundNpr(0.1 + 0.2)).toBe(0.3)
    expect(roundNpr(298 * 2 + 170)).toBe(766)
  })
})
