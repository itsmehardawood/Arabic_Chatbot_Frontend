// pages/homepage.js or app/homepage/page.js (depending on your Next.js version)
'use client'; // Add this if using Next.js 13+ with app directory

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation'; // or 'next/navigation' for app directory
import Link from 'next/link';

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    // Check for authentication token and user_id
    const checkAuth = () => {
      try {
        const accessToken = localStorage.getItem('access_token'); // CONSISTENT with login page
        const userId = localStorage.getItem('user_id');
        
        if (!accessToken || !userId) {
          // Redirect to login if no access_token or user_id
          router.push('/'); // This correctly redirects to login page
          return;
        }

        // Optional: Verify token with your backend
        // You can add an API call here to validate the token
        
        setUser({ id: userId, token: accessToken });
        setIsLoading(false);
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/'); // Redirect to login on error
      }
    };

    checkAuth();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('access_token'); // FIXED: Use 'access_token' to match
    localStorage.removeItem('user_id');
    router.push('/'); // Redirect to login page
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-indigo-300 ">
      {/* Header */}
      <header className=" bg-slate-700 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 bg-slate-700">
          <div className="flex justify-between items-center h-16 ">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900 text-white">
                Arabic Chatbot
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleLogout}
                className="text-red-400 hover:text-gray-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome Section */}
        <div className="text-center mb-12">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-indigo-100 rounded-full mb-4">
              <svg className="w-10 h-10 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
              </svg>
            </div>
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome Back!
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Welcome to your intelligent Arabic Chatbot App. Start a new conversation or manage your subscription
          </p>
        </div>

        {/* Action Buttons */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Chat Button */}
          <Link href="/chat">
            <div className="group cursor-pointer">
              <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-8 text-center border-2 border-transparent hover:border-indigo-200">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6 group-hover:bg-green-200 transition-colors">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  Start Chat
                </h3>
                <p className="text-gray-600 mb-6">
                  Begin a new conversation with the AI assistant and get instant responses
                </p>
                <div className="inline-flex items-center text-green-600 font-semibold group-hover:text-green-700">
                  <span>Start Now</span>
                  <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                  </svg>
                </div>
              </div>
            </div>
          </Link>

          {/* Payments Button */}
          <Link href="/payments">
            <div className="group cursor-pointer">
              <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-8 text-center border-2 border-transparent hover:border-indigo-200">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-6 group-hover:bg-blue-200 transition-colors">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path>
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  Manage Subscription
                </h3>
                <p className="text-gray-600 mb-6">
                  Manage your subscription and payment methods to unlock premium features
                </p>
                <div className="inline-flex items-center text-blue-600 font-semibold group-hover:text-blue-700">
                  <span>Manage Payments</span>
                  <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                  </svg>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Features Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            App Features
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mb-4">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Fast & Smart</h4>
              <p className="text-gray-600">Instant and helpful responses in Arabic</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-orange-100 rounded-full mb-4">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Safe & Secure</h4>
              <p className="text-gray-600">Your data is protected with the highest security standards</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Easy to Use</h4>
              <p className="text-gray-600">Simple and comfortable design for everyone</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}