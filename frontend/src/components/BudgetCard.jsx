import React from 'react'
import { useCurrency } from '../context/CurrencyContext'
import { useAuth } from '../context/AuthContext'
import { getApiUrl, getApiHeaders } from '../utils/apiConfig'

export default function BudgetCard({ budget, transactions, onBudgetUpdated }) {
  const { formatAmount } = useCurrency()
  const { getToken } = useAuth()
  
  // Calculate spent amount based on transactions in this budget's category and period
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()
  
  const spent = transactions
    .filter(transaction => {
      const transactionDate = new Date(transaction.date)
      return (
        transaction.type === 'expense' &&
        transaction.category === budget.category &&
        transactionDate.getMonth() === currentMonth &&
        transactionDate.getFullYear() === currentYear
      )
    })
    .reduce((sum, transaction) => sum + transaction.amount, 0)

  const remaining = budget.amount - spent
  const percentageSpent = budget.amount > 0 ? (spent / budget.amount) * 100 : 0
  
  const getProgressColor = () => {
    if (percentageSpent <= 50) return 'bg-success-500'
    if (percentageSpent <= 80) return 'bg-accent-500'
    return 'bg-danger-500'
  }

  const getCardColor = () => {
    if (percentageSpent <= 50) return 'border-success-200 bg-gradient-to-br from-success-50 to-success-100'
    if (percentageSpent <= 80) return 'border-accent-200 bg-gradient-to-br from-accent-50 to-accent-100'
    return 'border-danger-200 bg-gradient-to-br from-danger-50 to-danger-100'
  }

  const deleteBudget = async () => {
    if (!window.confirm(`Are you sure you want to delete the ${budget.category} budget?`)) {
      return
    }

    try {
      const API_BASE = getApiUrl()
      const token = getToken()

      console.log('🗑️ Deleting budget at:', API_BASE)

      const response = await fetch(`${API_BASE}/api/budgets/${budget._id}`, {
        method: 'DELETE',
        headers: getApiHeaders(token)
      })

      if (response.ok) {
        console.log('Budget deleted successfully')
        onBudgetUpdated && onBudgetUpdated() // Refresh budgets list
      } else {
        console.error('Failed to delete budget')
        alert('Failed to delete budget. Please try again.')
      }
    } catch (error) {
      console.error('Error deleting budget:', error)
      alert('Error deleting budget. Please try again.')
    }
  }

  return (
    <div className={`p-4 sm:p-6 rounded-2xl border-2 shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1 ${getCardColor()}`}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-2 sm:space-y-0">
        <h3 className="text-base sm:text-xl font-bold text-navy capitalize">{budget.category}</h3>
        <div className="flex items-center space-x-3">
          <span className={`text-xs sm:text-sm font-bold px-3 py-1.5 rounded-full ${
            budget.period === 'monthly' 
              ? 'bg-primary-200 text-primary-800' 
              : 'bg-accent-200 text-accent-800'
          }`}>
            {budget.period === 'monthly' ? 'Monthly' : 'Weekly'}
          </span>
          <button
            onClick={deleteBudget}
            className="text-neutral-400 hover:text-white hover:bg-danger-500 transition-all p-2 rounded-xl transform hover:-translate-y-0.5"
            title="Delete Budget"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
      
      <div className="space-y-3">
        <div className="flex justify-between text-xs sm:text-sm">
          <span className="text-primary-700 font-semibold">Budget</span>
          <span className="font-bold text-navy break-all text-right">{formatAmount(budget.amount)}</span>
        </div>
        
        <div className="flex justify-between text-xs sm:text-sm">
          <span className="text-primary-700 font-semibold">Spent</span>
          <span className="font-bold text-navy break-all text-right">{formatAmount(spent)}</span>
        </div>
        
        <div className="flex justify-between text-xs sm:text-sm">
          <span className="text-primary-700 font-semibold">Remaining</span>
          <span className={`font-bold break-all text-right ${remaining >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
            {formatAmount(remaining)}
          </span>
        </div>
        
        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-primary-700 font-semibold mb-2">
            <span>Progress</span>
            <span>{Math.min(percentageSpent, 100).toFixed(0)}%</span>
          </div>
          <div className="w-full bg-neutral-200 rounded-full h-3 shadow-inner">
            <div
              className={`h-3 rounded-full transition-all duration-500 shadow-lg ${getProgressColor()}`}
              style={{ width: `${Math.min(percentageSpent, 100)}%` }}
            ></div>
          </div>
        </div>
        
        {percentageSpent > 100 && (
          <div className="mt-3 p-3 bg-gradient-to-r from-danger-100 to-danger-200 border-2 border-danger-300 rounded-xl">
            <p className="text-xs text-danger-800 font-bold break-words flex items-center">
              <span className="text-lg mr-2">⚠️</span>
              Budget exceeded by {formatAmount(spent - budget.amount)}
            </p>
          </div>
        )}
        
        {percentageSpent > 80 && percentageSpent <= 100 && (
          <div className="mt-3 p-3 bg-gradient-to-r from-accent-100 to-accent-200 border-2 border-accent-300 rounded-xl">
            <p className="text-xs text-accent-800 font-bold flex items-center">
              <span className="text-lg mr-2">⚠️</span>
              Approaching budget limit
            </p>
          </div>
        )}
      </div>
    </div>
  )
}