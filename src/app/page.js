'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const [isLogin, setIsLogin] = useState(true)
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [language, setLanguage] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check for existing token on component mount
    const checkToken = () => {
      const token = localStorage.getItem('access_token') // FIXED: Use getItem, not setItem
      const userId = localStorage.getItem('user_id')
      
      if (token && userId) {
        // Redirect to homepage if authenticated
        router.push('/homepage')
      } else {
        setIsLoading(false) // Only show form if no token
      }
    }
    
    checkToken()
  }, [router])

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!isLogin && password !== confirmPassword) {
      alert("Passwords don't match")
      return
    }

    const endpoint = isLogin
      ? 'https://84f6-110-39-39-254.ngrok-free.app/login'
      : 'https://84f6-110-39-39-254.ngrok-free.app/signup'

    const body = isLogin
      ? { email, password }
      : { username, email, password, confirm_password: confirmPassword, language, is_admin: false }

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })  

      const data = await res.json()

      if (res.ok) {
        if (isLogin && data.access_token) {
          // Store both token and user_id - FIXED: Use consistent key names
          localStorage.setItem('access_token', data.access_token) // FIXED: Use 'access_token'
          localStorage.setItem('user_id', data.user_id || data.id || '1')
          
          // Immediate redirect after successful login
          router.push('/homepage')
        } else if (!isLogin) {
          alert('Signup successful! You can now log in.')
          setIsLogin(true)
        } else {
          alert('Authentication failed.')
        }
      } else {
        alert(data.detail || 'Request failed')
      }
    } catch (error) {
      console.error(error)
      alert('Something went wrong. Please try again later.')
    }
  }

  // Show loading or nothing while checking token
  if (isLoading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div>
      {/* Navbar */}
      <nav className="bg-slate-700  p-4 shadow-lg">
        <div className="flex justify-between items-center">
          <div className="text-white font-bold text-2xl pl-5">
            Arabic AI
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="min-h-screen  flex-col text-black bg-gradient-to-br from-purple-300 to-indigo-500  flex justify-center items-center px-4">
        <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-lg">
          <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">
            {isLogin ? 'Welcome Back' : 'Create Your Account'}
          </h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <input
                type="text"
                placeholder="Username"
                className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            )}
            <input
              type="email"
              placeholder="Email"
              className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {!isLogin && (
              <input
                type="password"
                placeholder="Confirm Password"
                className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            )}
            {!isLogin && (
              <input
                type="text"
                placeholder="Enter Preferred Language"
                className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                required
              />
            )}
            <button
              type="submit"
              className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition duration-200"
            >
              {isLogin ? 'Login' : 'Sign Up'}
            </button>
          </form>
          <div className="mt-4 text-center">
            <button
              className="text-sm text-blue-600 hover:underline"
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin
                ? `Don't have an account? Sign Up`
                : 'Already have an account? Login'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}