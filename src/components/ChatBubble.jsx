import { useState } from 'react';

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
  onSave    // Optional callback for handling save success/error
}) {
  const isUser = type === 'user';
  const isBot = type === 'bot';
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

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
      
      const response = await fetch('https://14ec-110-39-39-254.ngrok-free.app/save_flashcard', {
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
        alert(`Flashcard saved with title: "${result.title}"`);
        
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
        
        {/* Save button for bot messages only */}
        {isBot && question && (
          <div className="mt-3 flex justify-end">
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
          </div>
        )}
      </div>
    </div>
  );
}
