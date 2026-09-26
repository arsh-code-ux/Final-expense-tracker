import React, { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import SharedNav from '../components/SharedNav'
import SharedFooter from '../components/SharedFooter'

export default function LandingPage() {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard')
    }
  }, [isAuthenticated, navigate])

  const featureCards = [
    {
      icon: '💰',
      title: 'Budget control',
      text: 'Set category budgets, monitor progress, and stay ahead of overspending before it happens.',
      color: 'bg-[#b7c7a2]'
    },
    {
      icon: '📊',
      title: 'Smart analytics',
      text: 'Turn expenses into clear trends with elegant reports that make decisions easier.',
      color: 'bg-[#d9c4a3]'
    },
    {
      icon: '🎯',
      title: 'Savings goals',
      text: 'Create milestones for travel, emergencies, and big purchases with visual progress tracking.',
      color: 'bg-[#c9d0c3]'
    },
    {
      icon: '🤖',
      title: 'AI insights',
      text: 'Get actionable suggestions and personalized financial guidance from your built-in assistant.',
      color: 'bg-[#eed9bf]'
    },
    {
      icon: '💳',
      title: 'Recurring bills',
      text: 'Track subscriptions, rent, and regular expenses without losing visibility over monthly cash flow.',
      color: 'bg-[#c5b7a5]'
    },
    {
      icon: '🔔',
      title: 'Smart reminders',
      text: 'Receive timely alerts for payment due dates, category spikes, and budget stretching.',
      color: 'bg-[#dfe5d5]'
    }
  ]

  const metrics = [
    { value: '12K+', label: 'Active users' },
    { value: '48%', label: 'Average savings boost' },
    { value: '4.9/5', label: 'User rating' }
  ]

  return (
    <div className="min-h-screen bg-[#f5f1e8] text-[#2f342d]">
      <SharedNav />

      <section className="relative overflow-hidden pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(145,160,120,0.22),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(212,178,138,0.22),_transparent_35%)]" />
        <div className="relative max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-[1.1fr_0.9fr] items-center gap-12">
            <div>
              <span className="inline-flex items-center rounded-full border border-[#b7c7a2] bg-[#f0f3ea] px-4 py-2 text-sm font-semibold tracking-[0.12em] text-[#4d5b43] uppercase">
                Built for smarter money habits
              </span>

              <h1 className="mt-8 text-4xl font-black leading-tight text-[#1e2921] sm:text-5xl lg:text-7xl">
                Take control of your
                <span className="block text-[#5f6d51]">financial future.</span>
              </h1>

              <p className="mt-6 max-w-xl text-lg leading-8 text-[#475246] sm:text-xl">
                Track spending, manage budgets, and build better habits with a calm, modern dashboard designed for real life.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center rounded-2xl bg-[#6f7e5f] px-8 py-4 text-lg font-bold text-white shadow-[0_16px_30px_rgba(111,126,95,0.3)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#596a4b]"
                >
                  Get started free
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center rounded-2xl border border-[#b7c7a2] bg-white/80 px-8 py-4 text-lg font-bold text-[#2f342d] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#8ca07b]"
                >
                  Sign in
                </Link>
              </div>

              <div className="mt-10 flex flex-wrap gap-6 text-sm font-medium text-[#4d564d]">
                <span>• Secure personal tracking</span>
                <span>• AI-powered insights</span>
                <span>• Simple monthly planning</span>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -left-10 top-10 h-32 w-32 rounded-full bg-[#d9c4a3] blur-3xl opacity-80" />
              <div className="absolute -right-4 bottom-8 h-32 w-32 rounded-full bg-[#b7c7a2] blur-3xl opacity-80" />

              <div className="relative overflow-hidden rounded-[32px] border border-[#e7dfd3] bg-white/75 p-4 shadow-[0_30px_80px_rgba(78,82,74,0.16)] backdrop-blur-xl">
                <div className="rounded-[24px] bg-[#f6f2eb] p-5">
                  <div className="flex items-center justify-between border-b border-[#e5dfd4] pb-4">
                    <div>
                      <p className="text-sm font-medium text-[#687263]">Balance overview</p>
                      <h2 className="mt-1 text-3xl font-black text-[#1c261f]">₹28,450</h2>
                    </div>
                    <div className="rounded-2xl bg-[#dfe9d1] px-3 py-2 text-sm font-bold text-[#4c5a42]">+8.4%</div>
                  </div>

                  <div className="mt-6 grid gap-4 sm:grid-cols-3">
                    {metrics.map((metric) => (
                      <div key={metric.label} className="rounded-2xl bg-white p-4 shadow-sm border border-[#efe8e0]">
                        <div className="text-xl font-black text-[#2a322b]">{metric.value}</div>
                        <div className="mt-1 text-xs text-[#6a7168]">{metric.label}</div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 rounded-2xl bg-[#eef2ea] p-4 border border-[#dfe8d8]">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-sm font-semibold text-[#4d5b43]">Monthly budget</span>
                      <span className="text-sm font-bold text-[#2c382f]">₹18.2k / ₹24k</span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-[#dfe6d3]">
                      <div className="h-full w-[76%] rounded-full bg-gradient-to-r from-[#b7c7a2] to-[#9aa987]" />
                    </div>
                  </div>

                  <div className="mt-6 space-y-3">
                    {[
                      ['Groceries', '₹4,200', 'bg-[#dfe9d1]'],
                      ['Transport', '₹2,950', 'bg-[#f0e0c8]'],
                      ['Bills', '₹5,800', 'bg-[#e9e4d8]']
                    ].map(([label, amount, tone]) => (
                      <div key={label} className="flex items-center justify-between rounded-2xl bg-white p-3 border border-[#efe8e0]">
                        <div className="flex items-center gap-3">
                          <div className={`h-10 w-10 rounded-xl ${tone}`} />
                          <div>
                            <div className="font-semibold text-[#2e352f]">{label}</div>
                            <div className="text-xs text-[#6f756e]">This month</div>
                          </div>
                        </div>
                        <div className="font-bold text-[#2c382f]">{amount}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#5f6d51]">Everything you need</p>
            <h2 className="mt-4 text-3xl font-black text-[#1d291f] sm:text-4xl lg:text-5xl">A cleaner way to manage money.</h2>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {featureCards.map((feature) => (
              <div key={feature.title} className="rounded-[28px] border border-[#e7ded2] bg-white p-7 shadow-[0_15px_40px_rgba(80,82,70,0.06)] transition-transform duration-200 hover:-translate-y-1">
                <div className={`flex h-14 w-14 items-center justify-center rounded-2xl text-2xl ${feature.color}`}>
                  {feature.icon}
                </div>
                <h3 className="mt-6 text-2xl font-black text-[#1d291f]">{feature.title}</h3>
                <p className="mt-3 text-base leading-7 text-[#58645c]">{feature.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#5f6d51]">Why people stay</p>
            <h2 className="mt-4 text-3xl font-black text-[#1d291f] sm:text-4xl">A healthier relationship with money starts here.</h2>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {[
              {
                title: 'Less financial stress',
                text: 'See your cash flow clearly so you always know what is left after bills, savings, and essentials.',
                icon: '🧠'
              },
              {
                title: 'Faster decisions',
                text: 'Know where your money is going at a glance, without digging through receipts or spreadsheets.',
                icon: '⚡'
              },
              {
                title: 'Better habits',
                text: 'Track recurring expenses, highlight wasteful spending, and build habits that compound over time.',
                icon: '📈'
              },
              {
                title: 'Goals that feel real',
                text: 'Create mini milestones for travel, emergency funds, debt payoff, and future investments.',
                icon: '🎯'
              }
            ].map((item) => (
              <div key={item.title} className="rounded-[28px] border border-[#e7ded2] bg-[#f8f4ee] p-6 shadow-[0_15px_35px_rgba(80,82,70,0.05)]">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#dfe9d1] text-2xl">{item.icon}</div>
                <h3 className="mt-5 text-xl font-black text-[#1d291f]">{item.title}</h3>
                <p className="mt-3 text-base leading-7 text-[#58645c]">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#ece4d8] px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl rounded-[32px] border border-[#ded1c0] bg-[#f4efe9] p-8 shadow-[0_20px_45px_rgba(90,83,69,0.06)] lg:p-12">
          <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#5f6d51]">Built for everyday life</p>
              <h2 className="mt-4 text-3xl font-black text-[#1d291f] sm:text-4xl">Financial clarity, not just numbers.</h2>
              <p className="mt-5 text-lg leading-8 text-[#536052]">
                TrackExpense is designed for real people managing rent, groceries, bills, savings, and unexpected expenses in one simple place.
              </p>

              <div className="mt-8 space-y-4">
                {[
                  'Monitor monthly budgets without second-guessing overspending',
                  'Plan for larger goals like travel, education, or emergency savings',
                  'See recurring charges before they silently drain your account'
                ].map((point) => (
                  <div key={point} className="flex items-start gap-4 rounded-2xl bg-white p-4 border border-[#e4ddd0]">
                    <div className="mt-1 flex h-7 w-7 items-center justify-center rounded-full bg-[#dfe9d1] text-sm font-black text-[#465642]">✓</div>
                    <p className="text-base leading-7 text-[#49584c]">{point}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] bg-[#2d392f] p-7 text-white shadow-[0_22px_40px_rgba(45,57,47,0.18)]">
              <div className="flex items-center justify-between border-b border-white/10 pb-5">
                <div>
                  <p className="text-sm text-[#dfe7d8]">This month</p>
                  <h3 className="mt-2 text-3xl font-black">₹31,540</h3>
                </div>
                <div className="rounded-2xl bg-[#dfe9d1] px-3 py-2 text-sm font-bold text-[#2d392f]">+12.3%</div>
              </div>

              <div className="mt-6 space-y-4">
                {[
                  ['Essentials', '₹14,200', 'bg-[#b7c7a2]'],
                  ['Lifestyle', '₹8,360', 'bg-[#d9c4a3]'],
                  ['Savings', '₹9,000', 'bg-[#c6d0c5]']
                ].map(([label, value, tone]) => (
                  <div key={label} className="flex items-center justify-between rounded-2xl bg-white/5 p-4">
                    <div className="flex items-center gap-3">
                      <div className={`h-9 w-9 rounded-xl ${tone}`} />
                      <span className="font-semibold">{label}</span>
                    </div>
                    <span className="font-bold">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="bg-[#f7f2ea] px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#5f6d51]">How it works</p>
            <h2 className="mt-4 text-3xl font-black text-[#1d291f] sm:text-4xl">Simple steps. Real financial progress.</h2>
          </div>

          <div className="mt-12 grid gap-10 lg:grid-cols-3">
            <div className="rounded-[30px] bg-white p-8 shadow-[0_18px_45px_rgba(76,74,63,0.08)]">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#dfe9d1] text-xl font-black text-[#425139]">1</div>
              <h3 className="mt-6 text-2xl font-black text-[#1d291f]">Connect your accounts</h3>
              <p className="mt-4 text-base leading-7 text-[#5c665d]">
                Start by adding your income streams and regular expenses for a complete view of your cash flow.
              </p>
            </div>

            <div className="rounded-[30px] bg-white p-8 shadow-[0_18px_45px_rgba(76,74,63,0.08)]">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f0d9b8] text-xl font-black text-[#604d39]">2</div>
              <h3 className="mt-6 text-2xl font-black text-[#1d291f]">Plan smarter</h3>
              <p className="mt-4 text-base leading-7 text-[#5c665d]">
                Build budgets by category, save toward goals, and get reminders before your money runs tight.
              </p>
            </div>

            <div className="rounded-[30px] bg-white p-8 shadow-[0_18px_45px_rgba(76,74,63,0.08)]">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#dfe5d5] text-xl font-black text-[#435147]">3</div>
              <h3 className="mt-6 text-2xl font-black text-[#1d291f]">Grow your confidence</h3>
              <p className="mt-4 text-base leading-7 text-[#5c665d]">
                Review trends, improve habits, and make better financial decisions with data that actually makes sense.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl rounded-[32px] border border-[#e1d8ca] bg-[#f8f4ee] p-8 shadow-[0_18px_45px_rgba(84,82,74,0.07)] lg:p-12">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#5f6d51]">Simple pricing</p>
              <h2 className="mt-4 text-3xl font-black text-[#1d291f] sm:text-4xl">Start free. Upgrade when you are ready.</h2>
            </div>

            <div className="rounded-[26px] bg-[#2d392f] p-6 text-white shadow-[0_18px_40px_rgba(45,57,47,0.2)]">
              <div className="text-sm uppercase tracking-[0.18em] text-[#dce7d6]">Pro</div>
              <div className="mt-3 text-4xl font-black">₹499<span className="text-lg font-medium text-[#dce7d6]">/mo</span></div>
            </div>
          </div>
        </div>
      </section>

      <section id="faq" className="bg-[#f6f2ea] px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#5f6d51]">Questions</p>
            <h2 className="mt-4 text-3xl font-black text-[#1d291f] sm:text-4xl">Everything you need to know.</h2>
          </div>

          <div className="mt-10 space-y-4">
            {[
              ['Is it secure?', 'Yes. Your data is protected with secure authentication and a clean, privacy-first experience.'],
              ['Can I track recurring expenses?', 'Absolutely. You can monitor subscriptions, rent, bills, and regular expenses in one place.'],
              ['Does it support goal planning?', 'Yes. You can create savings goals, track milestones, and monitor your progress visually.']
            ].map(([question, answer]) => (
              <div key={question} className="rounded-[24px] border border-[#e4ddd0] bg-white p-6 shadow-sm">
                <div className="text-lg font-bold text-[#263126]">{question}</div>
                <p className="mt-2 text-base leading-7 text-[#58645c]">{answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 pb-20 pt-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl rounded-[32px] bg-[#2e382f] px-8 py-12 text-center text-white shadow-[0_18px_40px_rgba(46,56,47,0.25)] lg:px-14">
          <h2 className="text-3xl font-black sm:text-4xl lg:text-5xl">Ready to build better money habits?</h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-[#dfe7d8]">
            Join the people who use TrackExpense to stay organized, reduce stress, and move toward their goals with clarity.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              to="/login"
              className="inline-flex items-center justify-center rounded-2xl bg-[#dfe9d1] px-8 py-4 text-lg font-bold text-[#2f342d] transition-all duration-200 hover:-translate-y-0.5"
            >
              Start free today
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center rounded-2xl border border-[#dfe7d8] px-8 py-4 text-lg font-bold text-white transition-all duration-200 hover:bg-white/5"
            >
              Already have an account?
            </Link>
          </div>
        </div>
      </section>

      <SharedFooter />
    </div>
  )
}
