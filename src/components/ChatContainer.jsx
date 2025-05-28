'use client'
import { useState } from 'react'
import {jwtDecode} from 'jwt-decode' // corrected import (default export)
import SidebarUpload from './SideBar'
import ChatWindow from './ChatWindow'

// Helper to extract user_id from token
const getUserIdFromToken = () => {
  const token = localStorage.getItem('access_token')
  if (!token) return null
  try {
    const decoded = jwtDecode(token)
    // Log decoded token to check keys
    console.log('Decoded token:', decoded)
    return decoded.user_id || decoded.sub || null // adjust based on your token
  } catch (err) {
    console.error('Failed to decode token:', err)
    return null
  }
}

export default function ChatContainer() {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [uploadMessage, setUploadMessage] = useState("")

  const handleFileUpload = async (file) => {
    const user_id = getUserIdFromToken()
    if (!user_id) {
      setUploadMessage("User not authenticated.")
      return
    }

    const formData = new FormData()
    formData.append("file", file)

    try {
      const url = `https://5516-110-39-39-254.ngrok-free.app/build_rag?user_id=${encodeURIComponent(user_id)}`

      const res = await fetch(url, {
        method: 'POST',
        body: formData
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || "Upload failed.")
      setUploadMessage(data.message)
    } catch (err) {
      setUploadMessage(`Error: ${err.message}`)
    }
  }

  const handleSendMessage = async ({ question, level, diacritics }) => {
    const user_id = getUserIdFromToken()
    console.log("Sending question:", question)
    console.log("User ID from token:", user_id)
    console.log("Level:", level)
    console.log("Diacritics:", diacritics)

    if (!user_id) {
      setMessages(prev => [...prev, { type: 'bot', text: 'User not authenticated.' }])
      return
    }

    setMessages(prev => [...prev, { type: 'user', text: question }])
    setLoading(true)

    try {
      const bodyPayload = { question, user_id, level, diacritics }
      const res = await fetch('https://5516-110-39-39-254.ngrok-free.app/query_rag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload)
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || "Query failed.")

      // Check if a YouTube video was included
      const hasVideo = data.youtube?.embed_url

      setMessages(prev => [
        ...prev,
        {
          type: 'bot',
          text: data.answer,
          youtube: hasVideo ? data.youtube : null
        }
      ])
    } catch (err) {
      setMessages(prev => [...prev, { type: 'bot', text: `Error: ${err.message}` }])
    }

    setLoading(false)
  }

  return (
    <div className="flex h-screen">
      <SidebarUpload onUpload={handleFileUpload} uploadMessage={uploadMessage} />
      <ChatWindow messages={messages} onSend={handleSendMessage} loading={loading} />
    </div>
  )
}
