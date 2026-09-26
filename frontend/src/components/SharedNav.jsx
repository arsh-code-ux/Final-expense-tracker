import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function SharedNav() {
  const { isAuthenticated, user, logout } = useAuth()
  const [scrollY, setScrollY] = useState(0)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const isLandingPage = location.pathname === '/'
  const isDashboard = location.pathname === '/dashboard'

  return (
    <nav
      className={`fixed z-50 w-full border-b border-[#e1d7c7] bg-[#f7f2ea]/90 backdrop-blur-xl transition-all duration-300 ${
        scrollY > 20 || !isLandingPage ? 'shadow-[0_12px_28px_rgba(75,80,68,0.08)]' : 'shadow-none'
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-24 items-center justify-between">
          <Link to={isAuthenticated ? '/dashboard' : '/'} className="flex items-center gap-3 group">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#9cae85] via-[#d7c3a0] to-[#f1e9dc] shadow-[0_10px_24px_rgba(112,126,96,0.25)] transition-transform duration-200 group-hover:scale-105">
            </div>
            <span className="text-2xl font-black tracking-tight text-[#273126] sm:text-3xl">TrackExpense</span>
          </Link>

          <div className="hidden items-center gap-7 md:flex">
            {!isAuthenticated ? (
              <>
                <a href="/#features" className="text-base font-semibold text-[#324235] transition-colors hover:text-[#5f6d51]">Features</a>
                <a href="/#pricing" className="text-base font-semibold text-[#324235] transition-colors hover:text-[#5f6d51]">Pricing</a>
                <a href="/#how-it-works" className="text-base font-semibold text-[#324235] transition-colors hover:text-[#5f6d51]">How it works</a>
                <a href="/#faq" className="text-base font-semibold text-[#324235] transition-colors hover:text-[#5f6d51]">FAQ</a>
                <Link
                  to="/login"
                  className="rounded-2xl bg-[#6f7e5f] px-6 py-3 text-base font-bold text-white shadow-[0_12px_25px_rgba(111,126,95,0.22)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#596a4b]"
                >
                  Get started
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/dashboard"
                  className={`text-base font-bold transition-colors ${
                    isDashboard ? 'text-[#53644d]' : 'text-[#2f342d] hover:text-[#53644d]'
                  }`}
                >
                  Dashboard
                </Link>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-sm font-bold text-[#2f342d]">{user?.name || 'User'}</div>
                    <div className="text-xs text-[#68736a]">{user?.email}</div>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-[#9cae85] via-[#d7c3a0] to-[#f1e9dc] text-sm font-black text-[#273126]">
                    {user?.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <button
                    onClick={handleLogout}
                    className="rounded-2xl bg-[#c26464] px-5 py-3 text-sm font-bold text-white transition-all duration-200 hover:bg-[#ad5353]"
                  >
                    Logout
                  </button>
                </div>
              </>
            )}
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-xl p-2 text-[#2f342d] transition-colors hover:bg-[#efe6db] md:hidden"
            aria-label="Toggle menu"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="border-t border-[#e8dfd4] bg-[#f9f4ee] py-4 md:hidden">
            {!isAuthenticated ? (
              <div className="flex flex-col gap-2">
                <a href="/#features" className="rounded-xl px-3 py-2 text-base font-semibold text-[#324235] hover:bg-[#f0e7dc]">Features</a>
                <a href="/#pricing" className="rounded-xl px-3 py-2 text-base font-semibold text-[#324235] hover:bg-[#f0e7dc]">Pricing</a>
                <a href="/#how-it-works" className="rounded-xl px-3 py-2 text-base font-semibold text-[#324235] hover:bg-[#f0e7dc]">How it works</a>
                <a href="/#faq" className="rounded-xl px-3 py-2 text-base font-semibold text-[#324235] hover:bg-[#f0e7dc]">FAQ</a>
                <Link to="/login" className="mt-2 rounded-2xl bg-[#6f7e5f] px-4 py-3 text-center text-base font-bold text-white">Get started</Link>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <Link to="/dashboard" className="rounded-xl px-3 py-2 text-base font-semibold text-[#324235] hover:bg-[#f0e7dc]">Dashboard</Link>
                <div className="rounded-2xl bg-[#edf2e7] px-3 py-3">
                  <div className="text-sm font-bold text-[#2f342d]">{user?.name || 'User'}</div>
                  <div className="text-xs text-[#68736a]">{user?.email}</div>
                </div>
                <button onClick={handleLogout} className="rounded-2xl bg-[#c26464] px-4 py-3 text-base font-bold text-white">Logout</button>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}
