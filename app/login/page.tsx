"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Brain, User, Users, X } from "lucide-react"
import { BrandLogo } from "@/components/BrandLogo"
import { createSupabaseBrowserClient } from "@/lib/supabase-browser"
import Link from "next/link"

type UserRole = "EDUCATOR" | "CHILD" | null
type ModalStep = "role-selection" | "login" | null

export default function LoginPage() {
  const router = useRouter()
  const [modalStep, setModalStep] = useState<ModalStep>("role-selection")
  const [selectedRole, setSelectedRole] = useState<UserRole>(null)
  const [loginData, setLoginData] = useState({ email: "", password: "", confirmPassword: "", childCode: "" })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string|null>(null)
  const [authMode, setAuthMode] = useState<'signin'|'signup'>('signin')
  const supabase = createSupabaseBrowserClient()
  if (process.env.NODE_ENV !== 'production') {
    // Debug: show first chars of injected env values to verify correctness (should start 'https://' and 'eyJ')
    // Remove after verification.
    // @ts-ignore
    console.info('[Supabase Debug]', {
      urlPrefix: (process.env.NEXT_PUBLIC_SUPABASE_URL || '').slice(0, 30),
      anonKeyStart: (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').slice(0, 3)
    })
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) router.replace('/educator')
    })
  }, [])

  const testConnection = async () => {
    setError(null)
    setLoading(true)
    try {
      console.log('🔗 Testing Supabase connection...')
      
      // Test basic connectivity
      const { data, error } = await supabase.auth.getSession()
      
      if (error) {
        throw new Error(`Connection test failed: ${error.message}`)
      }
      
      console.log('🔗 Connection test successful!')
      setError('✅ Connection test successful! Supabase is reachable.')
      
    } catch (err: any) {
      console.error('🔗 Connection test failed:', err)
      setError(`❌ Connection test failed: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const selectRole = (role: UserRole) => {
    setSelectedRole(role)
    setModalStep("login")
    setAuthMode('signin')
    setError(null)
  }

  const goBack = () => {
    if (modalStep === "login") {
      setModalStep("role-selection")
      setSelectedRole(null)
    } else {
      router.push("/")
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    
    try {
      if (selectedRole === 'EDUCATOR') {
        // Add debugging information
        console.log('🔐 Attempting authentication...')
        console.log('Auth mode:', authMode)
        console.log('Supabase URL configured:', !!process.env.NEXT_PUBLIC_SUPABASE_URL)
        console.log('Supabase key configured:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
        
        if (authMode === 'signup') {
          if (loginData.password !== loginData.confirmPassword) throw new Error('Passwords do not match')
          
          console.log('🔐 Attempting sign up...')
          const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({ 
            email: loginData.email, 
            password: loginData.password 
          })
          
          if (signUpErr) {
            console.error('🔐 Sign up error:', signUpErr)
            throw signUpErr
          }
          if (signUpData.user) {
            console.log('🔐 Sign up successful:', signUpData.user.id)
            router.push('/educator')
          }
        } else {
          console.log('🔐 Attempting sign in...')
          const { data, error: signInError } = await supabase.auth.signInWithPassword({ 
            email: loginData.email, 
            password: loginData.password 
          })
          
          if (signInError) {
            console.error('🔐 Sign in error:', signInError)
            throw signInError
          }
          if (data.user) {
            console.log('🔐 Sign in successful:', data.user.id)
            router.replace('/educator')
          }
        }
      } else if (selectedRole === 'CHILD') {
        // Validate child access code via API
        const response = await fetch('/api/child-auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accessCode: loginData.childCode })
        })
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Invalid access code')
        }
        const childData = await response.json()
        // Store child info in sessionStorage for child dashboard
        sessionStorage.setItem('childProfile', JSON.stringify(childData))
        router.push('/child')
      }
    } catch (err: any) {
      console.error('🔐 Login error:', err)
      
      // Provide more specific error messages for common issues
      if (err.message === 'Failed to fetch') {
        setError('Network error: Unable to connect to authentication service. Please check your internet connection and try again.')
      } else if (err.message?.includes('Invalid login credentials')) {
        setError('Invalid email or password. Please check your credentials and try again.')
      } else if (err.message?.includes('Email not confirmed')) {
        setError('Please check your email and click the confirmation link before signing in.')
      } else if (err.message?.includes('signup_disabled')) {
        setError('New user registration is currently disabled. Please contact support.')
      } else {
        setError(err.message || 'Login failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-50 bg-white border-b-4 border-black shadow-brutal-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <BrandLogo />
            <Link 
              href="/"
              className="text-black hover:text-main font-medium"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </header>

      {/* Login Modal */}
      <div className="w-full max-w-md mx-auto p-4">
        <div className="bg-white border-4 border-black shadow-brutal-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">
              {modalStep === "role-selection" ? "Choose Your Role" : "Sign In"}
            </h2>
            <button onClick={goBack} className="text-gray-500 hover:text-black">
              <X className="h-6 w-6" />
            </button>
          </div>

          {modalStep === "role-selection" && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <p className="text-gray-600">Select your role to continue</p>
              </div>
              <button
                onClick={() => selectRole("EDUCATOR")}
                className="w-full p-4 border-2 border-black bg-chart-1 text-white hover:shadow-brutal transition-all flex items-center justify-center space-x-3"
              >
                <Users className="h-6 w-6" />
                <span className="font-medium">EDUCATOR</span>
              </button>
              <button
                onClick={() => selectRole("CHILD")}
                className="w-full p-4 border-2 border-black bg-chart-2 text-white hover:shadow-brutal transition-all flex items-center justify-center space-x-3"
              >
                <User className="h-6 w-6" />
                <span className="font-medium">CHILD</span>
              </button>
            </div>
          )}

          {modalStep === "login" && (
            <>
              {/* Sample Credentials Info */}
              <div className="mb-4 p-3 bg-blue-50 border-2 border-blue-300 rounded">
                <h3 className="font-bold text-sm text-blue-800 mb-2">🔑 Sample Login Credentials</h3>
                {selectedRole === "EDUCATOR" ? (
                  <div className="text-xs text-blue-700">
                    <p><strong>Email:</strong> ed@mail.com</p>
                    <p><strong>Password:</strong> 1234</p>
                  </div>
                ) : (
                  <div className="text-xs text-blue-700">
                    <p><strong>Aryan's Access Code:</strong> ES5R6P</p>
                  </div>
                )}
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
              {selectedRole === "EDUCATOR" ? (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2">Email</label>
                    <input
                      type="email"
                      value={loginData.email}
                      onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                      className="w-full p-3 border-2 border-black focus:outline-none focus:shadow-brutal"
                      placeholder="ed@mail.com (sample)"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Password</label>
                    <input
                      type="password"
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                      className="w-full p-3 border-2 border-black focus:outline-none focus:shadow-brutal"
                      placeholder="1234 (sample)"
                      required
                    />
                  </div>
                  {authMode === 'signup' && (
                    <div>
                      <label className="block text-sm font-medium mb-2">Confirm Password</label>
                      <input
                        type="password"
                        value={loginData.confirmPassword}
                        onChange={(e) => setLoginData({ ...loginData, confirmPassword: e.target.value })}
                        className="w-full p-3 border-2 border-black focus:outline-none focus:shadow-brutal"
                        required
                      />
                    </div>
                  )}
                </>
              ) : (
                <div>
                  <label className="block text-sm font-medium mb-2">Child Access Code</label>
                  <input
                    type="text"
                    value={loginData.childCode}
                    onChange={(e) => setLoginData({ ...loginData, childCode: e.target.value })}
                    className="w-full p-3 border-2 border-black focus:outline-none focus:shadow-brutal text-center text-lg font-mono"
                    placeholder="ES5R6P (Aryan's account)"
                    required
                  />
                </div>
              )}
              {error && (
                <div>
                  <div className="text-red-600 text-sm font-medium mb-2">{error}</div>
                  {process.env.NODE_ENV !== 'production' && error.includes('Failed to fetch') && (
                    <button
                      type="button"
                      onClick={testConnection}
                      disabled={loading}
                      className="w-full bg-gray-200 text-gray-700 py-2 px-4 border-2 border-gray-400 text-xs font-medium hover:bg-gray-300 disabled:opacity-50"
                    >
                      {loading ? 'Testing...' : 'Test Supabase Connection'}
                    </button>
                  )}
                </div>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-main text-main-foreground py-3 px-6 border-2 border-black shadow-brutal hover:shadow-brutal-lg transition-all font-bold disabled:opacity-50"
              >
                {loading ? 'WORKING...' : authMode === 'signup' ? 'CREATE ACCOUNT' : 'SIGN IN'}
              </button>
              {selectedRole === 'EDUCATOR' && (
                <div className="text-center text-xs font-medium text-gray-600 space-x-2">
                  {authMode === 'signin' ? (
                    <button type="button" onClick={()=>{setAuthMode('signup'); setError(null)}} className="underline">Need an account? Create one</button>
                  ) : (
                    <button type="button" onClick={()=>{setAuthMode('signin'); setError(null)}} className="underline">Have an account? Sign in</button>
                  )}
                </div>
              )}
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
