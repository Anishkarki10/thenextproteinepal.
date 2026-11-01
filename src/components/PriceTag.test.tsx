import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { ProductVariant } from '../lib/api'
import PriceTag from './PriceTag'

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
const text = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()

describe('PriceTag', () => {
  it('shows only the list price without a discount', () => {
    const html = renderToStaticMarkup(<PriceTag variant={variant()} discount={null} />)
    expect(text(html)).toBe('NPR 350')
    expect(html).not.toContain('line-through')
  })

  it('shows sale price, struck-through list price, badge and label', () => {
    const html = renderToStaticMarkup(
      <PriceTag
        variant={variant({ discounted_price_npr: 298 })}
        discount={{ percent: 15, label: 'Dashain Offer', ends_at: '2026-11-30T18:14:00Z' }}
        showEnds
      />,
    )
    expect(text(html)).toBe('NPR 298 NPR 350 -15% Dashain Offer · Ends Nov 30, 2026')
    expect(html).toContain('line-through')
  })

  it('hides the end date unless asked', () => {
    const html = renderToStaticMarkup(
      <PriceTag variant={variant({ discounted_price_npr: 298 })} discount={{ percent: 15, label: null, ends_at: '2026-11-30T18:14:00Z' }} />,
    )
    expect(text(html)).toBe('NPR 298 NPR 350 -15%')
  })

  it('renders nothing for an enquiry-only variant', () => {
    expect(renderToStaticMarkup(<PriceTag variant={variant({ price_npr: null })} discount={null} />)).toBe('')
  })

  it('right-aligns when asked', () => {
    expect(renderToStaticMarkup(<PriceTag variant={variant()} discount={null} align="right" />)).toContain('justify-end')
  })
})
