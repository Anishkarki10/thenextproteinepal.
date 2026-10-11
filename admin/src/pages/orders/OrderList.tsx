import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, type Order } from '../../lib/api'
import { formatNepaliDate } from '../../lib/datetime'
import Layout from '../../components/Layout'

const STATUSES = ['', 'pending_payment', 'paid', 'processing', 'shipped', 'delivered', 'cancelled']

export default function OrderList() {
  const [orders, setOrders] = useState<Order[]>([])
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    api
      .listOrders({ status: status || undefined, page })
      .then((res) => {
        setOrders(res.orders)
        setTotalPages(res.total_pages)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [status, page])

  return (
    <Layout>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="font-display font-black text-xl sm:text-2xl uppercase text-[#22231F]">Orders</h1>
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value)
            setPage(1)
          }}
          className="px-4 py-2.5 md:py-2 rounded-xl border border-[#E8DDCD] bg-white font-body text-base sm:text-sm capitalize"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s ? s.replace('_', ' ') : 'All statuses'}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="font-body text-sm text-[#8B4A2E] mb-4">{error}</p>}
      {loading && <p className="font-body text-sm text-[#676A61]">Loading…</p>}

      <div className="md:hidden space-y-3">
        {orders.map((order) => (
          <Link
            key={order.id}
            to={`/orders/${order.id}`}
            className="block bg-white rounded-2xl border border-[#E8DDCD] p-4 active:border-[#264F24]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-body text-sm font-semibold text-[#264F24] break-all">{order.order_number}</div>
                <div className="font-body text-sm text-[#22231F] truncate">{order.customer_name}</div>
              </div>
              <div className="shrink-0 font-body text-sm font-semibold text-[#264F24]">NPR {order.total_npr}</div>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-3 font-body text-xs">
              <span className="px-2 py-0.5 rounded-full bg-[#F5EDE1] text-[#22231F] capitalize">{order.status.replace('_', ' ')}</span>
              <span className="px-2 py-0.5 rounded-full bg-[#F5EDE1] text-[#22231F] capitalize">{order.payment_status}</span>
              <span className="ml-auto text-[#676A61]">{formatNepaliDate(order.created_at)}</span>
            </div>
          </Link>
        ))}
        {!loading && orders.length === 0 && (
          <p className="py-8 text-center font-body text-sm text-[#676A61]">No orders found.</p>
        )}
      </div>

      <div className="hidden md:block bg-white rounded-2xl border border-[#E8DDCD] overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-[#F5EDE1]">
            <tr>
              <th className="px-5 py-3 font-body text-xs font-bold text-[#676A61] uppercase">Order #</th>
              <th className="px-5 py-3 font-body text-xs font-bold text-[#676A61] uppercase">Customer</th>
              <th className="px-5 py-3 font-body text-xs font-bold text-[#676A61] uppercase">Status</th>
              <th className="px-5 py-3 font-body text-xs font-bold text-[#676A61] uppercase">Payment</th>
              <th className="px-5 py-3 font-body text-xs font-bold text-[#676A61] uppercase">Total</th>
              <th className="px-5 py-3 font-body text-xs font-bold text-[#676A61] uppercase">Placed</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E8DDCD]">
            {orders.map((order) => (
              <tr key={order.id}>
                <td className="px-5 py-3 font-body text-sm">
                  <Link to={`/orders/${order.id}`} className="font-semibold text-[#264F24] hover:underline">
                    {order.order_number}
                  </Link>
                </td>
                <td className="px-5 py-3 font-body text-sm text-[#22231F]">{order.customer_name}</td>
                <td className="px-5 py-3 font-body text-sm capitalize">{order.status.replace('_', ' ')}</td>
                <td className="px-5 py-3 font-body text-sm capitalize">{order.payment_status}</td>
                <td className="px-5 py-3 font-body text-sm font-semibold text-[#264F24]">NPR {order.total_npr}</td>
                <td className="px-5 py-3 font-body text-sm text-[#676A61]">{formatNepaliDate(order.created_at)}</td>
              </tr>
            ))}
            {!loading && orders.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center font-body text-sm text-[#676A61]">
                  No orders found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex flex-wrap gap-2 mt-4">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-10 h-10 md:w-8 md:h-8 rounded-full font-body text-sm ${p === page ? 'bg-[#264F24] text-white' : 'bg-white border border-[#E8DDCD]'}`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </Layout>
  )
}
