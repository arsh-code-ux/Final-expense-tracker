import React from 'react'

export default function SharedFooter() {
  const currentYear = new Date().getFullYear()

  const footerColumns = [
    {
      title: 'Product',
      items: [
        { label: 'Features', href: '/#features' },
        { label: 'Budget tools', href: '/#features' },
        { label: 'Smart insights', href: '/#features' },
        { label: 'Goal tracking', href: '/#features' }
      ]
    },
    {
      title: 'Company',
      items: [
        { label: 'About us', href: '#' },
        { label: 'Our mission', href: '#' },
        { label: 'Careers', href: '#' },
        { label: 'Contact', href: '#' }
      ]
    },
    {
      title: 'Resources',
      items: [
        { label: 'How it works', href: '/#how-it-works' },
        { label: 'FAQ', href: '/#faq' },
        { label: 'Help center', href: '#' },
        { label: 'Blog', href: '#' }
      ]
    },
    {
      title: 'Security',
      items: [
        { label: 'Privacy', href: '#' },
        { label: 'Terms', href: '#' },
        { label: 'Cookies', href: '#' },
        { label: 'Trust center', href: '#' }
      ]
    }
  ]

  return (
    <footer className="border-t border-[#d7cabd] bg-[#e9e1d4] text-[#2d352d]">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.5fr_0.9fr_0.9fr_0.9fr_0.9fr]">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#8ca07b] to-[#5f6d51] text-2xl shadow-[0_10px_20px_rgba(95,109,81,0.25)]">
              </div>
              <div>
                <div className="text-3xl font-black tracking-tight text-[#1f2a20]">TrackExpense</div>
              </div>
            </div>

            <p className="mt-6 max-w-md text-base leading-7 text-[#4f5b4d]">
              A calm, practical way to manage spending, plan budgets, and build stronger financial habits without stress.
            </p>

            <div className="mt-7 flex items-center gap-3">
              <a href="/login" className="inline-flex items-center justify-center rounded-xl bg-[#56674a] px-5 py-3 text-sm font-bold text-white shadow-[0_10px_22px_rgba(86,103,74,0.25)] transition hover:-translate-y-0.5 hover:bg-[#47593d]">
                Start free
              </a>
              <a href="/#features" className="inline-flex items-center justify-center rounded-xl border border-[#c9bdae] bg-white/60 px-5 py-3 text-sm font-bold text-[#2d352d] transition hover:border-[#aebca6] hover:bg-white">
                Explore features
              </a>
            </div>

            <div className="mt-7 flex items-center gap-3 text-[#4f5b4d]">
              {[
                '𝕏',
                'f',
                'in'
              ].map((icon, index) => (
                <a
                  key={icon}
                  href="#"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-[#cdbfae] bg-white/60 text-sm font-black transition hover:-translate-y-0.5 hover:bg-[#f7f1ea]"
                  aria-label="Social link"
                >
                  {icon}
                </a>
              ))}
            </div>
          </div>

          {footerColumns.map((column) => (
            <div key={column.title}>
              <h3 className="text-lg font-black text-[#2f382f]">{column.title}</h3>
              <ul className="mt-5 space-y-3 text-sm text-[#4f5b4d]">
                {column.items.map((item) => (
                  <li key={item.label}>
                    <a href={item.href} className="transition hover:text-[#455a43]">
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 rounded-[28px] border border-[#d7cabd] bg-[#f6f2eb] p-5 shadow-[0_18px_40px_rgba(80,72,60,0.04)]">
          <div className="grid gap-5 text-sm font-medium text-[#4c584d] md:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-center gap-3">
              <span className="text-[#5a6a50]">✓</span>
              <span>Bank-level security</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[#5a6a50]">🔒</span>
              <span>SSL encrypted</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[#5a6a50]">⚖️</span>
              <span>GDPR ready</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[#5a6a50]">⚡</span>
              <span>99.9% uptime</span>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-[#d1c3b2] pt-6 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-[#4f5b4d]">© {currentYear} TrackExpense. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-5 text-sm text-[#4f5b4d]">
            <a href="#" className="transition hover:text-[#2d352d]">Privacy Policy</a>
            <a href="#" className="transition hover:text-[#2d352d]">Terms of Service</a>
            <a href="#" className="transition hover:text-[#2d352d]">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
