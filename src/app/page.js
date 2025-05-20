'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const [isLogin, setIsLogin] = useState(true)
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [language, setlangauge] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (token) {
      router.push('/chat')
    }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!isLogin && password !== confirmPassword) {
      alert("Passwords don't match")
      return
    }

    const endpoint = isLogin
      ? 'https://1b34-110-39-39-254.ngrok-free.app/login'
      : 'https://1b34-110-39-39-254.ngrok-free.app/signup'

    const body = isLogin
      ? { email, password }
      : { username, email, password, confirm_password: confirmPassword , language, is_admin: false }

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })  
      // console.log(body)

      const data = await res.json()

      if (res.ok) {
        if (isLogin && data.access_token) {
          localStorage.setItem('access_token', data.access_token)
          router.push('/chat')
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

  return (
    <div>
      {/* Navbar */}
      <nav className="bg-gradient-to-r from-black bg-gray-900 to-blue-900 p-4 shadow-lg">
        <div className="flex justify-between items-center">
          <div className="text-white font-bold text-2xl">
            Arabic Chatbot
          </div>
  
        </div>
      </nav>

      {/* Main Content */}
      <div className="min-h-screen bg-gradient-to-br flex-col text-black from-gray-800 via-gray-800 to-black-500 flex justify-center items-center px-4">
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
              type="language"
              placeholder="Enter Preffered Language"
              className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={language}
              onChange={(e) => setlangauge(e.target.value)}
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
                ? 'Don’t have an account? Sign Up'
                : 'Already have an account? Login'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
