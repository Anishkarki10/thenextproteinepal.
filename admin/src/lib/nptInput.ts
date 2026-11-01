// <input type="datetime-local"> has no timezone; these treat its value as
// Nepal time (UTC+5:45) regardless of the admin's browser timezone.
const NPT_OFFSET_MS = (5 * 60 + 45) * 60 * 1000

/** '2026-12-04T18:15:00Z' -> '2026-12-05T00:00' (Nepal wall-clock time) */
export function isoToNptInput(iso: string): string {
  return new Date(new Date(iso).getTime() + NPT_OFFSET_MS).toISOString().slice(0, 16)
}

/** '2026-12-05T00:00' (Nepal wall-clock time) -> '2026-12-05T00:00:00+05:45' */
export function nptInputToIso(value: string): string {
  return `${value}:00+05:45`
}

/** Whole-rupee discounted price, rounded half up - same rule the backend charges. */
export function discountedPrice(priceNpr: number, percent: number): number {
  return Math.round((priceNpr * (100 - percent)) / 100)
}
