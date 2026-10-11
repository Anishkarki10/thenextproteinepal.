import { useEffect, useState, type ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'

const navLinks = [
  { label: 'Dashboard', to: '/' },
  { label: 'Products', to: '/products' },
  { label: 'Orders', to: '/orders' },
  { label: 'Enquiries', to: '/enquiries' },
  { label: 'Audit Log', to: '/audit-log' },
]

function Brand() {
  return (
    <div>
      <div className="font-display font-black text-sm text-[#F5EDE1] uppercase tracking-wider">The Next Protein</div>
      <div className="font-display font-bold text-xs text-[#A8C879] uppercase tracking-[0.2em]">Admin</div>
    </div>
  )
}

export default function Layout({ children }: { children: ReactNode }) {
  const location = useLocation()
  const { user, logout } = useAuth()
  const [unreadEnquiries, setUnreadEnquiries] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    api.listEnquiries({ status: 'new' }).then((res) => setUnreadEnquiries(res.total_enquiries)).catch(() => {})
    setMenuOpen(false)
  }, [location.pathname])

  // Stop the page behind the mobile drawer from scrolling while it's open.
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [menuOpen])

  return (
    <div className="min-h-screen md:flex bg-[#F5EDE1]">
      {/* Mobile top bar */}
      <header className="md:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-[#264F24]">
        <Brand />
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          aria-label="Open menu"
          className="relative w-10 h-10 -mr-2 flex items-center justify-center rounded-xl text-[#F5EDE1] hover:bg-[#173A22]"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          {unreadEnquiries > 0 && <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-[#25D366]" />}
        </button>
      </header>

      {/* Backdrop for the mobile drawer */}
      {menuOpen && <div className="md:hidden fixed inset-0 z-40 bg-black/40" onClick={() => setMenuOpen(false)} />}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#264F24] flex flex-col transition-transform duration-200 md:sticky md:top-0 md:h-screen md:w-60 md:shrink-0 md:translate-x-0 ${
          menuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6 flex items-start justify-between">
          <Brand />
          <button
            type="button"
            onClick={() => setMenuOpen(false)}
            aria-label="Close menu"
            className="md:hidden w-10 h-10 -mr-2 -mt-2 flex items-center justify-center rounded-xl text-[#F5EDE1] hover:bg-[#173A22]"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          {navLinks.map((link) => {
            const active = location.pathname === link.to || (link.to !== '/' && location.pathname.startsWith(link.to))
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center justify-between px-4 py-3 md:py-2.5 rounded-xl font-body text-sm font-semibold transition-colors ${
                  active ? 'bg-[#A8C879] text-[#173A22]' : 'text-[#F5EDE1]/80 hover:bg-[#173A22]'
                }`}
              >
                {link.label}
                {link.to === '/enquiries' && unreadEnquiries > 0 && (
                  <span className="min-w-5 h-5 px-1 rounded-full bg-[#25D366] text-white text-xs font-bold flex items-center justify-center">
                    {unreadEnquiries}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>
        <div className="p-4 border-t border-[#F5EDE1]/10">
          <div className="font-body text-xs text-[#F5EDE1]/60 mb-2 truncate">{user?.email}</div>
          <button
            onClick={logout}
            className="w-full px-4 py-2.5 md:py-2 rounded-xl bg-[#173A22] text-[#F5EDE1] font-body text-sm font-semibold hover:bg-[#0f2818] transition-colors"
          >
            Log Out
          </button>
        </div>
      </aside>
      <main className="flex-1 min-w-0 p-4 sm:p-6 md:p-8">{children}</main>
    </div>
  )
}
