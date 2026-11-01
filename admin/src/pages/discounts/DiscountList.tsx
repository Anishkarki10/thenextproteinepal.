import { useEffect, useState, type FormEvent } from 'react'
import { api, type Discount, type DiscountPayload, type Product } from '../../lib/api'
import { formatNepaliDateTime } from '../../lib/datetime'
import { discountedPrice, isoToNptInput, nptInputToIso } from '../../lib/nptInput'
import Layout from '../../components/Layout'

const STATUS_STYLES: Record<Discount['status'], string> = {
  active: 'bg-[#A8C879]/30 text-[#264F24]',
  scheduled: 'bg-[#F5EDE1] text-[#22231F]',
  expired: 'bg-[#E8DDCD] text-[#676A61]',
}

interface FormState {
  productId: string
  percent: string
  label: string
  startsAt: string
  endsAt: string
}

const emptyForm = (): FormState => ({
  productId: '',
  percent: '',
  label: '',
  startsAt: isoToNptInput(new Date().toISOString()),
  endsAt: '',
})

export default function DiscountList() {
  const [discounts, setDiscounts] = useState<Discount[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)

  const load = () => {
    setLoading(true)
    Promise.all([api.listDiscounts(), api.listProducts()])
      .then(([d, p]) => {
        setDiscounts(d)
        setProducts(p)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const set = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))

  const resetForm = () => {
    setEditingId(null)
    setForm(emptyForm())
    setFormError(null)
  }

  const startEdit = (discount: Discount) => {
    setEditingId(discount.id)
    setForm({
      productId: String(discount.product_id),
      percent: String(discount.percent),
      label: discount.label ?? '',
      startsAt: isoToNptInput(discount.starts_at),
      endsAt: discount.ends_at ? isoToNptInput(discount.ends_at) : '',
    })
    setFormError(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const percent = Number(form.percent)
    if (!form.productId) return setFormError('Choose a product')
    if (!form.percent || !(percent > 0 && percent < 100)) return setFormError('Percent must be between 0 and 100')
    if (!form.startsAt) return setFormError('Start time is required')
    if (form.endsAt && form.endsAt <= form.startsAt) return setFormError('End time must be after the start time')

    const payload: DiscountPayload = {
      product_id: Number(form.productId),
      percent,
      label: form.label.trim() || null,
      starts_at: nptInputToIso(form.startsAt),
      ends_at: form.endsAt ? nptInputToIso(form.endsAt) : null,
    }
    setSaving(true)
    setFormError(null)
    try {
      if (editingId) await api.updateDiscount(editingId, payload)
      else await api.createDiscount(payload)
      resetForm()
      load()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const handleEndNow = async (discount: Discount) => {
    if (!confirm(`End the ${discount.percent}% discount on "${discount.product_name}" now?`)) return
    try {
      await api.updateDiscount(discount.id, {
        product_id: discount.product_id,
        percent: discount.percent,
        label: discount.label,
        starts_at: discount.starts_at,
        ends_at: new Date().toISOString(),
      })
      load()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Update failed')
    }
  }

  const handleDelete = async (discount: Discount) => {
    if (!confirm(`Delete the ${discount.percent}% discount on "${discount.product_name}"? This cannot be undone.`)) return
    try {
      await api.deleteDiscount(discount.id)
      if (editingId === discount.id) resetForm()
      load()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Delete failed')
    }
  }

  const selectedProduct = products.find((p) => String(p.id) === form.productId)
  const percent = Number(form.percent)
  const pricedVariants = selectedProduct?.variants.filter((v) => v.price_npr != null && !v.is_enquiry_only) ?? []

  const inputClass =
    'w-full px-4 py-2.5 rounded-xl border border-[#E8DDCD] font-body text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#264F24]/20 focus:border-[#264F24]'
  const labelClass = 'block font-body text-sm font-semibold text-[#22231F] mb-1.5'

  return (
    <Layout>
      <h1 className="font-display font-black text-xl sm:text-2xl uppercase text-[#22231F] mb-6">Discounts</h1>

      <form onSubmit={handleSubmit} noValidate className="bg-white rounded-2xl border border-[#E8DDCD] p-4 sm:p-6 mb-8">
        <h2 className="font-display font-black text-sm uppercase text-[#22231F] mb-4">
          {editingId ? 'Edit Discount' : 'New Discount'}
        </h2>
        <fieldset disabled={saving} className="grid grid-cols-1 sm:grid-cols-2 gap-4 disabled:opacity-60">
          <div>
            <label htmlFor="productId" className={labelClass}>Product *</label>
            <select id="productId" value={form.productId} onChange={set('productId')} className={inputClass}>
              <option value="">Choose a product…</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="percent" className={labelClass}>Discount % *</label>
            <input
              id="percent"
              type="number"
              min="0.01"
              max="99.99"
              step="0.01"
              inputMode="decimal"
              value={form.percent}
              onChange={set('percent')}
              className={inputClass}
              placeholder="e.g. 15"
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="label" className={labelClass}>Label (shown to customers)</label>
            <input
              id="label"
              maxLength={80}
              value={form.label}
              onChange={set('label')}
              className={inputClass}
              placeholder="e.g. Dashain Offer"
            />
          </div>
          <div>
            <label htmlFor="startsAt" className={labelClass}>Starts (Nepal time) *</label>
            <input id="startsAt" type="datetime-local" value={form.startsAt} onChange={set('startsAt')} className={inputClass} />
          </div>
          <div>
            <label htmlFor="endsAt" className={labelClass}>Ends (Nepal time)</label>
            <input id="endsAt" type="datetime-local" value={form.endsAt} onChange={set('endsAt')} className={inputClass} />
            <p className="mt-1 font-body text-xs text-[#676A61]">Leave empty to keep it running until you end it.</p>
          </div>
        </fieldset>

        {pricedVariants.length > 0 && percent > 0 && percent < 100 && (
          <div className="mt-4 font-body text-sm text-[#676A61] space-y-0.5">
            {pricedVariants.map((v) => (
              <div key={v.id}>
                {v.label}: <span className="line-through">NPR {v.price_npr}</span>{' '}
                <span className="font-semibold text-[#264F24]">
                  → NPR {discountedPrice(v.price_npr as number, percent)}
                </span>
              </div>
            ))}
          </div>
        )}

        {formError && <p className="mt-4 font-body text-sm text-[#8B4A2E]">{formError}</p>}

        <div className="flex flex-wrap gap-3 mt-5">
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 rounded-full bg-[#264F24] text-[#F5EDE1] font-body font-bold text-sm hover:bg-[#173A22] transition-colors disabled:opacity-60"
          >
            {saving ? 'Saving…' : editingId ? 'Save Changes' : 'Add Discount'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="px-5 py-2.5 rounded-full border border-[#E8DDCD] font-body font-semibold text-sm text-[#22231F]"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {error && <p className="font-body text-sm text-[#8B4A2E] mb-4">{error}</p>}
      {loading && <p className="font-body text-sm text-[#676A61]">Loading…</p>}

      <div className="space-y-3">
        {discounts.map((d) => (
          <div
            key={d.id}
            className={`bg-white rounded-2xl border p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3 ${
              editingId === d.id ? 'border-[#264F24]' : 'border-[#E8DDCD]'
            }`}
          >
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-display font-black text-lg text-[#264F24]">{d.percent}% off</span>
                <span className="font-body text-sm font-semibold text-[#22231F] break-words">{d.product_name}</span>
                <span className={`px-2 py-0.5 rounded-full font-body text-xs font-semibold capitalize ${STATUS_STYLES[d.status]}`}>
                  {d.status}
                </span>
              </div>
              {d.label && <div className="font-body text-xs text-[#8B4A2E] font-semibold mt-1">{d.label}</div>}
              <div className="font-body text-xs text-[#676A61] mt-1">
                {formatNepaliDateTime(d.starts_at)} → {d.ends_at ? formatNepaliDateTime(d.ends_at) : 'no end date'}
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              {d.status === 'active' && (
                <button
                  onClick={() => handleEndNow(d)}
                  className="px-4 py-2 rounded-full border border-[#E8DDCD] font-body text-sm font-semibold text-[#22231F]"
                >
                  End Now
                </button>
              )}
              <button
                onClick={() => startEdit(d)}
                className="px-4 py-2 rounded-full bg-[#264F24] text-[#F5EDE1] font-body text-sm font-semibold"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(d)}
                className="px-4 py-2 rounded-full border border-[#E8DDCD] font-body text-sm font-semibold text-[#8B4A2E]"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
        {!loading && discounts.length === 0 && (
          <p className="py-8 text-center font-body text-sm text-[#676A61]">No discounts yet.</p>
        )}
      </div>
    </Layout>
  )
}
