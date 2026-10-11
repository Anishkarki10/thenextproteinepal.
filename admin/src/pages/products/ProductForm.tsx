import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { api, imageUrl, type Product, type ProductVariant } from '../../lib/api'
import Layout from '../../components/Layout'

const emptyVariant: ProductVariant = {
  label: '',
  pack_size: '',
  price_npr: null,
  is_enquiry_only: false,
  stock_qty: 0,
  sort_order: 0,
}

// --- helpers to edit JSON-ish fields as plain text -------------------------

function linesToList(text: string): string[] {
  return text.split('\n').map((l) => l.trim()).filter(Boolean)
}
function listToLines(list?: string[] | null): string {
  return (list ?? []).join('\n')
}

function linesToLabelValue(text: string): { label: string; value: string }[] {
  return linesToList(text)
    .map((line) => {
      const [label, ...rest] = line.split(':')
      return { label: (label ?? '').trim(), value: rest.join(':').trim() }
    })
    .filter((row) => row.label)
}
function labelValueToLines(rows?: { label: string; value: string }[] | null): string {
  return (rows ?? []).map((r) => `${r.label}: ${r.value}`).join('\n')
}

function linesToIngredients(text: string): Record<string, string[]> {
  const result: Record<string, string[]> = {}
  for (const line of linesToList(text)) {
    const [group, ...rest] = line.split(':')
    if (!group) continue
    result[group.trim()] = rest.join(':').split(',').map((s) => s.trim()).filter(Boolean)
  }
  return result
}
function ingredientsToLines(ingredients?: Record<string, string[]> | null): string {
  return Object.entries(ingredients ?? {})
    .map(([group, items]) => `${group}: ${items.join(', ')}`)
    .join('\n')
}

function linesToFaqs(text: string): { q: string; a: string }[] {
  const blocks = text.split(/\n\s*\n/)
  const faqs: { q: string; a: string }[] = []
  for (const block of blocks) {
    const qMatch = block.match(/Q:\s*(.+)/i)
    const aMatch = block.match(/A:\s*(.+)/i)
    if (qMatch && aMatch) faqs.push({ q: qMatch[1].trim(), a: aMatch[1].trim() })
  }
  return faqs
}
function faqsToLines(faqs?: { q: string; a: string }[] | null): string {
  return (faqs ?? []).map((f) => `Q: ${f.q}\nA: ${f.a}`).join('\n\n')
}

export default function ProductForm() {
  const { id } = useParams<{ id: string }>()
  const isEdit = id !== undefined
  const navigate = useNavigate()
  const location = useLocation()
  const notice = (location.state as { notice?: string } | null)?.notice

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(isEdit)

  const [slug, setSlug] = useState('')
  const [name, setName] = useState('')
  const [sku, setSku] = useState('')
  const [category, setCategory] = useState('')
  const [shortDescription, setShortDescription] = useState('')
  const [description, setDescription] = useState('')
  const [isAvailable, setIsAvailable] = useState(true)
  const [variants, setVariants] = useState<ProductVariant[]>([{ ...emptyVariant }])

  const [ingredientsText, setIngredientsText] = useState('')
  const [nutritionText, setNutritionText] = useState('')
  const [allergenInfo, setAllergenInfo] = useState('')
  const [cookingInstructions, setCookingInstructions] = useState('')
  const [cookingStatsText, setCookingStatsText] = useState('')
  const [storageText, setStorageText] = useState('')
  const [servingIdeasText, setServingIdeasText] = useState('')
  const [faqsText, setFaqsText] = useState('')

  const [images, setImages] = useState<Product['images']>([])
  const [uploading, setUploading] = useState(false)
  // New products have no id yet, so photos picked before "Create Product" are
  // held here and uploaded right after the product is created.
  const [pendingImages, setPendingImages] = useState<{ file: File; preview: string }[]>([])

  const pendingImagesRef = useRef(pendingImages)
  pendingImagesRef.current = pendingImages
  useEffect(() => () => pendingImagesRef.current.forEach((p) => URL.revokeObjectURL(p.preview)), [])

  useEffect(() => {
    if (!isEdit) return
    api
      .getProduct(Number(id))
      .then((p) => {
        setSlug(p.slug)
        setName(p.name)
        setSku(p.sku)
        setCategory(p.category ?? '')
        setShortDescription(p.short_description ?? '')
        setDescription(p.description ?? '')
        setIsAvailable(p.is_available)
        setVariants(p.variants.length ? p.variants : [{ ...emptyVariant }])
        setIngredientsText(ingredientsToLines(p.ingredients))
        setNutritionText(labelValueToLines(p.nutrition_facts))
        setAllergenInfo(p.allergen_info ?? '')
        setCookingInstructions(p.cooking_instructions ?? '')
        setCookingStatsText(labelValueToLines(p.cooking_stats))
        setStorageText(listToLines(p.storage_info))
        setServingIdeasText((p.serving_ideas ?? []).join(', '))
        setFaqsText(faqsToLines(p.faqs))
        setImages(p.images)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [id, isEdit])

  const updateVariant = (index: number, patch: Partial<ProductVariant>) => {
    setVariants((vs) => vs.map((v, i) => (i === index ? { ...v, ...patch } : v)))
  }
  const addVariant = () => setVariants((vs) => [...vs, { ...emptyVariant, sort_order: vs.length }])
  const removeVariant = (index: number) => setVariants((vs) => vs.filter((_, i) => i !== index))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSaving(true)

    const payload: Partial<Product> = {
      slug,
      name,
      sku,
      category: category || undefined,
      short_description: shortDescription || undefined,
      description: description || undefined,
      is_available: isAvailable,
      variants: variants.filter((v) => v.label),
      ingredients: linesToIngredients(ingredientsText),
      nutrition_facts: linesToLabelValue(nutritionText),
      allergen_info: allergenInfo || undefined,
      cooking_instructions: cookingInstructions || undefined,
      cooking_stats: linesToLabelValue(cookingStatsText),
      storage_info: linesToList(storageText),
      serving_ideas: servingIdeasText.split(',').map((s) => s.trim()).filter(Boolean),
      faqs: linesToFaqs(faqsText),
    }

    try {
      if (isEdit) {
        await api.updateProduct(Number(id), payload)
        navigate('/products')
      } else {
        const created = await api.createProduct(payload)
        let failed = 0
        for (const { file } of pendingImages) {
          try {
            await api.uploadImage(created.id, file)
          } catch {
            failed++
          }
        }
        navigate(`/products/${created.id}/edit`, {
          state: failed
            ? { notice: `Product created, but ${failed} photo${failed > 1 ? 's' : ''} failed to upload. Please add ${failed > 1 ? 'them' : 'it'} again below.` }
            : { notice: 'Product created.' },
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const handleFiles = async (files: File[]) => {
    if (!files.length) return
    if (!isEdit) {
      setPendingImages((p) => [...p, ...files.map((file) => ({ file, preview: URL.createObjectURL(file) }))])
      return
    }
    setUploading(true)
    try {
      for (const file of files) {
        const image = await api.uploadImage(Number(id), file)
        setImages((imgs) => [...imgs, image])
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const removePendingImage = (index: number) => {
    setPendingImages((p) => {
      URL.revokeObjectURL(p[index].preview)
      return p.filter((_, i) => i !== index)
    })
  }

  const handleDeleteImage = async (imageId: number) => {
    if (!isEdit) return
    await api.deleteImage(Number(id), imageId)
    setImages((imgs) => imgs.filter((i) => i.id !== imageId))
  }

  if (loading) return <Layout><p className="font-body text-sm text-[#676A61]">Loading…</p></Layout>

  const inputClass =
    'w-full px-4 py-2.5 rounded-xl border border-[#E8DDCD] font-body text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#264F24]/20 focus:border-[#264F24]'
  const labelClass = 'block font-body text-sm font-semibold text-[#22231F] mb-1.5'

  return (
    <Layout>
      <h1 className="font-display font-black text-xl sm:text-2xl uppercase text-[#22231F] mb-6 break-words">
        {isEdit ? `Edit ${name || 'Product'}` : 'New Product'}
      </h1>

      {notice && (
        <p className="max-w-3xl mb-6 px-4 py-3 rounded-xl bg-[#264F24]/10 font-body text-sm text-[#264F24]">{notice}</p>
      )}

      <form onSubmit={handleSubmit} className="max-w-3xl space-y-6 sm:space-y-8">
        <div className="bg-white rounded-2xl border border-[#E8DDCD] p-4 sm:p-6 space-y-4">
          <h2 className="font-display font-black text-sm uppercase text-[#22231F]">Basics</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Name *</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} required />
            </div>
            <div>
              <label className={labelClass}>Slug *</label>
              <input value={slug} onChange={(e) => setSlug(e.target.value)} className={inputClass} required />
            </div>
            <div>
              <label className={labelClass}>SKU *</label>
              <input value={sku} onChange={(e) => setSku(e.target.value)} className={inputClass} required />
            </div>
            <div>
              <label className={labelClass}>Category</label>
              <input value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass} />
            </div>
          </div>
          <div>
            <label className={labelClass}>Short Description</label>
            <textarea value={shortDescription} onChange={(e) => setShortDescription(e.target.value)} rows={2} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Full Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className={inputClass} />
          </div>
          <label className="flex items-center gap-2 font-body text-sm text-[#22231F]">
            <input type="checkbox" checked={isAvailable} onChange={(e) => setIsAvailable(e.target.checked)} />
            Available for sale
          </label>
        </div>

        <div className="bg-white rounded-2xl border border-[#E8DDCD] p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display font-black text-sm uppercase text-[#22231F]">Variants / Pack Sizes</h2>
            <button type="button" onClick={addVariant} className="shrink-0 py-1 font-body text-sm font-semibold text-[#264F24] hover:underline">
              + Add Variant
            </button>
          </div>
          {variants.map((variant, i) => (
            <div
              key={i}
              className="grid grid-cols-2 gap-3 items-center p-3 rounded-xl border border-[#E8DDCD] md:p-0 md:border-0 md:grid-cols-[1fr_1fr_1fr_auto_1fr_auto]"
            >
              <input
                placeholder="Label (500 g)"
                value={variant.label}
                onChange={(e) => updateVariant(i, { label: e.target.value })}
                className={inputClass}
              />
              <input
                placeholder="pack_size (500g)"
                value={variant.pack_size}
                onChange={(e) => updateVariant(i, { pack_size: e.target.value })}
                className={inputClass}
              />
              <input
                type="number"
                placeholder="Price NPR"
                value={variant.price_npr ?? ''}
                onChange={(e) => updateVariant(i, { price_npr: e.target.value === '' ? null : Number(e.target.value) })}
                className={inputClass}
                disabled={variant.is_enquiry_only}
              />
              <label className="flex items-center gap-1.5 font-body text-xs text-[#676A61] whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={variant.is_enquiry_only}
                  onChange={(e) => updateVariant(i, { is_enquiry_only: e.target.checked, price_npr: e.target.checked ? null : variant.price_npr })}
                />
                Enquiry only
              </label>
              <input
                type="number"
                placeholder="Stock"
                value={variant.stock_qty}
                onChange={(e) => updateVariant(i, { stock_qty: Number(e.target.value) })}
                className={inputClass}
              />
              <button type="button" onClick={() => removeVariant(i)} className="justify-self-end py-2 font-body text-xs font-semibold text-[#8B4A2E]">
                Remove
              </button>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-[#E8DDCD] p-4 sm:p-6 space-y-4">
          <div>
            <h2 className="font-display font-black text-sm uppercase text-[#22231F]">Photos</h2>
            {!isEdit && (
              <p className="mt-1 font-body text-xs text-[#676A61]">Photos are uploaded when you click "Create Product".</p>
            )}
          </div>
          <div className="flex flex-wrap gap-3">
            {images.map((img) => (
              <div key={img.id} className="relative w-24 h-24 rounded-xl overflow-hidden border border-[#E8DDCD]">
                <img src={imageUrl(img.url)} alt={img.alt_text ?? ''} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => handleDeleteImage(img.id)}
                  aria-label="Delete photo"
                  className="absolute top-1 right-1 w-7 h-7 rounded-full bg-black/60 text-white text-sm flex items-center justify-center"
                >
                  ×
                </button>
              </div>
            ))}
            {pendingImages.map((p, i) => (
              <div key={p.preview} className="relative w-24 h-24 rounded-xl overflow-hidden border border-[#E8DDCD]">
                <img src={p.preview} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removePendingImage(i)}
                  aria-label="Remove photo"
                  className="absolute top-1 right-1 w-7 h-7 rounded-full bg-black/60 text-white text-sm flex items-center justify-center"
                >
                  ×
                </button>
              </div>
            ))}
            <label
              className={`w-24 h-24 rounded-xl border-2 border-dashed border-[#E8DDCD] flex flex-col items-center justify-center gap-1 font-body text-xs font-semibold text-[#264F24] cursor-pointer hover:border-[#264F24] transition-colors ${
                uploading ? 'opacity-50 pointer-events-none' : ''
              }`}
            >
              <span className="text-2xl leading-none">+</span>
              {uploading ? 'Uploading…' : 'Add photo'}
              <input
                type="file"
                accept="image/*"
                multiple
                disabled={uploading}
                onChange={(e) => {
                  handleFiles(Array.from(e.target.files ?? []))
                  e.target.value = ''
                }}
                className="sr-only"
              />
            </label>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#E8DDCD] p-4 sm:p-6 space-y-4">
          <h2 className="font-display font-black text-sm uppercase text-[#22231F]">Details (optional)</h2>
          <p className="font-body text-xs text-[#676A61]">
            These fields use simple plain-text formats described by each label's placeholder.
          </p>
          <div>
            <label className={labelClass}>Ingredients (one group per line: "Group: item1, item2")</label>
            <textarea value={ingredientsText} onChange={(e) => setIngredientsText(e.target.value)} rows={3} className={inputClass} placeholder={'Main Protein: Vital wheat gluten, Soybeans\nFlavour: Black pepper, Cumin'} />
          </div>
          <div>
            <label className={labelClass}>Nutrition Facts (one per line: "Label: Value")</label>
            <textarea value={nutritionText} onChange={(e) => setNutritionText(e.target.value)} rows={4} className={inputClass} placeholder={'Protein: 21.37g\nTotal Fat: 0.52g'} />
          </div>
          <div>
            <label className={labelClass}>Allergen Info</label>
            <input value={allergenInfo} onChange={(e) => setAllergenInfo(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Cooking Instructions</label>
            <textarea value={cookingInstructions} onChange={(e) => setCookingInstructions(e.target.value)} rows={2} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Cooking Stats (one per line: "Label: Value")</label>
            <textarea value={cookingStatsText} onChange={(e) => setCookingStatsText(e.target.value)} rows={2} className={inputClass} placeholder={'Cook temp: 170-190C\nPrep time: 5-10 min'} />
          </div>
          <div>
            <label className={labelClass}>Storage Info (one item per line)</label>
            <textarea value={storageText} onChange={(e) => setStorageText(e.target.value)} rows={3} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Serving Ideas (comma-separated)</label>
            <input value={servingIdeasText} onChange={(e) => setServingIdeasText(e.target.value)} className={inputClass} placeholder="Momo, Chow Mein, Curry" />
          </div>
          <div>
            <label className={labelClass}>FAQs (blocks separated by a blank line: "Q: ...", "A: ...")</label>
            <textarea value={faqsText} onChange={(e) => setFaqsText(e.target.value)} rows={4} className={inputClass} placeholder={'Q: Is it vegan?\nA: Yes.'} />
          </div>
        </div>

        {error && <p className="font-body text-sm text-[#8B4A2E]">{error}</p>}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto px-6 py-3 rounded-full bg-[#264F24] text-[#F5EDE1] font-body font-bold text-sm hover:bg-[#173A22] transition-colors disabled:opacity-50"
          >
            {saving ? (pendingImages.length && !isEdit ? 'Creating & uploading photos…' : 'Saving…') : isEdit ? 'Save Changes' : 'Create Product'}
          </button>
        </div>
      </form>
    </Layout>
  )
}
