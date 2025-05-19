'use client'
import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ChatContainer from '@/components/ChatContainer'

export default function ChatPage() {
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      router.push('/')
    }
  }, [])

  return (
    <div>
      <ChatContainer />
    </div>
  )
}
