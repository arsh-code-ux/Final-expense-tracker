import React from 'react'
import { useCurrency } from '../context/CurrencyContext'
import { useAuth } from '../context/AuthContext'
import { getApiUrl, getApiHeaders } from '../utils/apiConfig'

export default function SavingsGoalCard({ goal, onSavingsUpdated, currentBalance = 0 }) {
  const { formatAmount } = useCurrency()
  const { getToken } = useAuth()
  
  // Show the amount user entered when creating goal
  const actualCurrentAmount = Math.max(0, goal.currentAmount || 0) 
  
  const progressPercentage = goal.targetAmount > 0 ? (actualCurrentAmount / goal.targetAmount) * 100 : 0
  const remaining = Math.max(0, goal.targetAmount - actualCurrentAmount)
  const isCompleted = actualCurrentAmount >= goal.targetAmount
  
  const getProgressColor = () => {
    if (isCompleted) return 'bg-success-500'
    if (progressPercentage >= 75) return 'bg-primary-500'
    if (progressPercentage >= 50) return 'bg-accent-500'
    return 'bg-neutral-400'
  }

  const getCardColor = () => {
    if (isCompleted) return 'border-success-300 bg-gradient-to-br from-success-50 to-success-100'
    return 'border-primary-200 bg-gradient-to-br from-white to-primary-50'
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    })
  }

  const getDaysRemaining = () => {
    if (!goal.deadline) return null
    const today = new Date()
    const targetDate = new Date(goal.deadline)
    const diffTime = targetDate - today
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const daysRemaining = getDaysRemaining()

  const deleteSavingsGoal = async () => {
    if (!window.confirm(`Are you sure you want to delete the "${goal.title}" savings goal?`)) {
      return
    }

    try {
      const API_BASE = getApiUrl()
      const token = getToken()

      console.log('🗑️ Deleting savings goal from:', API_BASE)

      const response = await fetch(`${API_BASE}/api/savings-goals/${goal._id}`, {
        method: 'DELETE',
        headers: getApiHeaders(token)
      })

      if (response.ok) {
        console.log('Savings goal deleted successfully')
        onSavingsUpdated && onSavingsUpdated() // Refresh savings goals list
      } else {
        console.error('Failed to delete savings goal')
        alert('Failed to delete savings goal. Please try again.')
      }
    } catch (error) {
      console.error('Error deleting savings goal:', error)
      alert('Error deleting savings goal. Please try again.')
    }
  }

  const updateCurrentAmount = async () => {
    const newAmount = prompt(
      `Update current amount for "${goal.title}"\n\nCurrent: ${formatAmount(actualCurrentAmount)}\nYour account balance: ${formatAmount(currentBalance)}\n\nEnter new amount:`, 
      actualCurrentAmount.toString()
    )
    
    if (newAmount === null || newAmount === '') return
    
    const amount = parseFloat(newAmount)
    if (isNaN(amount) || amount < 0) {
      alert('Please enter a valid positive number')
      return
    }

    try {
      const API_BASE = getApiUrl()
      const token = getToken()

      console.log('💰 Updating savings goal at:', API_BASE)

      const response = await fetch(`${API_BASE}/api/savings-goals/${goal._id}`, {
        method: 'PUT',
        headers: getApiHeaders(token),
        body: JSON.stringify({
          ...goal,
          currentAmount: amount
        })
      })

      if (response.ok) {
        console.log('Savings goal updated successfully')
        onSavingsUpdated && onSavingsUpdated() // Refresh savings goals list
      } else {
        console.error('Failed to update savings goal')
        alert('Failed to update savings goal. Please try again.')
      }
    } catch (error) {
      console.error('Error updating savings goal:', error)
      alert('Error updating savings goal. Please try again.')
    }
  }

  return (
    <div className={`p-4 sm:p-6 rounded-2xl border-2 shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1 ${getCardColor()}`}>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4 space-y-2 sm:space-y-0">
        <div className="min-w-0 flex-1">
          <h3 className="text-base sm:text-xl font-bold text-navy break-words">{goal.title}</h3>
          {goal.description && (
            <p className="text-xs sm:text-sm text-primary-700 mt-2 break-words font-medium">{goal.description}</p>
          )}
        </div>
        <div className="flex items-center space-x-2 self-start sm:self-auto flex-shrink-0">
          {isCompleted && (
            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-success-100 to-success-200 text-success-800">
              ✓ Completed
            </span>
          )}
          <button
            onClick={() => updateCurrentAmount()}
            className="text-primary-500 hover:text-white hover:bg-primary-500 transition-all p-2 rounded-xl transform hover:-translate-y-0.5"
            title="Update Current Amount"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={deleteSavingsGoal}
            className="text-neutral-400 hover:text-white hover:bg-danger-500 transition-all p-2 rounded-xl transform hover:-translate-y-0.5"
            title="Delete Savings Goal"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
      
      <div className="space-y-3">
        <div className="flex justify-between text-xs sm:text-sm">
          <span className="text-primary-700 font-semibold">Target Amount</span>
          <span className="font-bold text-navy break-all text-right">{formatAmount(goal.targetAmount)}</span>
        </div>
        
        <div className="flex justify-between text-xs sm:text-sm">
          <span className="text-primary-700 font-semibold">Current Amount</span>
          <span className="font-bold text-success-600 break-all text-right">{formatAmount(actualCurrentAmount)}</span>
        </div>
        
        <div className="flex justify-between text-xs sm:text-sm">
          <span className="text-primary-700 font-semibold">Remaining</span>
          <span className={`font-bold break-all text-right ${remaining <= 0 ? 'text-success-600' : 'text-navy'}`}>
            {formatAmount(Math.max(0, remaining))}
          </span>
        </div>
        
        {goal.deadline && (
          <div className="flex justify-between text-xs sm:text-sm">
            <span className="text-primary-700 font-semibold">Target Date</span>
            <span className="font-bold text-navy text-right">{formatDate(goal.deadline)}</span>
          </div>
        )}
        
        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-primary-700 font-semibold mb-2">
            <span>Progress</span>
            <span>{Math.min(progressPercentage, 100).toFixed(0)}%</span>
          </div>
          <div className="w-full bg-neutral-200 rounded-full h-3 shadow-inner">
            <div
              className={`h-3 rounded-full transition-all duration-500 shadow-lg ${getProgressColor()}`}
              style={{ width: `${Math.min(progressPercentage, 100)}%` }}
            ></div>
          </div>
        </div>
        
        {/* Status Messages */}
        {!isCompleted && goal.deadline && (
          <div className="mt-4 space-y-2">
            {daysRemaining > 0 ? (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs space-y-1 sm:space-y-0 bg-primary-100 p-3 rounded-xl">
                <span className="text-primary-800 font-bold">
                  {daysRemaining} days remaining
                </span>
                {remaining > 0 && (
                  <span className="text-primary-700 font-semibold break-all">
                    {formatAmount(remaining / Math.max(daysRemaining, 1))}/day needed
                  </span>
                )}
              </div>
            ) : (
              <div className="p-3 bg-gradient-to-r from-danger-100 to-danger-200 border-2 border-danger-300 rounded-xl">
                <p className="text-xs text-danger-800 font-bold">Target date has passed</p>
              </div>
            )}
          </div>
        )}
        
        {isCompleted && (
          <div className="mt-4 p-3 bg-gradient-to-r from-success-100 to-success-200 border-2 border-success-300 rounded-xl">
            <p className="text-xs text-success-800 font-bold break-words">Goal achieved! Great job saving!</p>
          </div>
        )}
        
        {progressPercentage >= 90 && !isCompleted && (
          <div className="mt-4 p-3 bg-gradient-to-r from-primary-100 to-primary-200 border-2 border-primary-300 rounded-xl">
            <p className="text-xs text-primary-800 font-bold break-words">You're almost there! Just {formatAmount(remaining)} to go!</p>
          </div>
        )}
      </div>
    </div>
  )
}