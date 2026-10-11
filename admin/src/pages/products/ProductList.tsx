import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, type Product } from '../../lib/api'
import Layout from '../../components/Layout'

export default function ProductList() {
  const [products, setProducts] = useState<Product[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    api
      .listProducts()
      .then(setProducts)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const handleDelete = async (product: Product) => {
    if (!confirm(`Delete "${product.name}"? This cannot be undone.`)) return
    try {
      await api.deleteProduct(product.id)
      load()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Delete failed')
    }
  }

  return (
    <Layout>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="font-display font-black text-xl sm:text-2xl uppercase text-[#22231F]">Products</h1>
        <Link
          to="/products/new"
          className="px-5 py-2.5 rounded-full bg-[#264F24] text-[#F5EDE1] font-body font-bold text-sm hover:bg-[#173A22] transition-colors"
        >
          + New Product
        </Link>
      </div>

      {error && <p className="font-body text-sm text-[#8B4A2E] mb-4">{error}</p>}
      {loading && <p className="font-body text-sm text-[#676A61]">Loading…</p>}

      <div className="md:hidden space-y-3">
        {products.map((product) => (
          <div key={product.id} className="bg-white rounded-2xl border border-[#E8DDCD] p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-body text-sm font-semibold text-[#22231F] break-words">{product.name}</div>
                <div className="font-body text-xs text-[#676A61] mt-0.5 break-all">
                  {product.sku} · {product.variants.length} variant{product.variants.length === 1 ? '' : 's'}
                </div>
              </div>
              <span className={`shrink-0 font-body text-xs font-semibold ${product.is_available ? 'text-[#264F24]' : 'text-[#676A61]'}`}>
                {product.is_available ? '● Available' : 'Unavailable'}
              </span>
            </div>
            <div className="flex gap-2 mt-3">
              <Link
                to={`/products/${product.id}/edit`}
                className="flex-1 text-center py-2 rounded-full bg-[#264F24] text-[#F5EDE1] font-body text-sm font-semibold"
              >
                Edit
              </Link>
              <button
                onClick={() => handleDelete(product)}
                className="flex-1 py-2 rounded-full border border-[#E8DDCD] font-body text-sm font-semibold text-[#8B4A2E]"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
        {!loading && products.length === 0 && (
          <p className="py-8 text-center font-body text-sm text-[#676A61]">No products yet.</p>
        )}
      </div>

      <div className="hidden md:block bg-white rounded-2xl border border-[#E8DDCD] overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-[#F5EDE1]">
            <tr>
              <th className="px-5 py-3 font-body text-xs font-bold text-[#676A61] uppercase">Name</th>
              <th className="px-5 py-3 font-body text-xs font-bold text-[#676A61] uppercase">SKU</th>
              <th className="px-5 py-3 font-body text-xs font-bold text-[#676A61] uppercase">Slug</th>
              <th className="px-5 py-3 font-body text-xs font-bold text-[#676A61] uppercase">Available</th>
              <th className="px-5 py-3 font-body text-xs font-bold text-[#676A61] uppercase">Variants</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E8DDCD]">
            {products.map((product) => (
              <tr key={product.id}>
                <td className="px-5 py-3 font-body text-sm text-[#22231F] font-semibold">{product.name}</td>
                <td className="px-5 py-3 font-body text-sm text-[#676A61]">{product.sku}</td>
                <td className="px-5 py-3 font-body text-sm text-[#676A61]">{product.slug}</td>
                <td className="px-5 py-3 font-body text-sm">{product.is_available ? '● Available' : 'Unavailable'}</td>
                <td className="px-5 py-3 font-body text-sm text-[#676A61]">{product.variants.length}</td>
                <td className="px-5 py-3 text-right space-x-3">
                  <Link to={`/products/${product.id}/edit`} className="font-body text-sm font-semibold text-[#264F24] hover:underline">
                    Edit
                  </Link>
                  <button onClick={() => handleDelete(product)} className="font-body text-sm font-semibold text-[#8B4A2E] hover:underline">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {!loading && products.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center font-body text-sm text-[#676A61]">
                  No products yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Layout>
  )
}
