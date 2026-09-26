import React, { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { getApiUrl, getApiHeaders, handleApiError } from '../utils/apiConfig'
import AlertsList from './AlertsList'

export default function AlertsPanel({ alerts, onAlertsUpdated }) {
  const { getToken } = useAuth()
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState(null)
  const [hasTriedAutoGenerate, setHasTriedAutoGenerate] = useState(false)
  
  const API_BASE = getApiUrl()

  // Auto-generate alerts if none exist and user is authenticated
  useEffect(() => {
    const autoGenerateAlerts = async () => {
      const token = getToken()
      if (!token || alerts.length > 0 || isGenerating || hasTriedAutoGenerate) return

      console.log('🚨 AlertsPanel Debug: Auto-generating alerts...')
      console.log('🌐 AlertsPanel Debug: API URL:', API_BASE)
      console.log('📊 AlertsPanel Debug: Environment:', import.meta.env.MODE)
      console.log('🔄 AlertsPanel Debug: Has tried auto-generate:', hasTriedAutoGenerate)
      console.log('⚙️ AlertsPanel Debug: Is generating:', isGenerating)
      
      setIsGenerating(true)
      setError(null)

      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 30000) // Increased to 30 seconds for production deployment

        const response = await fetch(`${API_BASE}/api/alerts/refresh`, {
          method: 'POST',
          headers: getApiHeaders(token),
          signal: controller.signal
        })

        clearTimeout(timeoutId)

        if (response.ok) {
          const data = await response.json()
          console.log('✅ Alerts generated successfully')
          setHasTriedAutoGenerate(true)
          onAlertsUpdated && onAlertsUpdated(Array.isArray(data.alerts) ? data.alerts : null)
        } else {
          console.log('❌ Failed to generate alerts, status:', response.status)
          if (response.status === 401) {
            setError('Authentication failed. Please try logging in again.')
          } else if (response.status >= 500) {
            setError('Server error. The backend may be starting up. Please wait a moment and try again.')
          } else if (response.status === 0) {
            setError('Network connection error. Please check your internet connection.')
          } else {
            setError(`Failed to generate alerts (Status: ${response.status}). Please try refreshing manually.`)
          }
        }
      } catch (error) {
        console.error('Error generating alerts:', error)
        if (error.name === 'AbortError') {
          setError('Request timeout. The server may be slow to respond. Please try again.')
        } else {
          setError(handleApiError(error, 'Alert generation'))
        }
      } finally {
        setIsGenerating(false)
        setHasTriedAutoGenerate(true)
      }
    }

    // Only auto-generate after a longer delay for deployment stability
    const timer = setTimeout(autoGenerateAlerts, 3000) // Increased delay for production deployment
    return () => clearTimeout(timer)
  }, [alerts.length, getToken, onAlertsUpdated, isGenerating, hasTriedAutoGenerate, API_BASE])

  const handleManualRefresh = async () => {
    const token = getToken()
    if (!token || isGenerating) return

    setIsGenerating(true)
    setError(null)
    
    try {
      console.log('🔄 AlertsPanel Debug: Manual refresh initiated')
      console.log('🌐 AlertsPanel Debug: Using API URL:', API_BASE)
      console.log('📊 AlertsPanel Debug: Current alerts count:', alerts.length)
      console.log('🔑 AlertsPanel Debug: Token exists:', !!token)
      
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 45000) // Increased to 45 seconds for production

      const response = await fetch(`${API_BASE}/api/alerts/refresh`, {
        method: 'POST',
        headers: getApiHeaders(token),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      console.log('📡 AlertsPanel Debug: Response received, status:', response.status)

      if (response.ok) {
        const data = await response.json()
        console.log('✅ Alerts refreshed successfully')
        setError(null)
        setHasTriedAutoGenerate(false) // Reset to allow future auto-generation
        onAlertsUpdated && onAlertsUpdated(Array.isArray(data.alerts) ? data.alerts : null)
      } else {
        console.log('❌ Manual refresh failed, status:', response.status)
        let errorMessage
        
        if (response.status === 401) {
          errorMessage = 'Authentication expired. Please log in again.'
        } else if (response.status === 404) {
          errorMessage = 'Alerts endpoint not found. Please contact support.'
        } else if (response.status >= 500) {
          errorMessage = 'Server error. The backend may be starting up. Please wait a moment and try again.'
        } else if (response.status === 0) {
          errorMessage = 'Network connection failed. Please check your internet connection.'
        } else {
          errorMessage = `Failed to refresh alerts (Status: ${response.status}). Please try again later.`
        }
        
        setError(errorMessage)
      }
    } catch (error) {
      console.error('Error refreshing alerts:', error)
      let errorMessage
      
      if (error.name === 'AbortError') {
        errorMessage = 'Request timeout. The server may be slow to respond. Please try again.'
      } else if (error.message.includes('fetch') || error.message.includes('network')) {
        errorMessage = 'Network connection error. Please check your internet connection and try again.'
      } else {
        errorMessage = handleApiError(error, 'Alert refresh')
      }
      
      setError(errorMessage)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 transition-colors">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Your Alerts ({alerts.length})
            </h3>
            <button
              onClick={handleManualRefresh}
              disabled={isGenerating}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Generating...
                </>
              ) : (
                <>
                  Refresh Alerts
                </>
              )}
            </button>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-start">
                <div className="text-red-500 dark:text-red-400 mr-3 mt-0.5">⚠️</div>
                <div>
                  <h4 className="text-sm font-medium text-red-800 dark:text-red-300">Alert Generation Error</h4>
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1">{error}</p>
                  <button
                    onClick={() => setError(null)}
                    className="text-xs text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 mt-2 underline"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {isGenerating && alerts.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Generating Your Alerts
                </h4>
                <p className="text-gray-600 dark:text-gray-400 max-w-md">
                  We're analyzing your transactions, budgets, and savings goals to create personalized financial insights...
                </p>
                <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                  {import.meta.env.PROD ? 'This may take longer on first deployment' : 'This may take a few moments on first load'}
                </div>
              </div>
            </div>
          ) : (
            <AlertsList alerts={alerts} onAlertsUpdated={onAlertsUpdated} />
          )}

          {/* Network Status Indicator for Production */}
          {import.meta.env.PROD && error && (
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-start">
                <div className="text-blue-500 dark:text-blue-400 mr-2 mt-0.5">ℹ️</div>
                <div className="text-sm">
                  <p className="text-blue-800 dark:text-blue-300 font-medium">Deployment Tip</p>
                  <p className="text-blue-600 dark:text-blue-400 mt-1">
                    If alerts aren't loading, the backend may still be starting up after deployment. 
                    Wait a minute and try refreshing manually.
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}