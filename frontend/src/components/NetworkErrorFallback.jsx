import React from 'react'

export default function NetworkErrorFallback({ error, onRetry, isRetrying = false }) {
  return (
    <div className="min-h-[400px] flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-6">🌐</div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
          Connection Issue
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
          {error || 'We\'re having trouble connecting to the server. This could be due to:'}
        </p>
        
        <div className="text-sm text-gray-500 dark:text-gray-400 mb-6 text-left">
          <ul className="list-disc list-inside space-y-1">
            <li>Backend server is starting up (this is common on first deployment)</li>
            <li>Temporary network connectivity issue</li>
            <li>Server maintenance or updates in progress</li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={onRetry}
            disabled={isRetrying}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center"
          >
            {isRetrying ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                Retrying...
              </>
            ) : (
              <>
                🔄 Try Again
              </>
            )}
          </button>
          
          <button
            onClick={() => window.location.reload()}
            className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            🔃 Refresh Page
          </button>
        </div>

        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-start">
            <div className="text-left">
              <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-1">
                Deployment Tip
              </h4>
              <p className="text-xs text-blue-600 dark:text-blue-400">
                On platforms like Railway or Heroku, the backend may take 30-60 seconds to start on first access. 
                Please wait a moment and try again.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}