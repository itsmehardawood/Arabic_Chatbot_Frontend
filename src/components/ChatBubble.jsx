'use client'
import { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

// Function to decode JWT token and extract user_id
const extractUserIdFromToken = () => {
  try {
    // Get token from localStorage
    const token = localStorage.getItem('access_token') || localStorage.getItem('token') || localStorage.getItem('accessToken');
    
    if (!token) {
      console.error('No access token found');
      return null;
    }

    // Decode JWT token (assuming it's a standard JWT)
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    const decodedToken = JSON.parse(jsonPayload);
    
    // Extract user_id (common field names in JWT tokens)
    return decodedToken.user_id || decodedToken.sub || decodedToken.id || decodedToken.userId;
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

export default function MessageBubble({ 
  type, 
  text, 
  youtube, 
  question, // The original question for bot responses
  onSave,   // Optional callback for handling save success/error
  speechSettings = {} // Optional speech settings
}) {
  const isUser = type === 'user';
  const isBot = type === 'bot';
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [voices, setVoices] = useState([]);
  const [selectedVoiceName, setSelectedVoiceName] = useState('');
  
  // Use refs to avoid infinite loops
  const voicesLoadedRef = useRef(false);
  const speechSettingsRef = useRef(speechSettings);

  // Initialize speech synthesis and check if it's supported
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setSpeechSupported(true);
      
      // Cancel any ongoing speech when component mounts
      // This ensures speech doesn't continue from a previous session
      window.speechSynthesis.cancel();
    }
    
    // Add event listeners for page lifecycle events
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
      }
    };
    
    const handleBeforeUnload = () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
    
    // Add event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      // Remove event listeners and stop speech on unmount
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Handle voice loading separately
  useEffect(() => {
    if (!speechSupported) return;
    
    // Update the ref when speechSettings changes
    speechSettingsRef.current = speechSettings;
    
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      
      if (availableVoices.length > 0) {
        setVoices(availableVoices);
        
        // Only set the voice if we haven't already done so
        if (!voicesLoadedRef.current) {
          // Try to use voice from speechSettings if provided
          if (speechSettings.voice && typeof speechSettings.voice === 'object') {
            const matchedVoice = availableVoices.find(v => 
              v.name === speechSettings.voice.name
            );
            
            if (matchedVoice) {
              setSelectedVoiceName(matchedVoice.name);
            } else {
              setSelectedVoiceName(availableVoices[0].name);
            }
          } else {
            setSelectedVoiceName(availableVoices[0].name);
          }
          
          voicesLoadedRef.current = true;
        }
      }
    };
    
    // Load voices initially
    loadVoices();
    
    // Set up the event listener for Chrome
    window.speechSynthesis.onvoiceschanged = loadVoices;
    
    // Clean up event listener
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, [speechSupported]);

  // Fix for Chrome bug where speech synthesis gets paused when tab is inactive
  useEffect(() => {
    if (!speechSupported || !isSpeaking) return;
    
    // Chrome pauses speech when tab becomes inactive
    // This interval keeps it going
    const intervalId = setInterval(() => {
      if (window.speechSynthesis.speaking && window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
    }, 1000);
    
    return () => {
      clearInterval(intervalId);
    };
  }, [speechSupported, isSpeaking]);

  const handleSpeak = () => {
    if (!speechSupported) return;

    if (isSpeaking) {
      // Stop speaking
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    // Create speech utterance
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Find the selected voice by name
    if (selectedVoiceName && voices.length > 0) {
      const voice = voices.find(v => v.name === selectedVoiceName);
      if (voice) {
        utterance.voice = voice;
      }
    }
    
    // Apply rate and pitch settings
    utterance.rate = speechSettingsRef.current.rate || 1.0;
    utterance.pitch = speechSettingsRef.current.pitch || 1.0;

    // Set event handlers
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = (event) => {
      // Ignore 'interrupted' errors as they're expected when stopping speech
      if (event.error !== 'interrupted') {
        console.error('Speech synthesis error:', event);
      }
      setIsSpeaking(false);
    };

    // Speak the text
    window.speechSynthesis.cancel(); // Cancel any previous speech
    window.speechSynthesis.speak(utterance);
  };

  const handleSaveFlashcard = async () => {
    // Extract user_id from token
    const userId = extractUserIdFromToken();
    
    if (!question || !text || !userId) {
      console.error('Missing required data for saving flashcard');
      if (!userId) {
        alert('Please log in to save flashcards');
        return;
      }
      return;
    }

    setIsSaving(true);
    try {
      // Get the token for authorization header
      const token = localStorage.getItem('access_token') || localStorage.getItem('token') || localStorage.getItem('accessToken');
      
      const response = await fetch('https://84f6-110-39-39-254.ngrok-free.app/save_flashcard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`, // Include auth header if needed
        },
        body: JSON.stringify({
          user_id: userId,
          question: question,
          answer: text
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setIsSaved(true);
        console.log('Flashcard saved successfully:', result);
        
        // Show success message to user
        // alert(`Flashcard saved with title: "${result.title}"`);
        
        // Call the optional callback if provided
        if (onSave) {
          onSave(result);
        }
      } else {
        throw new Error(result.message || 'Failed to save flashcard');
      }
    } catch (error) {
      console.error('Error saving flashcard:', error);
      alert(`Failed to save flashcard: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] px-4 py-2 rounded-lg text-sm whitespace-pre-line ${
          isUser ? 'bg-blue-600 text-white' : 'bg-gray-300 text-black'
        }`}
      >
        {text}
        {youtube?.embed_url && (
          <div className="mt-3">
            <iframe
              width="100%"
              height="200"
              src={youtube.embed_url}
              title="YouTube video"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="rounded-md shadow-md"
            />
            <a 
              href={youtube.watch_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 underline text-xs mt-1 block"
            >
              Watch on YouTube
            </a>
          </div>
        )}
        
        {/* Actions row for bot messages only */}
        {isBot && (
          <div className="mt-3 flex justify-end items-center gap-2">
            {/* Text-to-speech button - only show for bot messages and if supported */}
            {speechSupported && (
              <div className="flex items-center gap-2">
                {/* Voice selector dropdown - only show if we have voices */}
                {voices.length > 0 && (
                  <select
                    value={selectedVoiceName}
                    onChange={(e) => setSelectedVoiceName(e.target.value)}
                    className="text-xs bg-gray-200 border border-gray-300 rounded p-1 max-w-[120px] truncate"
                    title="Select voice"
                  >
                    {voices.map((voice) => (
                      <option key={voice.name} value={voice.name}>
                        {voice.name}
                      </option>
                    ))}
                  </select>
                )}
                
                {/* Play/Stop button */}
                <button
                  onClick={handleSpeak}
                  className={`p-1.5 rounded text-xs font-medium transition-colors ${
                    isSpeaking
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-400 hover:bg-gray-500 text-white'
                  }`}
                  title={isSpeaking ? "Stop speaking" : "Listen"}
                >
                  {isSpeaking ? (
                    <VolumeX className="h-3.5 w-3.5" />
                  ) : (
                    <Volume2 className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            )}
            
            {/* Save flashcard button */}
            {question && (
              <button
                onClick={handleSaveFlashcard}
                disabled={isSaving || isSaved}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  isSaved
                    ? 'bg-green-500 text-white cursor-default'
                    : isSaving
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : 'bg-blue-500 hover:bg-blue-600 text-white cursor-pointer'
                }`}
              >
                {isSaving ? (
                  <span className="flex items-center gap-1">
                    <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Saving...
                  </span>
                ) : isSaved ? (
                  <span className="flex items-center gap-1">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Saved
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                    Save as Flashcard
                  </span>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}