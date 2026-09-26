import React from 'react'
import { useAuth } from '../context/AuthContext'
import { useCurrency } from '../context/CurrencyContext'
import { useDataSync } from '../contexts/DataSyncContext'
import { getApiUrl, getApiHeaders } from '../utils/apiConfig'

export default function TransactionList({ transactions, onTransactionUpdated, showLimited = false }){
  const { isAuthenticated, getToken } = useAuth()
  const { formatAmount } = useCurrency()
  const { transactionOperations, refreshData } = useDataSync()

  const del = async (id)=>{
    try{
      if (isAuthenticated) {
        // Use sync context for authenticated users
        await transactionOperations.delete(id)
        console.log('✅ Transaction deleted via sync context, all data refreshed')
      } else {
        // Fallback for demo mode
        const API_BASE = getApiUrl()
        const url = `${API_BASE}/api/transactions/demo/${id}`
        const response = await fetch(url, {
          method: 'DELETE'
        })

        if (!response.ok) {
          throw new Error('Failed to delete transaction')
        }
        
        // Refresh all data including alerts for demo mode
        await refreshData(['all'])
      }

      onTransactionUpdated && onTransactionUpdated()
    }catch(err){
      console.error(err)
      alert('Failed to delete transaction: ' + err.message)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const displayTransactions = showLimited ? transactions.slice(0, 5) : transactions

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-neutral-100 hover:shadow-2xl transition-all">
      <div className="px-4 sm:px-6 py-5 border-b border-neutral-200 bg-gradient-to-r from-primary-50 to-neutral-50 rounded-t-2xl">
        <h3 className="text-xl sm:text-2xl font-bold text-navy">{showLimited ? 'Recent Transactions' : 'All Transactions'}</h3>
        <p className="text-sm text-primary-700 mt-1 font-medium">
          {showLimited ? 'Your latest financial activities' : `Total: ${transactions.length} transactions`}
        </p>
      </div>
      
      <div className="divide-y divide-neutral-200 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-primary-400 scrollbar-track-neutral-100">
        {displayTransactions.length === 0 ? (
          <div className="px-4 sm:px-6 py-12 text-center">
            <div className="bg-neutral-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
            </div>
            <p className="text-neutral-500 font-medium">No transactions yet. Add your first transaction!</p>
          </div>
        ) : (
          displayTransactions.map(tx=> (
            <div key={tx._id} className="px-4 sm:px-6 py-4 hover:bg-gradient-to-r hover:from-primary-50/50 hover:to-neutral-50/50 transition-all duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                
                {/* Left side - Transaction info */}
                <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
                  <div className={`text-2xl sm:text-3xl flex-shrink-0 p-3 rounded-xl ${
                    tx.type === 'income' ? 'bg-success-100' : 'bg-danger-100'
                  }`}>
                    <span className="text-sm font-semibold">{tx.type === 'income' ? 'IN' : 'EX'}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2">
                      <h4 className="text-base sm:text-lg font-bold text-navy truncate">{tx.category}</h4>
                      <span className={`px-3 py-1.5 text-xs font-bold rounded-full self-start sm:self-auto mt-1 sm:mt-0 ${
                        tx.type === 'income' 
                          ? 'bg-gradient-to-r from-success-100 to-success-200 text-success-800' 
                          : 'bg-gradient-to-r from-danger-100 to-danger-200 text-danger-800'
                      }`}>
                        {tx.type === 'income' ? 'Income' : 'Expense'}
                      </span>
                    </div>
                    {tx.notes && (
                      <p className="text-sm text-neutral-600 mt-1.5 break-words">{tx.notes}</p>
                    )}
                    <p className="text-xs text-neutral-500 mt-1.5 font-medium">
                      {formatDate(tx.date)}
                    </p>
                  </div>
                </div>
                
                {/* Right side - Amount and delete button */}
                <div className="flex items-center justify-between sm:justify-end space-x-4 flex-shrink-0">
                  <div className="text-left sm:text-right">
                    <p className={`text-xl font-bold break-all ${
                      tx.type === 'income' ? 'text-success-600' : 'text-danger-600'
                    }`}>
                      {tx.type === 'income' ? '+' : '-'}{formatAmount(tx.amount)}
                    </p>
                  </div>
                  <button 
                    onClick={()=>del(tx._id)}
                    className="p-2.5 text-neutral-400 hover:text-white hover:bg-danger-500 rounded-xl transition-all duration-200 flex-shrink-0 hover:shadow-lg transform hover:-translate-y-0.5"
                    title="Delete transaction"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      
      {showLimited && transactions.length > 5 && (
        <div className="px-4 sm:px-6 py-4 bg-gradient-to-r from-neutral-50 to-primary-50 text-center border-t border-neutral-200 rounded-b-2xl">
          <p className="text-sm text-primary-700 font-semibold">
            Showing {Math.min(5, transactions.length)} of {transactions.length} transactions
          </p>
        </div>
      )}
    </div>
  )
}
