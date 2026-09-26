import React, { useState } from 'react'
import { useCurrency } from '../context/CurrencyContext'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import CurrencySelector from '../components/CurrencySelector'
import { getApiUrl, getApiHeaders } from '../utils/apiConfig'

export default function Settings() {
  const { isDark, toggleTheme } = useTheme()
  const { currency, currencies, setCurrency } = useCurrency()
  const { user, isAuthenticated, getToken } = useAuth()
  const [saved, setSaved] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [importing, setImporting] = useState(false)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleExportTransactions = async () => {
    if (!isAuthenticated) {
      alert('Please log in to export your data')
      return
    }

    setExporting(true)
    try {
      const token = getToken()
      const API_BASE = getApiUrl()
      
      console.log('🔽 Exporting transactions from:', API_BASE)
      
      const response = await fetch(`${API_BASE}/api/transactions`, {
        headers: getApiHeaders(token)
      })

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed. Please log in again.')
        } else if (response.status === 404) {
          throw new Error('Transactions endpoint not found. Please contact support.')
        } else if (response.status >= 500) {
          throw new Error('Server error. Please try again later.')
        } else {
          throw new Error(`Failed to fetch transactions (Status: ${response.status})`)
        }
      }

      const transactions = await response.json()
      
      console.log(`✅ Fetched ${transactions.length} transactions for export`)

      if (!Array.isArray(transactions) || transactions.length === 0) {
        alert('No transactions found to export.')
        return
      }
      
      // Create CSV content
      const csvHeaders = ['Date', 'Type', 'Amount', 'Category', 'Description']
      const csvRows = transactions.map(t => [
        new Date(t.date).toLocaleDateString(),
        t.type,
        t.amount,
        t.category || 'Uncategorized',
        t.description || ''
      ])
      
      const csvContent = [
        csvHeaders.join(','),
        ...csvRows.map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
      ].join('\n')

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `expense-tracker-transactions-${new Date().toISOString().split('T')[0]}.csv`
      a.style.display = 'none'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      alert(`✅ Successfully exported ${transactions.length} transactions!`)
    } catch (error) {
      console.error('❌ Export error:', error)
      alert(`❌ Export failed: ${error.message}`)
    } finally {
      setExporting(false)
    }
  }

  const handleImportData = () => {
    if (!isAuthenticated) {
      alert('Please log in to import data')
      return
    }

    // Create file input element
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.csv,.json'
    input.onchange = async (e) => {
      const file = e.target.files[0]
      if (!file) return

      setImporting(true)
      try {
        const text = await file.text()
        
        let transactions = []
        
        if (file.name.endsWith('.csv')) {
          // Parse CSV
          const lines = text.split('\n').filter(line => line.trim())
          if (lines.length < 2) {
            throw new Error('CSV file must have at least a header row and one data row')
          }
          
          const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim().toLowerCase())
          
          for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.replace(/"/g, '').trim())
            
            // Map common header variations
            const getValueByHeader = (possibleHeaders) => {
              for (const header of possibleHeaders) {
                const index = headers.indexOf(header)
                if (index !== -1) return values[index]
              }
              return ''
            }

            const transaction = {
              date: getValueByHeader(['date', 'transaction date', 'created_at']) || new Date().toISOString(),
              type: getValueByHeader(['type', 'transaction type', 'category type']) || 'expense',
              amount: parseFloat(getValueByHeader(['amount', 'value', 'price', 'total'])) || 0,
              category: getValueByHeader(['category', 'expense category', 'type']) || 'Uncategorized',
              description: getValueByHeader(['description', 'note', 'memo', 'comment']) || ''
            }

            if (transaction.amount > 0) {
              transactions.push(transaction)
            }
          }
        } else if (file.name.endsWith('.json')) {
          // Parse JSON
          const data = JSON.parse(text)
          transactions = Array.isArray(data) ? data : [data]
          
          // Validate and normalize JSON transactions
          transactions = transactions.filter(t => t && typeof t === 'object' && t.amount > 0)
            .map(t => ({
              date: t.date || t.created_at || new Date().toISOString(),
              type: t.type || 'expense',
              amount: parseFloat(t.amount) || 0,
              category: t.category || 'Uncategorized',
              description: t.description || t.note || ''
            }))
        }

        if (transactions.length === 0) {
          alert('No valid transactions found in the file. Please check the file format.')
          return
        }

        // Ask for confirmation
        const confirmed = confirm(`Found ${transactions.length} transactions. Do you want to import them?`)
        if (!confirmed) return

        // Import transactions
        const token = getToken()
        const API_BASE = getApiUrl()
        let imported = 0
        let failed = 0

        console.log('🔼 Importing transactions to:', API_BASE)

        for (const transaction of transactions) {
          try {
            const response = await fetch(`${API_BASE}/api/transactions`, {
              method: 'POST',
              headers: getApiHeaders(token),
              body: JSON.stringify(transaction)
            })

            if (response.ok) {
              imported++
            } else {
              failed++
            }
          } catch (error) {
            failed++
          }
        }

        if (imported > 0) {
          alert(`Successfully imported ${imported} transactions!${failed > 0 ? ` (${failed} failed)` : ''}`)
        } else {
          alert('Failed to import any transactions. Please check your data and try again.')
        }
      } catch (error) {
        console.error('Import error:', error)
        alert(`Failed to import data: ${error.message}. Please check the file format and try again.`)
      } finally {
        setImporting(false)
      }
    }

    input.click()
  }

  return (
    <div className="app-page p-4 transition-colors duration-300">
      {/* Animated Background */}
      <div className="hidden fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 dark:opacity-30 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 dark:opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 dark:opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="app-display-heading text-4xl md:text-5xl text-gray-900 dark:text-white mb-4">
            ⚙️ Settings
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Customize your expense tracking experience
          </p>
        </div>

        {/* Settings Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Currency Settings */}
          <div className="app-surface p-6 rounded-2xl">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mr-4">
                <span className="text-white text-xl">💰</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Currency Settings</h2>
                <p className="text-gray-600 dark:text-gray-400">Choose your preferred currency</p>
              </div>
            </div>
            
            <CurrencySelector className="mb-4" />
            
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
              <div className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Current Selection:</strong> {currencies[currency]?.name} ({currency})
              </div>
              <div className="text-xs text-blue-600 dark:text-blue-300 mt-2">
                All amounts throughout the application will be displayed in this currency
              </div>
            </div>

            {/* Popular Currencies Quick Select */}
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Quick Select Popular Currencies:</h4>
              <div className="grid grid-cols-2 gap-2">
                {['USD', 'EUR', 'GBP', 'JPY', 'INR', 'CAD'].map((code) => (
                  <button
                    key={code}
                    onClick={() => setCurrency(code)}
                    className={`p-3 rounded-lg border text-sm font-medium transition-all duration-200 ${
                      currency === code
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-blue-50 dark:hover:bg-gray-600'
                    }`}
                  >
                    {currencies[code]?.symbol} {code}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Appearance Settings */}
          <div className="app-surface p-6 rounded-2xl">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mr-4">
                <span className="text-white text-xl">{isDark ? '🌙' : '☀️'}</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Appearance</h2>
                <p className="text-gray-600 dark:text-gray-400">Customize the look and feel</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600">
                <div>
                  <label className="text-lg font-medium text-gray-900 dark:text-white">Theme</label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Switch between light and dark modes</p>
                </div>
                <button
                  onClick={toggleTheme}
                  className={`relative inline-flex h-8 w-16 items-center justify-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isDark ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white shadow transition-transform duration-200 ${
                      isDark ? 'translate-x-3' : '-translate-x-3'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Account Information */}
          {isAuthenticated && (
            <div className="app-surface p-6 rounded-2xl">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center mr-4">
                  <span className="text-white text-xl">👤</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Account</h2>
                  <p className="text-gray-600 dark:text-gray-400">Your account information</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Name</div>
                  <div className="text-lg font-medium text-gray-900 dark:text-white">{user?.name || 'User'}</div>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Email</div>
                  <div className="text-lg font-medium text-gray-900 dark:text-white">{user?.email || 'Not available'}</div>
                </div>
              </div>
            </div>
          )}

          {/* Export/Import Settings */}
          <div className="app-surface p-6 rounded-2xl">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center mr-4">
                <span className="text-white text-xl">📊</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Data Management</h2>
                <p className="text-gray-600 dark:text-gray-400">Export and manage your data</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <button 
                onClick={handleExportTransactions}
                disabled={exporting || !isAuthenticated}
                className={`w-full p-4 text-white rounded-xl font-medium transition-all duration-200 transform hover:scale-105 shadow-lg ${
                  exporting || !isAuthenticated
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
                }`}
              >
                {exporting ? '⏳ Exporting...' : '📤 Export Transactions'}
              </button>
              <button 
                onClick={handleImportData}
                disabled={importing || !isAuthenticated}
                className={`w-full p-4 text-white rounded-xl font-medium transition-all duration-200 transform hover:scale-105 shadow-lg ${
                  importing || !isAuthenticated
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
                }`}
              >
                {importing ? '⏳ Importing...' : '📥 Import Data'}
              </button>
              {!isAuthenticated && (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-2">
                  Please log in to use data management features
                </p>
              )}
              {isAuthenticated && (
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">📋 Import Guidelines:</h4>
                  <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
                    <li>• <strong>CSV:</strong> Should have headers like Date, Type, Amount, Category, Description</li>
                    <li>• <strong>JSON:</strong> Array of transaction objects with same fields</li>
                    <li>• Export your data first to see the expected format</li>
                    <li>• Maximum file size: 10MB</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="mt-8 text-center">
          <button
            onClick={handleSave}
            className={`px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg ${
              saved
                ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white'
            }`}
          >
            {saved ? '✅ Settings Saved!' : '💾 Save Settings'}
          </button>
        </div>

        <div className="mt-8 text-center text-gray-500 dark:text-gray-400">
          <p>Settings are automatically saved to your browser's local storage.</p>
        </div>
      </div>
    </div>
  )
}