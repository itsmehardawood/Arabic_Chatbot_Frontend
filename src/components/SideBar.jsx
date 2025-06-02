'use client'

import { useState, useEffect } from 'react'
import { Upload, FileText, X, Menu, Loader, LogOut, History, BookOpen, Video, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Dialog, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import {jwtDecode} from 'jwt-decode' // corrected import (default export)

export default function SidebarUpload({ onUpload, uploadMessage }) {
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [mounted, setMounted] = useState(false) // Add hydration guard
  const router = useRouter()
  const [chatHistory, setChatHistory] = useState([])
  const [flashcards, setFlashcards] = useState([])
  const [flashcardsLoading, setFlashcardsLoading] = useState(false)
  
  // Add documents state for admin users
  const [documents, setDocuments] = useState([])
  const [documentsLoading, setDocumentsLoading] = useState(false)
  
  // Modal state for flashcard details
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedFlashcard, setSelectedFlashcard] = useState(null)

  // Add Video Modal state
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false)
  const [videoLoading, setVideoLoading] = useState(false)
  const [videoFormData, setVideoFormData] = useState({
    url: '',
    description: ''
  })

  // Helper to extract user_id from token
  const getUserIdFromToken = () => {
    const token = localStorage.getItem('access_token')
    if (!token) return null
    try {
      const decoded = jwtDecode(token)
      return decoded.user_id || decoded.sub || decoded.id || decoded.userId || null
    } catch (err) {
      console.error('Failed to decode token:', err)
      return null
    }
  }

  // Add Video Modal handlers
  const openVideoModal = () => {
    setIsVideoModalOpen(true)
    setVideoFormData({ url: '', description: '' })
  }

  const closeVideoModal = () => {
    setIsVideoModalOpen(false)
    setVideoFormData({ url: '', description: '' })
  }

  const handleVideoFormChange = (field, value) => {
    setVideoFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleVideoSubmit = async () => {
    if (!videoFormData.url.trim()) {
      alert('Please enter a video URL')
      return
    }

    setVideoLoading(true)
    try {
      const token = localStorage.getItem('access_token')
      
      // Log the payload being sent for debugging
      const payload = {
        link: videoFormData.url.trim(), // API expects 'link' not 'url'
        description: videoFormData.description.trim() || null // Send null if empty
      }
      console.log('Sending payload:', payload)
      
      const response = await fetch('https://itsmehardawood-arabic-chatbot.hf.space/add_video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify(payload)
      })

      console.log('Response status:', response.status)
      console.log('Response headers:', [...response.headers.entries()])

      if (!response.ok) {
        // Try to get the full error response
        const errorText = await response.text()
        console.log('Error response text:', errorText)
        
        let errorData
        try {
          errorData = JSON.parse(errorText)
        } catch (parseError) {
          console.log('Could not parse error as JSON:', parseError)
          errorData = { message: errorText }
        }
        
        // Provide detailed error information
        let errorMessage
        if (errorData.detail && Array.isArray(errorData.detail)) {
          // Handle FastAPI validation errors
          errorMessage = errorData.detail.map(err => 
            `${err.msg}: ${err.loc.join('.')} (got: ${JSON.stringify(err.input)})`
          ).join('; ')
        } else {
          errorMessage = errorData.message || 
                        errorData.detail || 
                        errorData.error || 
                        `HTTP ${response.status}: ${response.statusText}`
        }
                            
        console.log('Parsed error data:', errorData)
        throw new Error(errorMessage)
      }

      const result = await response.json()
      console.log('Video added successfully:', result)
      alert('Video added successfully!')
      closeVideoModal()
    } catch (error) {
      console.error('Error adding video:', error)
      
      // Provide more specific error messages
      if (error.message.includes('422')) {
        alert(`Validation Error: The server could not process your request. Please check the video URL format and try again. Details: ${error.message}`)
      } else if (error.message.includes('401')) {
        alert('Authentication Error: Please log in again and try.')
      } else if (error.message.includes('403')) {
        alert('Permission Error: You do not have permission to add videos.')
      } else {
        alert(`Failed to add video: ${error.message}`)
      }
    } finally {
      setVideoLoading(false)
    }
  }

  // Fetch documents for admin users
  const fetchDocuments = async () => {
    const token = localStorage.getItem('access_token')
    
    if (!token || !isAdmin) return

    setDocumentsLoading(true)
    try {
      const response = await fetch('https://itsmehardawood-arabic-chatbot.hf.space/documents', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true',
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch documents: ${response.status}`)
      }

      const data = await response.json()
      // console.log('Fetched documents response:', data)
      
      const documentsArray = data.documents || data || []
      // console.log('Documents array:', documentsArray)
      // console.log('Sample document structure:', documentsArray[0])
      
      setDocuments(documentsArray)
    } catch (error) {
      console.error('Error fetching documents:', error)
      setDocuments([])
    } finally {
      setDocumentsLoading(false)
    }
  }

  // Delete document function
  const deleteDocument = async (documentId) => {
    const token = localStorage.getItem('access_token')
    
    if (!token || !isAdmin) return

    console.log('Attempting to delete document:', documentId)
    console.log('Document ID type:', typeof documentId)

    const confirmDelete = window.confirm('Are you sure you want to delete this document? This action cannot be undone.')
    if (!confirmDelete) return

    try {
      const deleteUrl = `https://itsmehardawood-arabic-chatbot.hf.space/documents/${documentId}`
      console.log('DELETE URL:', deleteUrl)

      const response = await fetch(deleteUrl, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true',
        },
      })

      console.log('Delete response status:', response.status)
      console.log('Delete response headers:', [...response.headers.entries()])

      if (!response.ok) {
        // Try to get the full error response
        const errorText = await response.text()
        console.log('Delete error response text:', errorText)
        
        let errorData
        try {
          errorData = JSON.parse(errorText)
        } catch (parseError) {
          console.log('Could not parse delete error as JSON:', parseError)
          errorData = { message: errorText }
        }
        
        console.log('Parsed delete error data:', errorData)
        throw new Error(errorData.message || errorData.detail || `HTTP ${response.status}: ${response.statusText}`)
      }

      // Check if response has content
      const responseText = await response.text()
      console.log('Delete success response:', responseText)

      alert('Document deleted successfully!')
      // Refresh the documents list
      fetchDocuments()
    } catch (error) {
      console.error('Error deleting document:', error)
      alert(`Failed to delete document: ${error.message}`)
    }
  }
  const fetchFlashcards = async () => {
    const userId = getUserIdFromToken()
    const token = localStorage.getItem('access_token')
    
    if (!userId || !token || isAdmin) return

    setFlashcardsLoading(true)
    try {
      const response = await fetch(`https://itsmehardawood-arabic-chatbot.hf.space/flashcards/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true',
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch flashcards: ${response.status}`)
      }

      const data = await response.json()
      setFlashcards(data.flashcards || [])
    } catch (error) {
      console.error('Error fetching flashcards:', error)
      setFlashcards([])
    } finally {
      setFlashcardsLoading(false)
    }
  }

  // Handle flashcard click to open modal
  const handleFlashcardClick = (flashcard) => {
    setSelectedFlashcard(flashcard)
    setIsModalOpen(true)
  }

  // Close modal
  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedFlashcard(null)
  }

  // Hydration guard effect
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    // Only run after component has mounted on client
    if (!mounted) return
    
    const checkAdminStatus = async () => {
      const token = localStorage.getItem('access_token')

      if (!token) {
        setIsAdmin(false)
        return
      }

      try {
        const decoded = jwtDecode(token)
        
        // Debug: Log the decoded token to see its structure
        // console.log('Decoded token:', decoded)
        
        // Try different possible field names for user ID
        const userId = decoded?.user_id || decoded?.id || decoded?.userId || decoded?.sub
        
        if (!userId) {
          console.warn("No user ID found in token. Token structure:", Object.keys(decoded))
          setIsAdmin(false)
          return
        }

        // Fetch user document
        const res = await fetch(`https://itsmehardawood-arabic-chatbot.hf.space/users/${userId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'ngrok-skip-browser-warning': 'true', // Add this header for ngrok
          },
        })

        if (!res.ok) {
          console.error(`Failed to fetch user: ${res.status} ${res.statusText}`)
          throw new Error(`Failed to fetch user: ${res.status}`)
        }

        const user = await res.json()
        // console.log('User data:', user) // Debug log
        const adminStatus = user?.is_admin === true
        setIsAdmin(adminStatus)
        
        // If user is not admin, fetch their flashcards
        if (!adminStatus) {
          fetchFlashcards()
        } else {
          // If user is admin, fetch documents
          fetchDocuments()
        }
      } catch (err) {
        console.error("Error checking admin status:", err)
        setIsAdmin(false)
        
        // If token is invalid, remove it
        if (err.name === 'InvalidTokenError' || err.message.includes('Invalid token')) {
          localStorage.removeItem('access_token')
          router.push('/')
        }
      }
    }

    checkAdminStatus()
  }, [router, mounted])

  // Effect to fetch flashcards when isAdmin status changes
  useEffect(() => {
    if (mounted && !isAdmin) {
      fetchFlashcards()
    } else if (mounted && isAdmin) {
      fetchDocuments()
    }
  }, [isAdmin, mounted])

  const handleChange = async (e) => {
    const file = e.target.files[0]
    if (file && file.name.endsWith('.docx')) {
      setLoading(true)
      try {
        await onUpload(file)
        setUploadedFiles((prev) => [...prev, file.name])
        // Refresh documents list after successful upload
        if (isAdmin) {
          fetchDocuments()
        }
      } catch (error) {
        console.error('Upload error:', error)
        alert("Upload failed")
      } finally {
        setLoading(false)
        setIsOpen(false)
      }
    } else {
      alert("Please upload a .docx file")
    }
  }

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token')
    }
    router.push('/')
  }

  const handleFlashcardRefresh = () => {
    if (!isAdmin) {
      fetchFlashcards()
    }
  }

  const handleDocumentsRefresh = () => {
    if (isAdmin) {
      fetchDocuments()
    }
  }

  const renderContent = () => {
    if (isAdmin) {
      return (
        <>
          <div className="space-y-3">
            {/* Upload Document Button */}
            <label className="cursor-pointer flex items-center gap-2 bg-blue-600 hover:bg-blue-700 transition-all px-4 py-2 rounded-md text-sm font-medium w-fit disabled:opacity-70">
              {loading ? (
                <>
                  <Loader className="animate-spin" size={16} />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload size={16} />
                  Upload .docx
                </>
              )}
              <input
                type="file"
                accept=".docx"
                onChange={handleChange}
                className="hidden"
                disabled={loading}
              />
            </label>

            {/* Add Video Button */}
            <button
              onClick={openVideoModal}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 transition-all px-4 py-2 rounded-md text-sm font-medium w-fit"
              disabled={videoLoading}
            >
              {videoLoading ? (
                <>
                  <Loader className="animate-spin" size={16} />
                  Adding Video...
                </>
              ) : (
                <>
                  <Video size={16} />
                  Add Video
                </>
              )}
            </button>
          </div>

          <p className="text-xs text-gray-400 mt-3 mb-6">{uploadMessage}</p>

          {/* Documents Section for Admin */}
          <div className="text-sm text-gray-300 space-y-2 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-gray-400">
                <FileText size={16} />
                Uploaded Documents ({documents.length})
              </div>
              <button
                onClick={handleDocumentsRefresh}
                disabled={documentsLoading}
                className="text-xs text-blue-400 hover:text-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {documentsLoading ? (
                  <Loader className="animate-spin" size={12} />
                ) : (
                  'Refresh'
                )}
              </button>
            </div>
            
            {documentsLoading ? (
              <div className="flex items-center gap-2 text-gray-500">
                <Loader className="animate-spin" size={12} />
                Loading documents...
              </div>
            ) : documents.length > 0 ? (
              <ul className="space-y-2 max-h-60 overflow-y-auto">
                {documents.map((document, index) => (
                  <li 
                    key={`document-${document.id || index}`} 
                    className="bg-gray-800 rounded-md p-2 hover:bg-gray-750 transition-colors group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="text-gray-300 font-medium text-xs truncate">
                          {document.filename || document.title || document.name || 'Untitled Document'}
                        </div>
                        {document.file_size && (
                          <div className="text-gray-500 text-xs truncate mt-1">
                            Size: {(document.file_size / 1024).toFixed(1)} KB
                          </div>
                        )}
                        {document.upload_date && (
                          <div className="text-gray-600 text-xs mt-1">
                            {new Date(document.upload_date).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => deleteDocument(document.id)}
                        className="opacity-0 group-hover:opacity-100 ml-2 p-1 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded transition-all"
                        title="Delete document"
                        disabled={!document.id}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-gray-500 italic">No documents uploaded yet.</p>
            )}
          </div>

          <div className="bg-gray-900 rounded-lg p-3 mt-auto">
            <h3 className="text-sm font-semibold text-gray-300 mb-2">Recent Uploads</h3>
            {uploadedFiles.length > 0 ? (
              <ul className="space-y-1 max-h-40 overflow-y-auto text-sm">
                {uploadedFiles.map((name, index) => (
                  <li key={`file-${index}-${name}`} className="flex items-center gap-2 text-gray-300 truncate hover:text-white">
                    <FileText size={14} />
                    {name}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-gray-500 italic">No files uploaded yet.</p>
            )}
          </div>
        </>
      )
    } else {
      return (
        <div className="mt-4 space-y-6">
          {/* Chat History Section */}
          

          {/* Flashcards Section */}
          <div className="text-sm text-gray-300 space-y-2 ">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-gray-400">
                <BookOpen size={16} />
                Saved Flashcards ({flashcards.length})
              </div>
              <button
                onClick={handleFlashcardRefresh}
                disabled={flashcardsLoading}
                className="text-xs text-blue-400 hover:text-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {flashcardsLoading ? (
                  <Loader className="animate-spin" size={12} />
                ) : (
                  'Refresh'
                )}
              </button>
            </div>
            
            {flashcardsLoading ? (
              <div className="flex items-center gap-2 text-gray-500">
                <Loader className="animate-spin" size={12} />
                Loading flashcards...
              </div>
            ) : flashcards.length > 0 ? (
              <ul className="space-y-2 max-h-96 overflow-y-auto">
                {flashcards.map((flashcard, index) => (
                  <li 
                    key={`flashcard-${flashcard._id || index}`} 
                    className="bg-gray-800 rounded-md p-2 hover:bg-gray-750 cursor-pointer transition-colors"
                    onClick={() => handleFlashcardClick(flashcard)}
                  >
                    <div className="text-gray-300 font-medium text-xs truncate">
                      {flashcard.title || 'Untitled Flashcard'}
                    </div>
                    <div className="text-gray-500 text-xs truncate mt-1">
                      {flashcard.question}
                    </div>
                    {flashcard.created_at && (
                      <div className="text-gray-600 text-xs mt-1">
                        {new Date(flashcard.created_at).toLocaleDateString()}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-gray-500 italic">No flashcards saved yet.</p>
            )}
          </div>
        </div>
      )
    }
  }

  // Don't render until mounted to prevent hydration mismatch
  if (!mounted) {
    return null
  }

  return (
    <>
      {/* Hamburger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed top-4 left-4 z-50 bg-gray-900 text-white p-2 rounded-md shadow-lg"
        type="button"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile Sidebar */}
      <div className={`fixed md:hidden top-0 left-0 h-full w-72 bg-gray-950 text-white p-6 z-40 border-r border-gray-800 transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <button
          onClick={handleLogout}
          type="button"
          className="w-full my-10 bg-red-600 text-white py-3 rounded-md flex items-center justify-center gap-2 hover:bg-red-700 transition duration-300"
        >
          <LogOut className="mr-2" size={20} />
          Logout
        </button>
        <h2 className="text-2xl font-bold mb-6">📄Document </h2>
        {renderContent()}
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex flex-col w-72 h-full bg-gray-950 text-white p-6 border-r border-gray-800 shadow-lg">
        <button
          onClick={handleLogout}
          type="button"
          className="w-full my-5 bg-red-600 text-white py-3 px-2 rounded-md flex items-center justify-center gap-2 hover:bg-red-700 transition duration-300"
        >
          <LogOut className="mr-2" size={20} />
          Logout
        </button>
        <h2 className="text-2xl font-bold mb-6">📄 Document </h2>
        {renderContent()}
      </div>

      {/* Add Video Modal */}
      <Transition appear show={isVideoModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-[100]" onClose={closeVideoModal}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/50" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-gray-900 p-6 text-left align-middle shadow-xl transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <Dialog.Title
                      as="h3"
                      className="text-lg font-semibold leading-6 text-white"
                    >
                      Add Video
                    </Dialog.Title>
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md p-2 text-gray-400 hover:text-white hover:bg-gray-800 focus:outline-none"
                      onClick={closeVideoModal}
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <div className="space-y-4">
                    {/* Video URL Input */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Video URL <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="url"
                        value={videoFormData.url}
                        onChange={(e) => handleVideoFormChange('url', e.target.value)}
                        placeholder="https://example.com/video.mp4"
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={videoLoading}
                      />
                    </div>

                    {/* Video Description Input */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Description
                      </label>
                      <textarea
                        value={videoFormData.description}
                        onChange={(e) => handleVideoFormChange('description', e.target.value)}
                        placeholder="Enter a description for this video..."
                        rows={4}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        disabled={videoLoading}
                      />
                    </div>
                  </div>

                  <div className="mt-6 flex gap-3 justify-end">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-gray-600 bg-transparent px-4 py-2 text-sm font-medium text-gray-300 hover:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2"
                      onClick={closeVideoModal}
                      disabled={videoLoading}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={handleVideoSubmit}
                      disabled={videoLoading || !videoFormData.url.trim()}
                    >
                      {videoLoading ? (
                        <>
                          <Loader className="animate-spin mr-2" size={16} />
                          Adding...
                        </>
                      ) : (
                        'Add Video'
                      )}
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Flashcard Detail Modal */}
      <Transition appear show={isModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-[100]" onClose={closeModal}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/50 " />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-gray-900 p-6 text-left align-middle shadow-xl transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <Dialog.Title
                      as="h3"
                      className="text-lg font-semibold leading-6 text-white"
                    >
                      {selectedFlashcard?.title || 'Flashcard Details'}
                    </Dialog.Title>
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md p-2 text-gray-400 hover:text-white hover:bg-gray-800 focus:outline-none"
                      onClick={closeModal}
                    >
                      <X size={20} />
                    </button>
                  </div>

                  {selectedFlashcard && (
                    <div className="space-y-4">
                      {/* Question (User Message Style) */}
                      <div className="flex justify-end">
                        <div className="max-w-[80%] px-4 py-3 rounded-lg bg-blue-600 text-white">
                          <div className="text-sm font-medium mb-1">Question:</div>
                          <div className="text-sm whitespace-pre-line">
                            {selectedFlashcard.question}
                          </div>
                        </div>
                      </div>

                      {/* Answer (Bot Message Style) */}
                      <div className="flex justify-start">
                        <div className="max-w-[80%] px-4 py-3 rounded-lg bg-gray-700 text-white">
                          <div className="text-sm font-medium mb-1">Answer:</div>
                          <div className="text-sm whitespace-pre-line">
                            {selectedFlashcard.answer}
                          </div>
                        </div>
                      </div>

                      {/* Metadata */}
                      <div className="pt-4 border-t border-gray-700">
                        <div className="flex justify-between text-xs text-gray-400">
                          <span>Flashcard ID: {selectedFlashcard._id}</span>
                          {selectedFlashcard.created_at && (
                            <span>
                              Created: {new Date(selectedFlashcard.created_at).toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mt-6 flex justify-end">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                      onClick={closeModal}
                    >
                      Close
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  )
}