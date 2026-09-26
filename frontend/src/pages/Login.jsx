import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function Login(){
  const [isLogin, setIsLogin] = useState(true)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  
  const { login, register, isAuthenticated, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  React.useEffect(() => {
    if (isAuthenticated && !authLoading) {
      console.log('User authenticated, redirecting to dashboard')
      navigate('/dashboard', { replace: true })
    }
  }, [isAuthenticated, authLoading, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')
    
    try {
      if (isLogin) {
        await login(formData.email, formData.password)
      } else {
        await register(formData.name, formData.email, formData.password)
        setSuccess('Account created successfully! Redirecting to dashboard...')
      }
    } catch (err) {
      setError(err.message || 'Authentication failed')
    }
    setLoading(false)
  }

  const handleDemoMode = () => {
    navigate('/dashboard')
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-secondary-50 to-accent-50 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -left-40 w-80 h-80 bg-primary-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
          <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-secondary-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse delay-200"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-accent-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse delay-400"></div>
        </div>
        <div className="text-center relative z-10">
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="absolute inset-0 border-8 border-primary-200 rounded-full"></div>
            <div className="absolute inset-0 border-8 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
            <div className="absolute inset-3 bg-gradient-to-br from-primary-500 to-secondary-600 rounded-full flex items-center justify-center">
              <span className="text-3xl">💰</span>
            </div>
          </div>
          <p className="text-2xl font-bold bg-gradient-to-r from-primary-600 via-secondary-600 to-accent-600 bg-clip-text text-transparent animate-pulse">
            Loading Your Dashboard...
          </p>
          <p className="text-neutral-500 mt-2">Please wait a moment</p>
        </div>
      </div>
    )
  }

  return (
    <div className="app-page flex items-center justify-center relative overflow-hidden p-4">
      {/* Animated background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-secondary-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-300"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-accent-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-500"></div>
        
        {/* Floating particles */}
        <div className="absolute top-20 left-20 w-2 h-2 bg-primary-500 rounded-full animate-bounce-subtle"></div>
        <div className="absolute top-40 right-32 w-3 h-3 bg-secondary-500 rounded-full animate-bounce-subtle delay-200"></div>
        <div className="absolute bottom-32 left-40 w-2 h-2 bg-accent-500 rounded-full animate-bounce-subtle delay-400"></div>
        <div className="absolute bottom-20 right-20 w-3 h-3 bg-primary-500 rounded-full animate-bounce-subtle delay-100"></div>
      </div>

      <div className="max-w-5xl w-full grid lg:grid-cols-2 gap-8 relative z-10">
        {/* Left Side - Branding */}
        <div className="hidden lg:flex flex-col justify-center items-start space-y-8 p-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-[#143b2d] rounded-3xl shadow-xl mb-4 animate-scale-in transform hover:scale-105 transition-transform duration-300">
            <span className="text-5xl animate-bounce-subtle">💰</span>
          </div>
          <div className="space-y-4">
            <h1 className="app-display-heading text-6xl text-[#143b2d] leading-tight animate-slide-in-left">
              Track Expense
            </h1>
            <p className="text-2xl text-neutral-700 font-medium animate-slide-in-left delay-100">
              Smart financial management made simple
            </p>
          </div>
          
          {/* Feature highlights */}
          <div className="space-y-4 animate-slide-in-left delay-200">
            {[
              { icon: '📊', text: 'Visual Analytics & Reports', color: 'from-primary-500 to-primary-600' },
              { icon: '🎯', text: 'Budget & Goals Tracking', color: 'from-secondary-500 to-secondary-600' },
              { icon: '🔒', text: 'Secure & Private', color: 'from-accent-500 to-accent-600' }
            ].map((feature, idx) => (
              <div key={idx} className="flex items-center space-x-4 group">
                <div className={`w-12 h-12 bg-gradient-to-r ${feature.color} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                  <span className="text-2xl">{feature.icon}</span>
                </div>
                <span className="text-lg text-neutral-700 font-medium group-hover:text-primary-600 transition-colors">
                  {feature.text}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="flex items-center justify-center animate-slide-in-right">
          <div className="w-full max-w-md">
            {/* Mobile logo */}
            <div className="lg:hidden text-center mb-8 animate-fade-in">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary-500 via-secondary-600 to-accent-600 rounded-2xl shadow-2xl mb-4 animate-scale-in">
                <span className="text-4xl">💰</span>
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-600 via-secondary-600 to-accent-600 bg-clip-text text-transparent mb-2">
                Track Expense
              </h1>
              <p className="text-neutral-600 text-lg">Smart financial management</p>
            </div>

            <div className="app-surface rounded-3xl p-8 md:p-10 animate-scale-in">
              {/* Tab Switcher */}
              <div className="flex mb-8 bg-gradient-to-r from-primary-50 via-secondary-50 to-accent-50 rounded-2xl p-2">
                <button
                  onClick={() => { setIsLogin(true); setError(''); setSuccess('') }}
                  className={`flex-1 py-3.5 px-6 rounded-xl font-bold transition-all duration-300 ${
                    isLogin 
                      ? 'bg-[#143b2d] text-white shadow-lg transform scale-105' 
                      : 'text-neutral-600 hover:bg-white/50'
                  }`}
                >
                  Login
                </button>
                <button
                  onClick={() => { setIsLogin(false); setError(''); setSuccess('') }}
                  className={`flex-1 py-3.5 px-6 rounded-xl font-bold transition-all duration-300 ${
                    !isLogin 
                      ? 'bg-[#143b2d] text-white shadow-lg transform scale-105' 
                      : 'text-neutral-600 hover:bg-white/50'
                  }`}
                >
                  Sign Up
                </button>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg animate-slide-up">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">⚠️</span>
                    <p className="text-red-800 text-sm font-medium">{error}</p>
                  </div>
                </div>
              )}

              {success && (
                <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-lg animate-slide-up">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">✅</span>
                    <p className="text-green-800 text-sm font-medium">{success}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {!isLogin && (
                  <div className="animate-slide-up">
                    <label className="block text-sm font-bold text-neutral-700 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      placeholder="Enter your full name"
                      className="w-full px-5 py-3.5 bg-white border-2 border-neutral-200 rounded-xl focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 outline-none transition-all text-neutral-800 placeholder-neutral-400 font-medium hover:border-neutral-300"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      required={!isLogin}
                    />
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-bold text-neutral-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="w-full px-5 py-3.5 bg-white border-2 border-neutral-200 rounded-xl focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 outline-none transition-all text-neutral-800 placeholder-neutral-400 font-medium hover:border-neutral-300"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-neutral-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      className="w-full px-5 py-3.5 bg-white border-2 border-neutral-200 rounded-xl focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 outline-none transition-all text-neutral-800 placeholder-neutral-400 font-medium hover:border-neutral-300 pr-12"
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
                    >
                      {showPassword ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {isLogin && (
                  <div className="flex items-center justify-between text-sm">
                    <label className="flex items-center text-neutral-700 cursor-pointer hover:text-primary-600 transition-colors font-medium">
                      <input type="checkbox" className="mr-2 w-4 h-4 accent-primary-600 rounded" />
                      Remember me
                    </label>
                    <a href="#" className="text-primary-600 hover:text-primary-700 font-bold transition-colors">
                      Forgot password?
                    </a>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#143b2d] hover:bg-[#20533d] text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      {isLogin ? 'Logging in...' : 'Creating account...'}
                    </div>
                  ) : (
                    isLogin ? 'Login to Dashboard' : 'Create Account'
                  )}
                </button>
              </form>

              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t-2 border-neutral-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-neutral-500 font-medium">OR</span>
                </div>
              </div>

              <button
                onClick={handleDemoMode}
                className="w-full bg-gradient-to-r from-neutral-100 to-neutral-200 hover:from-neutral-200 hover:to-neutral-300 text-neutral-700 font-bold py-4 px-8 rounded-xl transition-all duration-300 shadow-md hover:shadow-lg border-2 border-neutral-300"
              >
                <span className="flex items-center justify-center">
                  <span className="text-2xl mr-2">🎯</span>
                  Try Demo Mode
                </span>
              </button>

              <p className="text-center text-sm text-neutral-500 mt-6 font-medium">
                {isLogin ? (
                  <>
                    Don't have an account?{' '}
                    <button
                      onClick={() => { setIsLogin(false); setError(''); setSuccess('') }}
                      className="text-primary-600 hover:text-primary-700 font-bold transition-colors"
                    >
                      Sign up now
                    </button>
                  </>
                ) : (
                  <>
                    Already have an account?{' '}
                    <button
                      onClick={() => { setIsLogin(true); setError(''); setSuccess('') }}
                      className="text-primary-600 hover:text-primary-700 font-bold transition-colors"
                    >
                      Login here
                    </button>
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
