'use client'

import { useState, useRef, useEffect } from 'react'
import MessageBubble from './ChatBubble'
import { SendHorizonal, Loader2, ChevronDown } from 'lucide-react'

export default function ChatWindow({ messages, onSend, loading }) {
  const [input, setInput] = useState('')
  const [language, setLanguage] = useState('EN')
  const [level, setLevel] = useState('beginner') // default level
  const [diacritics, setDiacritics] = useState(true) // default true
  const bottomRef = useRef(null)

  // Function to send language to API
  const sendLanguageToAPI = async (lang) => {
    try {
      await fetch('https://14ec-110-39-39-254.ngrok-free.app/language', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ language: lang }),
      })
      // Optional: handle response or errors if you want
    } catch (error) {
      console.error('Error sending language:', error)
    }
  }

  const handleLanguageChange = (e) => {
    const selectedLang = e.target.value
    setLanguage(selectedLang)
    sendLanguageToAPI(selectedLang)
  }

const handleSubmit = async (e) => {
  e.preventDefault();
  if (!input.trim()) return;

  const currentInput = input; // store the input value temporarily
  setInput(''); // clear the input immediately
  await onSend({ question: currentInput, diacritics, level }); // send the stored value
};



  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const handleFlashcardSave = (result) => {
    console.log('Flashcard saved in ChatWindow:', result);
    // You could show a toast notification here or update some global state
  }

  return (
    <div className="flex-1 bg-gray-800 text-black flex flex-col min-h-screen md:min-h-0">
      
      {/* Header with Project Name and Language Switcher */}
      <div className="flex justify-between items-center px-4 md:px-6 py-3 bg-gray-900 border-b border-gray-700">
        <h1 className="text-white font-bold text-lg pl-12 py-2">Arabic Chatbot</h1>

        <div className="relative">
          <select
            value={language}
            onChange={handleLanguageChange}
            className="appearance-none bg-gray-700 text-white text-sm pl-3 pr-8 py-2 rounded-md shadow hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
          >
            <option value="English">English</option>
            <option value="Deutsch">Deutsch</option>
            <option value="Arabic">Arabic</option>
          </select>

          <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-white w-4 h-4 pointer-events-none" />
        </div>
      </div>

      {/* Level Buttons & Diacritics Toggle */}
      <div className="flex flex-col md:flex-row md:items-center gap-4 px-4 py-3 bg-gray-900 border-b border-gray-700">

        {/* Level selection: dropdown on small screens, buttons on md+ */}
        <div className="flex flex-col sm:flex-row sm:gap-4 w-full md:w-auto">
          
          {/* Dropdown for small screens */}
          <div className="sm:hidden">
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="w-full bg-gray-700 text-white text-sm px-3 py-2 rounded-md shadow focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              {['beginner', 'intermediate', 'advanced'].map((lvl) => (
                <option key={lvl} value={lvl}>
                  {lvl.charAt(0).toUpperCase() + lvl.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Buttons for medium and larger screens */}
          <div className="hidden sm:flex gap-2">
            {['beginner', 'intermediate', 'advanced'].map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => setLevel(lvl)}
                className={`px-4 py-2 rounded-md font-semibold text-sm whitespace-nowrap ${
                  level === lvl
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {lvl.charAt(0).toUpperCase() + lvl.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Diacritics toggle */}
        <label className="mt-3 md:mt-0 flex items-center gap-2 text-white text-sm select-none">
          <input
            type="checkbox"
            checked={diacritics}
            onChange={() => setDiacritics(!diacritics)}
            className="w-4 h-4 rounded border-gray-600 bg-gray-700"
          />
          Diacritics
        </label>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 space-y-4">
        {messages.map((msg, i) => {
          // Find the corresponding question for bot responses
          let question = null;
          if (msg.type === 'bot') {
            // Look backwards for the most recent user message
            for (let j = i - 1; j >= 0; j--) {
              if (messages[j].type === 'user') {
                question = messages[j].text;
                break;
              }
            }
          }

          return (
            <MessageBubble
              key={i}
              type={msg.type}
              text={msg.text}
              youtube={msg.youtube}
              question={question} // Pass the question for bot responses
              onSave={handleFlashcardSave} // Handle flashcard save callback
            />
          );
        })}

        {loading && (
          <div className="flex items-center gap-2 text-sm text-gray-300 animate-pulse">
            <span className="bg-gray-400 rounded-full w-2 h-2 animate-bounce" style={{ animationDelay: '0s' }} />
            <span className="bg-gray-400 rounded-full w-2 h-2 animate-bounce" style={{ animationDelay: '0.2s' }} />
            <span className="bg-gray-400 rounded-full w-2 h-2 animate-bounce" style={{ animationDelay: '0.4s' }} />
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input Field */}
      <form
        onSubmit={handleSubmit}
        className="bg-gray-700 border-t border-gray-600 px-3 md:px-4 py-3 flex items-center gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask something about the document..."
          className="flex-1 bg-gray-200 text-sm text-black px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-md transition-all shadow disabled:opacity-50"
        >
          {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <SendHorizonal size={18} />}
        </button>
      </form>
    </div>
  )
}