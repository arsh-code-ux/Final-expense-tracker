import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { useCurrency } from '../context/CurrencyContext'
import { useDataSync } from '../contexts/DataSyncContext'
import { getApiUrl, getApiHeaders } from '../utils/apiConfig'
import TransactionFormNew from '../components/TransactionFormNew'
import TransactionList from '../components/TransactionList'
import BudgetManager from '../components/BudgetManager'
import SavingsGoals from '../components/SavingsGoals'
import AlertsPanel from '../components/AlertsPanel'
import BudgetModal from '../components/BudgetModal'
import SavingsGoalModal from '../components/SavingsGoalModal'
import AnimatedCounter, { useIntersectionObserver } from '../components/AnimatedCounter'
import NetworkErrorFallback from '../components/NetworkErrorFallback'

// Import charts normally to fix loading issues
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, AreaChart, Area } from 'recharts'

export default function Dashboard() {
  const { isAuthenticated, user, getToken } = useAuth()
  const { formatAmount } = useCurrency()
  const { syncTrigger, isLoading: syncLoading, lastSyncTime } = useDataSync()
  
  // Sample data for demo/fallback
  const sampleTransactions = [
    {
      _id: '1',
      type: 'income',
      amount: 50000,
      category: 'Salary',
      description: 'Monthly salary',
      date: new Date().toISOString()
    },
    {
      _id: '2', 
      type: 'expense',
      amount: 15000,
      category: 'Food',
      description: 'Groceries',
      date: new Date().toISOString()
    },
    {
      _id: '3',
      type: 'expense', 
      amount: 8000,
      category: 'Transport',
      description: 'Uber rides',
      date: new Date().toISOString()
    }
  ]
  
  const [transactions, setTransactions] = useState([
    {
      _id: '1',
      type: 'income',
      amount: 50000,
      category: 'Salary',
      description: 'Monthly salary',
      date: new Date().toISOString()
    },
    {
      _id: '2',
      type: 'expense',
      amount: 15000,
      category: 'Food',
      description: 'Groceries',
      date: new Date().toISOString()
    },
    {
      _id: '3',
      type: 'expense',
      amount: 8000,
      category: 'Transport',
      description: 'Uber rides',
      date: new Date().toISOString()
    }
  ])
  const [budgets, setBudgets] = useState([])
  const [savings, setSavings] = useState([])
  const [alerts, setAlerts] = useState([])
  const [collaboration, setCollaboration] = useState({ projects: [], summary: [], recent: [], notes: [], files: [], counts: [] })
  const [loading, setLoading] = useState(false) // Start with false for demo data
  const [error, setError] = useState(null)
  const [isRetrying, setIsRetrying] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [showBudgetModal, setShowBudgetModal] = useState(false)
  const [showSavingsModal, setShowSavingsModal] = useState(false)
  const [calendarMonth, setCalendarMonth] = useState(new Date())
  
  const API_BASE = getApiUrl()
  
  // Refs for animated counters
  const statsRef = useRef(null)
  const isStatsVisible = useIntersectionObserver(statsRef)

  // Calculate financial statistics efficiently
  const stats = React.useMemo(() => {
    const incomeTransactions = transactions.filter(t => t.type === 'income')
    const expenseTransactions = transactions.filter(t => t.type === 'expense')
    
    const totalIncome = incomeTransactions.reduce((sum, t) => sum + (t.amount || 0), 0)
    const totalExpenses = expenseTransactions.reduce((sum, t) => sum + (t.amount || 0), 0)
    const balance = totalIncome - totalExpenses

    return { totalIncome, totalExpenses, balance, incomeTransactions, expenseTransactions }
  }, [transactions])

  const { totalIncome, totalExpenses, balance } = stats

  // Debug logging
  useEffect(() => {
    console.log('📊 Dashboard Debug:', {
      isAuthenticated,
      transactionsLength: transactions.length,
      totalIncome,
      totalExpenses,
      balance,
      isStatsVisible,
      syncTrigger
    })
  }, [isAuthenticated, transactions, totalIncome, totalExpenses, balance, isStatsVisible, syncTrigger])

  const tabs = ['overview', 'transactions', 'budgets', 'savings', 'alerts']

  const handleRetry = () => {
    setIsRetrying(true)
    fetchData()
  }

  useEffect(() => {
    if (isAuthenticated) {
      fetchData()
    } else {
      // For non-authenticated users, ensure sample data is properly loaded
      console.log('👤 Not authenticated, using sample data...')
      setLoading(false)
    }
  }, [isAuthenticated, syncTrigger]) // Added syncTrigger to dependencies

  // Show sync status to user
  useEffect(() => {
    if (syncTrigger > 0) {
      console.log('🔄 Dashboard refreshing due to data sync at:', lastSyncTime.toLocaleTimeString())
    }
  }, [syncTrigger, lastSyncTime])

  const fetchData = async () => {
    if (!isAuthenticated) return

    try {
      setLoading(true)
      setError(null)
      
      const token = getToken()
      
      if (!token) {
        setError('Authentication token not found. Please log in again.')
        setLoading(false)
        return
      }
      
      console.log('📡 Fetching dashboard data from:', API_BASE)
      
      const headers = getApiHeaders(token)

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

      // Fetch all data in parallel
      const [transactionsRes, budgetsRes, savingsRes, alertsRes, collaborationRes] = await Promise.all([
        fetch(`${API_BASE}/api/transactions`, { headers, signal: controller.signal }).catch(() => null),
        fetch(`${API_BASE}/api/budgets`, { headers, signal: controller.signal }).catch(() => null),
        fetch(`${API_BASE}/api/savings-goals`, { headers, signal: controller.signal }).catch(() => null),
        fetch(`${API_BASE}/api/alerts`, { headers, signal: controller.signal }).catch(() => null),
        fetch(`${API_BASE}/api/analytics/contributions/overview`, { headers, signal: controller.signal }).catch(() => null)
      ])

      clearTimeout(timeoutId)

      // Check if at least one request succeeded
      const hasAnySuccess = [transactionsRes, budgetsRes, savingsRes, alertsRes].some(res => res?.ok)
      
      if (!hasAnySuccess) {
        throw new Error('Unable to connect to the server. Please check your internet connection.')
      }

      // Process responses
      if (transactionsRes?.ok) {
        const data = await transactionsRes.json()
        setTransactions(data)
        console.log(`✅ Loaded ${data.length} transactions`)
      }
      
      if (budgetsRes?.ok) {
        const data = await budgetsRes.json()
        setBudgets(data)
        console.log(`✅ Loaded ${data.length} budgets`)
      }
      
      if (savingsRes?.ok) {
        const data = await savingsRes.json()
        setSavings(data)
        console.log(`✅ Loaded ${data.length} savings goals`)
      }
      
      if (alertsRes?.ok) {
        const data = await alertsRes.json()
        setAlerts(Array.isArray(data) ? data : [])
        console.log(`✅ Loaded ${Array.isArray(data) ? data.length : 0} alerts`)
      } else {
        // If alerts fail specifically, it's not critical - set empty array
        setAlerts([])
      }

      if (collaborationRes?.ok) {
        setCollaboration(await collaborationRes.json())
      }

    } catch (error) {
      console.error('Error fetching data:', error)
      if (error.name === 'AbortError') {
        setError('Request timed out. The server may be slow to respond.')
      } else if (error.message.includes('fetch') || error.message.includes('network')) {
        setError('Unable to connect to the server. Please check your internet connection.')
      } else {
        setError(error.message || 'An unexpected error occurred while loading your data.')
      }
    } finally {
      setLoading(false)
      setIsRetrying(false)
    }
  }

  const chartData = React.useMemo(() => {
    // Category data
    const categoryMap = {}
    transactions.filter(t => t.type === 'expense').forEach(transaction => {
      const category = transaction.category || 'Other'
      categoryMap[category] = (categoryMap[category] || 0) + transaction.amount
    })
    const categoryData = Object.entries(categoryMap).map(([name, value]) => ({ name, value }))

    // Monthly data
    const monthlyMap = {}
    transactions.forEach(transaction => {
      const month = new Date(transaction.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      if (!monthlyMap[month]) {
        monthlyMap[month] = { month, income: 0, expenses: 0 }
      }
      if (transaction.type === 'income') {
        monthlyMap[month].income += transaction.amount
      } else {
        monthlyMap[month].expenses += transaction.amount
      }
    })
    const monthlyData = Object.values(monthlyMap).sort((a, b) => new Date(a.month) - new Date(b.month))

    return { categoryData, monthlyData }
  }, [transactions])

  const getCategoryData = () => chartData.categoryData
  const getMonthlyData = () => chartData.monthlyData
  const collaborationChartData = collaboration.summary.map((item) => ({
    name: item._id.replace(':', ' '),
    count: item.count
  }))
  const recentActivity = collaboration.recent.map((item) => ({
    date: new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    activity: item.type.replace(':', ' '),
    project: item.project?.name || 'Project'
  }))
  const collaborationTotals = collaboration.counts.reduce((totals, item) => ({
    notes: totals.notes + item.notes,
    files: totals.files + item.files,
    members: totals.members + item.members
  }), { notes: 0, files: 0, members: 0 })
  const getFileUrl = (url) => url?.startsWith('http') ? url : `${API_BASE}${url || ''}`
  const calendarDays = React.useMemo(() => {
    const today = new Date()
    const year = calendarMonth.getFullYear()
    const month = calendarMonth.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const totalDays = new Date(year, month + 1, 0).getDate()
    const activeDays = new Set(transactions.map((transaction) => new Date(transaction.date).toDateString()))
    return Array.from({ length: firstDay + totalDays }, (_, index) => {
      if (index < firstDay) return null
      const day = index - firstDay + 1
      const date = new Date(year, month, day)
      return { day, isToday: date.toDateString() === today.toDateString(), hasActivity: activeDays.has(date.toDateString()) }
    })
  }, [transactions, calendarMonth])

  const shiftCalendarMonth = (offset) => {
    setCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1))
  }

  const tabSummary = {
    overview: ['Overview', 'Your financial health and project pulse', `${transactions.length} transactions`],
    transactions: ['Transactions', 'Review, add, and remove every money movement', `${transactions.length} records`],
    budgets: ['Budgets', 'Keep planned spending visible and actionable', `${budgets.length} active budgets`],
    savings: ['Savings', 'Turn small deposits into meaningful goals', `${savings.length} goals`],
    alerts: ['Alerts', 'Personalized signals from your financial activity', `${alerts.length} alerts`]
  }[activeTab]

  const COLORS = ['#143b2d', '#4f7d5b', '#e7a761', '#a5523b', '#718064', '#b7c9a8']

  // Show error fallback if there's a critical error
  if (error && !loading && isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <NetworkErrorFallback 
            error={error} 
            onRetry={handleRetry}
            isRetrying={isRetrying}
          />
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex justify-center items-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {isRetrying ? 'Retrying connection...' : 'Loading your dashboard...'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="app-page">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Clean Header */}
        <div className="mb-8">
          <div className="app-page-header">
            <div>
            <p className="app-eyebrow">PERSONAL FINANCE / OVERVIEW</p>
            <h1 className="app-display-heading text-4xl text-slate-900 mb-2">
              {isAuthenticated ? `Welcome back, ${user?.name || 'User'}!` : 'Expense Tracker Dashboard'}
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              {isAuthenticated ? 'Here\'s your financial overview' : 'Demo mode - Track your expenses'}
            </p>
            </div>
            <div className="app-date-chip">{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</div>
          </div>
        </div>

        {/* Clean Tab Navigation */}
        <div className="mb-8">
          <div className="app-tabs">
            <nav className="flex space-x-1 overflow-x-auto">
              {tabs.map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  data-tab={tab}
                  className={`px-6 py-3 rounded-xl font-medium text-sm capitalize transition-all duration-200 whitespace-nowrap flex items-center space-x-2 ${
                    activeTab === tab
                      ? 'app-tab-active'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-white hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  <span>{tab}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

      <div className="app-tab-context">
        <div><p className="app-eyebrow">NEST / {activeTab.toUpperCase()}</p><h2 className="app-display-heading text-2xl text-gray-900">{tabSummary[0]}</h2><p className="text-sm text-gray-500">{tabSummary[1]}</p></div>
        <span className="app-context-count">{tabSummary[2]}</span>
      </div>

        {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
          {/* Summary Cards */}
          <div ref={statsRef} className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="app-stat-card app-stat-green">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <h3 className="text-sm font-medium text-green-100">Total Income</h3>
                </div>
              </div>
              <p className="text-2xl font-bold text-white">
                <AnimatedCounter 
                  end={totalIncome} 
                  startAnimation={true} // Force animation start for debugging
                  className="tabular-nums"
                  formatter={formatAmount}
                />
              </p>
              <p className="text-sm text-green-100 mt-1">This month</p>
            </div>
            
            <div className="app-stat-card app-stat-peach">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <h3 className="text-sm font-medium text-orange-100">Total Expenses</h3>
                </div>
              </div>
              <p className="text-2xl font-bold text-white">
                <AnimatedCounter 
                  end={totalExpenses} 
                  startAnimation={true} // Force animation start for debugging
                  className="tabular-nums"
                  formatter={formatAmount}
                />
              </p>
              <p className="text-sm text-orange-100 mt-1">This month</p>
            </div>
            
            <div className={`app-stat-card ${balance >= 0 ? 'app-stat-forest' : 'app-stat-peach'}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <h3 className={`text-sm font-medium ${balance >= 0 ? 'text-blue-100' : 'text-orange-100'}`}>Net Balance</h3>
                </div>
              </div>
              <p className="text-2xl font-bold text-white">
                <AnimatedCounter 
                  end={balance} 
                  startAnimation={true} // Force animation start for debugging
                  className="tabular-nums"
                  formatter={formatAmount}
                />
              </p>
              <p className={`text-sm mt-1 ${balance >= 0 ? 'text-blue-100' : 'text-orange-100'}`}>
                {balance >= 0 ? 'Available funds' : 'Over budget'}
              </p>
            </div>
          </div>

          {/* Charts */}
          <div data-section="charts" className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Expense Categories Pie Chart */}
            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl p-6 rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50">
              <h3 className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">Expenses by Category</h3>
              {getCategoryData().length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={getCategoryData()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {getCategoryData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatAmount(value)} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500 dark:text-gray-400">No expense data available</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">Add some transactions to see your spending breakdown</p>
                </div>
              )}
            </div>

            {/* Monthly Income vs Expenses Bar Chart */}
            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl p-6 rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50">
              <h3 className="text-lg font-semibold text-[#143b2d] dark:text-[#dcebd8] mb-6">Monthly Overview</h3>
              {getMonthlyData().length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={getMonthlyData()}>
                    <CartesianGrid stroke="#dedfd4" strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatAmount(value)} />
                    <Legend />
                    <Bar dataKey="income" fill="#4f7d5b" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expenses" fill="#a5523b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500 dark:text-gray-400">No transaction data available</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">Add some transactions to see your monthly trends</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 transition-colors">
            <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Recent Transactions</h3>
            <TransactionList 
              transactions={transactions.slice(0, 5)} 
              onTransactionUpdated={fetchData}
              showLimited={true}
            />
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-[.8fr_1fr_1.2fr]">
            <div className="app-surface p-6 rounded-2xl">
                <div className="flex items-center justify-between mb-5">
                <div><p className="app-eyebrow">ACTIVITY CALENDAR</p><h3 className="app-display-heading text-2xl text-gray-900">{calendarMonth.toLocaleDateString(undefined, { month: 'long' })}</h3></div>
                <div className="flex items-center gap-1"><button type="button" onClick={() => shiftCalendarMonth(-1)} className="app-calendar-button" aria-label="Previous month">‹</button><span className="px-1 text-sm text-[#718064]">{calendarMonth.getFullYear()}</span><button type="button" onClick={() => shiftCalendarMonth(1)} className="app-calendar-button" aria-label="Next month">›</button></div>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-gray-400">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => <span key={`${day}-${index}`} className="py-1">{day}</span>)}
                {calendarDays.map((item, index) => item ? <span key={index} className={`relative grid h-8 place-items-center rounded-full text-xs ${item.isToday ? 'bg-[#143b2d] text-white' : 'text-gray-700'}`}>{item.day}{item.hasActivity && !item.isToday && <i className="absolute bottom-1 h-1 w-1 rounded-full bg-[#e7a761]" />}</span> : <span key={index} />)}
              </div>
              <div className="mt-5 flex items-center gap-2 text-xs text-gray-500"><span className="h-2 w-2 rounded-full bg-[#e7a761]" /> Days with transactions</div>
            </div>
            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl p-6 rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Collaboration pulse</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Activity across your projects</p>
                </div>
                <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-900/40 dark:text-blue-200">{collaboration.projects.length} projects</span>
              </div>
              {collaborationChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={collaborationChartData} layout="vertical" margin={{ left: 12, right: 12 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} />
                    <YAxis type="category" dataKey="name" width={92} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#0f766e" radius={[0, 5, 5, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="py-12 text-center text-sm text-gray-500 dark:text-gray-400">Create a project or note to start tracking collaboration.</p>
              )}
            </div>

            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl p-6 rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent project activity</h3>
              <div className="mt-4 space-y-3">
                {recentActivity.length === 0 ? <p className="text-sm text-gray-500 dark:text-gray-400">No project activity yet.</p> : recentActivity.map((item, index) => (
                  <div key={`${item.date}-${item.activity}-${index}`} className="flex items-center justify-between border-b border-gray-100 py-2 last:border-0 dark:border-gray-700">
                    <div><p className="text-sm font-medium capitalize text-gray-800 dark:text-gray-100">{item.activity}</p><p className="text-xs text-gray-500 dark:text-gray-400">{item.project}</p></div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{item.date}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div><p className="app-eyebrow">PROJECT LIFE / CONTENT</p><h2 className="app-display-heading text-3xl text-gray-900">Your collaboration desk</h2></div>
              <a href="/workspace" className="app-primary rounded-full px-4 py-2 text-xs font-semibold shadow-sm">Open workspace <span aria-hidden="true">↗</span></a>
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4 mb-6">
              {[['Projects', collaboration.projects.length, '◈'], ['Notes', collaborationTotals.notes, '≡'], ['Uploads', collaborationTotals.files, '↑'], ['Members', collaborationTotals.members, '◌']].map(([label, value, icon]) => (
                <div key={label} className="app-surface rounded-xl p-4"><div className="flex items-center justify-between text-xs text-gray-500"><span>{label}</span><span className="text-lg text-[#718064]">{icon}</span></div><p className="mt-2 text-2xl font-semibold text-[#143b2d]">{value}</p></div>
              ))}
            </div>
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <div className="app-surface rounded-2xl p-5">
                <div className="mb-4 flex items-center justify-between"><div><h3 className="text-lg font-semibold text-gray-900">Recent notes</h3><p className="text-xs text-gray-500">Edit and manage from Workspace</p></div><span className="rounded-full bg-[#e5eee1] px-3 py-1 text-xs font-semibold text-[#31543f]">{collaboration.notes.length} shown</span></div>
                <div className="space-y-2">
                  {collaboration.notes.length === 0 ? <p className="py-6 text-sm text-gray-500">No notes created yet.</p> : collaboration.notes.slice(0, 5).map((note) => <div key={note._id} className="flex items-center justify-between rounded-xl bg-[#f6f3eb] px-3 py-2"><div className="min-w-0"><p className="truncate text-sm font-semibold text-gray-800">{note.title || 'Untitled note'}</p><p className="text-xs text-gray-500">{note.project?.name || 'Project'} · {new Date(note.updatedAt || note.createdAt).toLocaleDateString()}</p></div><a href="/workspace" className="ml-3 text-xs font-semibold text-[#31543f] underline">Open</a></div>)}
                </div>
              </div>
              <div className="app-surface rounded-2xl p-5">
                <div className="mb-4 flex items-center justify-between"><div><h3 className="text-lg font-semibold text-gray-900">Upload history</h3><p className="text-xs text-gray-500">Preview or download project files</p></div><span className="rounded-full bg-[#f7e5d2] px-3 py-1 text-xs font-semibold text-[#5d3827]">{collaboration.files.length} shown</span></div>
                <div className="space-y-2">
                  {collaboration.files.length === 0 ? <p className="py-6 text-sm text-gray-500">No files uploaded yet.</p> : collaboration.files.slice(0, 5).map((file) => <div key={file._id} className="flex items-center justify-between rounded-xl bg-[#f6f3eb] px-3 py-2"><div className="min-w-0"><p className="truncate text-sm font-semibold text-gray-800">{file.originalName}</p><p className="text-xs text-gray-500">{file.project?.name || 'Project'} · {file.size ? `${(file.size / 1024).toFixed(1)} KB` : 'File'}</p></div><a href={getFileUrl(file.url)} download={file.originalName} target="_blank" rel="noreferrer" className="ml-3 text-xs font-semibold text-[#31543f] underline">Download</a></div>)}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

        {/* Transactions Tab */}
        {activeTab === 'transactions' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <div id="transaction-form" className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 sticky top-6">
                <div className="flex items-center mb-6">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center mr-3">
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Add Transaction</h3>
                </div>
                <TransactionFormNew onTransactionAdd={fetchData} isDarkMode={false} />
              </div>
            </div>
            <div className="lg:col-span-2">
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50">
                <div className="flex items-center mb-6">
                  <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-blue-500 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-white text-sm">📝</span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">All Transactions</h3>
                </div>
                <TransactionList transactions={transactions} onTransactionUpdated={fetchData} />
              </div>
            </div>
          </div>
        )}

        {/* Budgets Tab */}
        {activeTab === 'budgets' && (
          <div className="space-y-6">
            {isAuthenticated ? (
              <>
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Budget Management</h2>
                    </div>
                    <button 
                      onClick={() => setShowBudgetModal(true)}
                      data-action="create-budget"
                      className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg"
                    >
                      Create Budget
                    </button>
                  </div>
                </div>
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 overflow-hidden">
                  <BudgetManager budgets={budgets} transactions={transactions} onBudgetUpdated={fetchData} />
                </div>
              </>
            ) : (
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-12 rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 text-center">
                <div className="text-6xl mb-4">🔒</div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Authentication Required</h2>
                <p className="text-gray-600 dark:text-gray-400">Please log in to manage your budgets.</p>
              </div>
            )}
          </div>
        )}

        {/* Savings Tab */}
        {activeTab === 'savings' && (
          <div className="space-y-6">
            {isAuthenticated ? (
              <>
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Savings Goals</h2>
                    </div>
                    <button 
                      onClick={() => setShowSavingsModal(true)}
                      data-action="create-savings-goal"
                      className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg"
                    >
                      Create Goal
                    </button>
                  </div>
                </div>
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 overflow-hidden">
                  <SavingsGoals savings={savings} onSavingsUpdated={fetchData} />
                </div>
              </>
            ) : (
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-12 rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 text-center">
                <div className="text-6xl mb-4">🔒</div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Authentication Required</h2>
                <p className="text-gray-600 dark:text-gray-400">Please log in to manage your savings goals.</p>
              </div>
            )}
          </div>
        )}

        {/* Alerts Tab */}
        {activeTab === 'alerts' && (
          <div className="space-y-6">
            {isAuthenticated ? (
              <>
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50">
                  <div className="flex items-center">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Alerts & Notifications</h2>
                  </div>
                </div>
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 overflow-hidden">
                  <AlertsPanel
                    alerts={alerts}
                    onAlertsUpdated={(nextAlerts) => nextAlerts ? setAlerts(nextAlerts) : fetchData()}
                  />
                </div>
              </>
            ) : (
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-12 rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 text-center">
                <div className="text-6xl mb-4">🔒</div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Authentication Required</h2>
                <p className="text-gray-600 dark:text-gray-400">Please log in to view your alerts.</p>
              </div>
            )}
          </div>
        )}

      {/* Modals */}
      {showBudgetModal && (
        <BudgetModal 
          onClose={() => setShowBudgetModal(false)}
          onBudgetCreated={fetchData}
        />
      )}

      {showSavingsModal && (
        <SavingsGoalModal 
          onClose={() => setShowSavingsModal(false)}
          onGoalCreated={fetchData}
        />
      )}
      </div>
    </div>
  )
}