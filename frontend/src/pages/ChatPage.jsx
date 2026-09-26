import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useDataSync } from '../contexts/DataSyncContext'

export default function ChatPage(){
  const [messages, setMessages] = useState([
    { 
      from: 'bot', 
      text: 'Hi! 👋 I\'m your personal finance assistant. I can help you understand your spending patterns, provide budgeting advice, and answer questions about your financial data. Ask me anything!' 
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const { isAuthenticated, getToken } = useAuth()
  const { syncTrigger, lastSyncTime } = useDataSync()

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3005'

  // Show sync notification when data updates
  useEffect(() => {
    if (syncTrigger > 0) {
      const syncNotification = {
        from: 'bot',
        text: `🔄 Data updated at ${lastSyncTime.toLocaleTimeString()}. I now have the latest information about your transactions!`
      }
      setMessages(prev => [...prev, syncNotification])
    }
  }, [syncTrigger, lastSyncTime])

  const send = async () => {
    if (!input.trim()) return;
    
    console.log('💬 Starting chat message...')
    console.log('🔐 Is authenticated:', isAuthenticated)
    console.log('📍 API_BASE:', API_BASE)
    console.log('💭 User message:', input)
    
    const userMsg = { from: 'user', text: input }
    setMessages(m=>[...m, userMsg])
    setLoading(true)
    
    const userInput = input
    setInput('')
    
    try{
      const headers = {
        'Content-Type': 'application/json'
      }
      
      // Add authentication token if user is logged in
      if (isAuthenticated) {
        const token = getToken()
        console.log('🎫 Token exists:', !!token)
        headers['Authorization'] = `Bearer ${token}`
      }
      
      console.log('📋 Request headers:', headers)
      console.log('🌐 Request URL:', `${API_BASE}/api/chat`)
      
      const response = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ message: userInput })
      })
      
      console.log('📊 Response status:', response.status)
      console.log('📊 Response ok:', response.ok)
      
      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorMessage
          console.log('❌ Chat error data:', errorData)
        } catch (parseError) {
          console.log('❌ Could not parse chat error response:', parseError)
          const errorText = await response.text()
          console.log('❌ Chat error text:', errorText)
        }
        throw new Error(errorMessage)
      }
      
      const data = await response.json()
      console.log('📦 Chat response:', data)
      
      // Check if the response has the expected format
      if (!data.reply && !data.response) {
        console.warn('⚠️ Unexpected response format:', data)
        throw new Error('Invalid response format from server')
      }
      
      const botMessage = data.reply || data.response || 'Sorry, I did not understand that.'
      setMessages(m=>[...m, { from: 'bot', text: botMessage }])
    }catch(err){
      console.error('❌ Chat error:', err)
      console.error('❌ Error name:', err.name)
      console.error('❌ Error message:', err.message)
      
      let errorText = 'Sorry, I encountered an error. Please try again later.'
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        errorText = 'Cannot connect to server. Please check if the backend is running.'
      } else if (err.message.includes('401') || err.message.includes('Unauthorized')) {
        errorText = 'Please log in to use the chat feature.'
      } else if (err.message) {
        errorText = `Error: ${err.message}`
      }
      
      setMessages(m=>[...m, { from: 'bot', text: errorText }])
    }
    setLoading(false)
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  return (
    <div className="app-page">
      <div className="px-4 py-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="app-surface rounded-2xl p-8">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mr-4">
                <span className="text-white text-2xl">🤖</span>
              </div>
              <h1 className="app-display-heading text-4xl text-slate-900">
                AI Finance Assistant
              </h1>
            </div>
            <p className="text-gray-600 dark:text-gray-300 text-lg">Get personalized insights and advice about your spending habits</p>
            <div className="flex justify-center mt-4">
              <div className="w-20 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Chat Container */}
        <div className="app-surface rounded-2xl overflow-hidden">
          {/* Chat Messages */}
          <div className="h-96 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-gray-50/50 to-white/50 dark:from-gray-800/50 dark:to-gray-900/50">
            {messages.map((m, i)=>(
              <div key={i} className={`flex ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl shadow-lg transform hover:scale-105 transition-all duration-300 ${
                  m.from === 'user' 
                    ? 'bg-[#143b2d] text-white' 
                    : 'bg-white/90 dark:bg-gray-700/90 backdrop-blur-sm text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-600'
                }`}>
                  {m.from === 'bot' && (
                    <div className="flex items-center mb-2">
                      <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-2">
                        <span className="text-white text-xs">🤖</span>
                      </div>
                      <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">AI Assistant</span>
                    </div>
                  )}
                  <p className="text-sm leading-relaxed whitespace-pre-line">{m.text}</p>
                  {m.from === 'user' && (
                    <div className="text-xs opacity-75 text-right mt-1">You</div>
                  )}
                </div>
              </div>
            ))}
          
            {loading && (
              <div className="flex justify-start">
                <div className="bg-[#f0eadc] border border-[#dedfd4] rounded-2xl px-4 py-3 shadow-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-[#718064] rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-[#718064] rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-[#718064] rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    <span className="text-sm text-gray-600 dark:text-gray-300 ml-2">AI is thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </div>

        {/* Chat Input */}
        <div className="p-6 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border-t border-gray-200/50 dark:border-gray-700/50">
          <div className="flex space-x-3">
            <input 
              value={input} 
              onChange={e=>setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me about your spending, budgets, or financial advice..."
              className="flex-1 px-4 py-3 bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 shadow-lg"
              disabled={loading}
            />
            <button 
              onClick={send}
              disabled={loading || !input.trim()}
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg transform hover:scale-105 ${
                loading || !input.trim()
                  ? 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed text-gray-500'
                  : 'bg-[#143b2d] hover:bg-[#20533d] text-white'
              }`}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <span className="text-lg">🚀</span>
              )}
            </button>
          </div>
          
          {/* Quick Questions */}
          <div className="mt-4 flex flex-wrap gap-2">
            {[
              "💰 How much did I spend this month?",
              "📊 What's my biggest expense category?", 
              "💡 Give me a savings tip",
              "📈 Show my spending trends"
            ].map((question, idx) => (
              <button
                key={idx}
                onClick={() => setInput(question.replace(/^.+ /, ''))} // Remove emoji
                className="px-3 py-2 text-xs bg-white/60 dark:bg-gray-700/60 hover:bg-white/80 dark:hover:bg-gray-600/80 text-gray-700 dark:text-gray-300 rounded-xl transition-all duration-300 backdrop-blur-sm border border-gray-200/50 dark:border-gray-600/50 hover:shadow-md transform hover:scale-105"
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}
