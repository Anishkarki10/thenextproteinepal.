import type { ProductDiscount, ProductVariant } from '../lib/api'
import { formatNepaliDate } from '../lib/datetime'

/** "NPR 298  ~~NPR 350~~  -15%" while a discount is active, else just "NPR 350". */
export default function PriceTag({
  variant,
  discount,
  className = 'font-display font-black text-2xl text-[#264F24]',
  showEnds = false,
  align = 'left',
}: {
  variant: ProductVariant
  discount: ProductDiscount | null
  className?: string
  showEnds?: boolean
  align?: 'left' | 'right'
}) {
  if (variant.price_npr == null) return null
  const onSale = variant.discounted_price_npr != null && discount != null

  return (
    <div className={align === 'right' ? 'text-right' : undefined}>
      <div className={`flex flex-wrap items-baseline gap-x-2 gap-y-1 ${align === 'right' ? 'justify-end' : ''}`}>
        <span className={className}>NPR {onSale ? variant.discounted_price_npr : variant.price_npr}</span>
        {onSale && (
          <>
            <span className="font-body text-sm text-[#676A61] line-through">NPR {variant.price_npr}</span>
            <span className="px-2 py-0.5 rounded-full bg-[#8B4A2E] text-white font-body text-xs font-bold">
              -{discount.percent}%
            </span>
          </>
        )}
      </div>
      {onSale && (discount.label || (showEnds && discount.ends_at)) && (
        <p className="font-body text-xs font-semibold text-[#8B4A2E] mt-1">
          {discount.label}
          {discount.label && showEnds && discount.ends_at && ' · '}
          {showEnds && discount.ends_at && `Ends ${formatNepaliDate(discount.ends_at)}`}
        </p>
      )}
    </div>
  )
}
