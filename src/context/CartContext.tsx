import { createContext, useContext, useEffect, useMemo, useReducer, type ReactNode } from 'react'
import { api, currentPrice } from '../lib/api'

export interface CartItem {
  variantId: number
  productSlug: string
  productName: string
  variantLabel: string
  unitPriceNpr: number // what will be charged now (after any discount)
  listPriceNpr?: number // pre-discount price; absent on carts saved before discounts existed
  quantity: number
  image?: string
}

export interface CartState {
  items: CartItem[]
}

export type CartAction =
  | { type: 'ADD'; item: Omit<CartItem, 'quantity'>; quantity: number }
  | { type: 'REMOVE'; variantId: number }
  | { type: 'SET_QUANTITY'; variantId: number; quantity: number }
  | { type: 'CLEAR' }
  | { type: 'HYDRATE'; items: CartItem[] }
  | { type: 'REPRICE'; prices: Map<number, { unitPriceNpr: number; listPriceNpr: number }> }

const STORAGE_KEY = 'tnp_cart'

/** Discounted prices can have paisa; round so float noise (e.g. 1147.0500000000002) never shows. */
export function roundNpr(amount: number): number {
  return Math.round(amount * 100) / 100
}

export function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'HYDRATE':
      return { items: action.items }
    case 'ADD': {
      const existing = state.items.find((i) => i.variantId === action.item.variantId)
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.variantId === action.item.variantId ? { ...i, quantity: i.quantity + action.quantity } : i,
          ),
        }
      }
      return { items: [...state.items, { ...action.item, quantity: action.quantity }] }
    }
    case 'REMOVE':
      return { items: state.items.filter((i) => i.variantId !== action.variantId) }
    case 'SET_QUANTITY':
      if (action.quantity < 1) {
        return { items: state.items.filter((i) => i.variantId !== action.variantId) }
      }
      return {
        items: state.items.map((i) => (i.variantId === action.variantId ? { ...i, quantity: action.quantity } : i)),
      }
    case 'REPRICE':
      return {
        items: state.items.map((i) => {
          const price = action.prices.get(i.variantId)
          return price ? { ...i, ...price } : i
        }),
      }
    case 'CLEAR':
      return { items: [] }
    default:
      return state
  }
}

interface CartContextValue {
  items: CartItem[]
  totalItems: number
  subtotalNpr: number
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void
  removeItem: (variantId: number) => void
  setQuantity: (variantId: number, quantity: number) => void
  clear: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [] })

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) dispatch({ type: 'HYDRATE', items: JSON.parse(raw) })
    } catch {
      // ignore corrupted cart data
    }
  }, [])

  // A saved cart holds the prices from when each item was added; a discount
  // may have started or ended since. Refresh them so the cart and checkout
  // show what the backend will actually charge.
  useEffect(() => {
    api
      .listProducts()
      .then((products) => {
        const prices = new Map<number, { unitPriceNpr: number; listPriceNpr: number }>()
        for (const product of products) {
          for (const variant of product.variants) {
            const unit = currentPrice(variant)
            if (unit != null && variant.price_npr != null) {
              prices.set(variant.id, { unitPriceNpr: unit, listPriceNpr: variant.price_npr })
            }
          }
        }
        dispatch({ type: 'REPRICE', prices })
      })
      .catch(() => {
        // keep the saved prices; the backend still charges the correct amount
      })
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items))
    } catch {
      // ignore write failures (e.g. private browsing)
    }
  }, [state.items])

  const value = useMemo<CartContextValue>(
    () => ({
      items: state.items,
      totalItems: state.items.reduce((sum, i) => sum + i.quantity, 0),
      subtotalNpr: roundNpr(state.items.reduce((sum, i) => sum + i.unitPriceNpr * i.quantity, 0)),
      addItem: (item, quantity = 1) => dispatch({ type: 'ADD', item, quantity }),
      removeItem: (variantId) => dispatch({ type: 'REMOVE', variantId }),
      setQuantity: (variantId, quantity) => dispatch({ type: 'SET_QUANTITY', variantId, quantity }),
      clear: () => dispatch({ type: 'CLEAR' }),
    }),
    [state.items],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within a CartProvider')
  return ctx
}
