'use client'; // Add this if using Next.js 13+ with app directory

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation'; // or 'next/navigation' for app directory
import Link from 'next/link';

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [username, setUsername] = useState('');
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check for authentication token and user_id
    const checkAuth = async () => {
      try {
        const accessToken = localStorage.getItem('access_token'); 
        const userId = localStorage.getItem('user_id');
        
        if (!accessToken || !userId) {
          router.push('/'); // This correctly redirects to login page
          return;
        }

        // Check admin status by fetching user data from API
        const checkAdminStatus = async (token) => {
          try {
            // Decode JWT token to get user ID
            const decoded = JSON.parse(atob(token.split('.')[1]));
            
            // Try different possible field names for user ID
            const userId = decoded?.user_id || decoded?.id || decoded?.userId || decoded?.sub;
            
            if (!userId) {
              console.warn("No user ID found in token. Token structure:", Object.keys(decoded));
              setIsAdmin(false);
              return;
            }

            // Fetch user document
            const res = await fetch(`https://itsmehardawood-arabic-chatbot.hf.space/users/${userId}`, {
              headers: {
                Authorization: `Bearer ${token}`,
                'ngrok-skip-browser-warning': 'true', // Add this header for ngrok
              },
            });

            if (!res.ok) {
              console.error(`Failed to fetch user: ${res.status} ${res.statusText}`);
              throw new Error(`Failed to fetch user: ${res.status}`);
            }

            const user = await res.json();
            // console.log('User data:', user) // Debug log
            const adminStatus = user?.is_admin === true;
            const user_name = user.username || 'User';
            
            setIsAdmin(adminStatus);
            setUsername(user_name);
            
            // Check subscription status for non-admin users
            if (!adminStatus) {
              await checkSubscriptionStatus(userId, token);
            }
            
            // If user is not admin, fetch their flashcards
            if (!adminStatus) {
              // fetchFlashcards() // Uncomment if you have this function
            } else {
              // If user is admin, fetch documents
              // fetchDocuments() // Uncomment if you have this function
            }
          } catch (err) {
            console.error("Error checking admin status:", err);
            setIsAdmin(false);
            setUsername('');
            
            // If token is invalid, remove it
            if (err.name === 'InvalidTokenError' || err.message.includes('Invalid token')) {
              localStorage.removeItem('access_token');
              router.push('/');
            }
          }
        };

        // Check subscription status
        const checkSubscriptionStatus = async (userId, token) => {
          try {
            const subscriptionRes = await fetch(`https://itsmehardawood-arabic-chatbot.hf.space/subscriptions/${userId}`, {
              headers: {
                Authorization: `Bearer ${token}`,
                'ngrok-skip-browser-warning': 'true',
              },
            });

            // Handle case where subscription doesn't exist (404) or other errors
            if (!subscriptionRes.ok) {
              if (subscriptionRes.status === 404) {
                console.log('No subscription found for user, redirecting to payments');
              } else {
                console.error(`Failed to fetch subscription: ${subscriptionRes.status} ${subscriptionRes.statusText}`);
              }
              // If subscription doesn't exist or API fails, redirect to payments
              setHasActiveSubscription(false);
              router.push('/payments');
              return;
            }

            const subscription = await subscriptionRes.json();
            // console.log('Subscription data:', subscription); // Debug log
            
            // Handle case where API returns empty object or null
            if (!subscription || Object.keys(subscription).length === 0) {
              console.log('Empty subscription data received, redirecting to payments');
              setHasActiveSubscription(false);
              router.push('/payments');
              return;
            }
            
            // Check if subscription is active and not expired
            const isActive = subscription?.status === 'active';
            const currentDate = new Date();
            const endDate = subscription?.end_date ? new Date(subscription.end_date) : null;
            
            // If end_date doesn't exist or is invalid, consider subscription invalid
            const isNotExpired = endDate && !isNaN(endDate.getTime()) && endDate > currentDate;
            
            const hasValidSubscription = isActive && isNotExpired;
            setHasActiveSubscription(hasValidSubscription);
            
            // If no active subscription, redirect to payments page
            if (!hasValidSubscription) {
              console.log('No active subscription found, redirecting to payments');
              console.log('Subscription status:', subscription?.status);
              console.log('End date:', subscription?.end_date);
              console.log('Is expired:', !isNotExpired);
              router.push('/payments');
              return;
            }
            
          } catch (err) {
            console.error("Error checking subscription status:", err);
            setHasActiveSubscription(false);
            // On error, redirect to payments page
            router.push('/payments');
          }
        };

        await checkAdminStatus(accessToken);
        
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
                Arabic AI
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              {isAdmin ? (
                <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                  Admin
                </span>
              ) : (
                <div className="flex items-center space-x-2">
                  <div className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                    </svg>
                  </div>
                  <span className="text-white text-sm font-medium">
                    {username}
                  </span>
                  {hasActiveSubscription && (
                    <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                      Active
                    </span>
                  )}
                </div>
              )}
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
            {/* <div className="inline-flex items-center justify-center w-20 h-20 bg-indigo-100 rounded-full mb-4">
              <svg className="w-10 h-10 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
              </svg>
            </div> */}
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome Back{isAdmin ? ', Admin' : username ? `, ${username}` : ''}!
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Welcome to your intelligent Arabic AI App. Manage learnings{!isAdmin ? ' or manage your subscription' : ''}
          </p>
        </div>

        {/* Action Buttons */}
        <div className={`grid ${isAdmin ? 'md:grid-cols-1 max-w-md mx-auto' : 'md:grid-cols-2'} gap-8 mb-12`}>
          {/* Chat Button */}
          <Link href="/chat">
            <div className="group cursor-pointer">
              <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-8 text-center border-2 border-transparent hover:border-indigo-200">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6 group-hover:bg-green-200 transition-colors">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                  </svg>
                </div>
             {isAdmin &&(
              <div>
               <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  Manage Learnings
                </h3>
                  <p className="text-gray-600 mb-6">
                  Manange Arabic AI Leanrings through your admin Portal
                </p>
                   </div>
             )}  

             {!isAdmin &&(
              <div>
               <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  Start Learning
                </h3>
                <p className="text-gray-600 mb-6">
                  Begin a new conversation with the AI assistant and get instant responses
                </p>
                   </div>
             )}  
              
                <div className="inline-flex items-center text-green-600 font-semibold group-hover:text-green-700">
                  <span>Start Now</span>
                  <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                  </svg>
                </div>
              </div>
            </div>
          </Link>

          {/* Payments Button - Only show for non-admin users */}
          {!isAdmin && (
            <Link href="/payments">
              <div className="group cursor-pointer">
                <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-8 text-center border-2 border-transparent hover:border-indigo-200">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-6 group-hover:bg-blue-200 transition-colors">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
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
          )}
        </div>

        {/* Admin Panel Section - Only show for admin users */}
        {isAdmin && (
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl shadow-lg p-8 mb-12 border border-purple-200">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Admin Panel Features
            </h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-6">
              <div>
                <div className="bg-white rounded-lg p-6 shadow hover:shadow-md transition-shadow cursor-pointer text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mb-4">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path>
                    </svg>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Manage Documents</h4>
                  <p className="text-gray-600">View and manage Documents</p>
                </div>
              </div>
              <div >
                <div className="bg-white rounded-lg p-6 shadow hover:shadow-md transition-shadow cursor-pointer text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-4">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                    </svg>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Add Video</h4>
                  <p className="text-gray-600">Add Video and Descriptions</p>
                </div>
              </div>
            </div>
          </div>
        )}

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

