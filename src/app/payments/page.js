// pages/payments.js or app/payments/page.js (depending on your Next.js version)
'use client'; // Add this if using Next.js 13+ with app directory

import { useEffect, useState, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

// Loading component for Suspense fallback
function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading payments...</p>
      </div>
    </div>
  );
}

// Main component that uses useSearchParams
function PaymentsContent() {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [processingTrial, setProcessingTrial] = useState(false);
  const [processingSubscription, setProcessingSubscription] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();

  // Helper function to decode JWT token
  const decodeJWT = (token) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Error decoding JWT:', error);
      return null;
    }
  };

  // Payment capture function with useCallback to prevent dependency issues
  const handlePaymentCapture = useCallback(async (token, payerId) => {
    try {
      setIsLoading(true);
      
      // Get the stored order_id from localStorage
      const storedOrderId = localStorage.getItem('pending_order_id');
      const storedPlan = localStorage.getItem('pending_plan');
      
      if (!storedOrderId) {
        alert('Order ID not found. Please try again.');
        // Clean up URL parameters
        router.replace('/payments');
        return;
      }

      const response = await fetch(`https://5516-110-39-39-254.ngrok-free.app/capture-order/${storedOrderId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({
          payer_id: payerId,
          token: token
        })
      });

      if (response.ok) {
        const captureData = await response.json();
        console.log('Payment captured successfully:', captureData);
        
        // Clean up stored data
        localStorage.removeItem('pending_order_id');
        localStorage.removeItem('pending_plan');
        
        alert(`Payment successful! Your ${storedPlan} subscription is now active.`);
        
        // Redirect to success page or chat after a short delay
        setTimeout(() => {
          router.push('/chat');
        }, 1000);
      } else {
        const errorData = await response.json();
        console.error('Payment capture failed:', errorData);
        alert(`Payment failed: ${errorData.message || 'Please try again'}`);
        
        // Clean up and redirect back to payments after a short delay
        localStorage.removeItem('pending_order_id');
        localStorage.removeItem('pending_plan');
        setTimeout(() => {
          router.replace('/payments');
        }, 1000);
      }
    } catch (error) {
      console.error('Payment capture error:', error);
      alert('Payment processing failed. Please contact support.');
      
      // Clean up and redirect back to payments after a short delay
      localStorage.removeItem('pending_order_id');
      localStorage.removeItem('pending_plan');
      setTimeout(() => {
        router.replace('/payments');
      }, 1000);
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    // Check for authentication
    const checkAuth = () => {
      try {
        const accessToken = localStorage.getItem('access_token');
        
        if (!accessToken) {
          router.push('/');
          return;
        }

        // Decode JWT to get user ID
        const decodedToken = decodeJWT(accessToken);
        
        if (!decodedToken) {
          console.error('Failed to decode token');
          router.push('/');
          return;
        }

        // Your JWT uses 'sub' field for user ID
        const userId = decodedToken.sub;
        
        if (!userId) {
          console.error('No user ID found in token sub field');
          router.push('/');
          return;
        }

        setUser({ id: userId, token: accessToken });
        setIsLoading(false);
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/');
      }
    };

    checkAuth();
  }, [router]);

  // Separate useEffect for handling PayPal return
  useEffect(() => {
    // Check if returning from PayPal payment using Next.js searchParams
    const token = searchParams.get('token');
    const payerId = searchParams.get('PayerID');
    
    if (token && payerId) {
      // Clean the URL immediately and handle payment
      router.replace('/payments');
      handlePaymentCapture(token, payerId);
    }
  }, [searchParams, router, handlePaymentCapture]);

  const handleStartTrial = async () => {
    console.log('Full user object:', user);
    console.log('User ID being sent:', user.id);
    console.log('localStorage user_id:', localStorage.getItem('user_id'));
    
    if (!user?.id) return;

    setProcessingTrial(true);
    try {
      const response = await fetch(`https://5516-110-39-39-254.ngrok-free.app/start-trial/${user.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`,
          'ngrok-skip-browser-warning': 'true'
        }
      });

      if (response.ok) {
        const data = await response.json();
        alert('Free trial started successfully!');
        router.push('/chat');
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.message || 'Failed to start trial'}`);
      }
    } catch (error) {
      console.error('Trial start failed:', error);
      alert('Network error. Please try again.');
    } finally {
      setProcessingTrial(false);
    }
  };

  const handleSubscription = async (plan) => {
    if (!user?.id) return;

    setProcessingSubscription(plan);
    try {
      const response = await fetch('https://5516-110-39-39-254.ngrok-free.app/create-subscription-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`,
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({
          user_id: user.id,
          plan: plan
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Subscription data:', data);
        
        // Check if we received the expected PayPal response
        if (data.order_id && data.approve_url && data.status === 'CREATED') {
          // Store order details for later capture
          localStorage.setItem('pending_order_id', data.order_id);
          localStorage.setItem('pending_plan', plan);
          
          // Redirect to PayPal for payment approval
          window.location.href = data.approve_url;
        } else {
          alert('Invalid response from payment system. Please try again.');
        }
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.message || 'Failed to create subscription'}`);
      }
    } catch (error) {
      console.error('Subscription creation failed:', error);
      alert('Network error. Please try again.');
    } finally {
      setProcessingSubscription('');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">
            {searchParams.get('token') ? 'Processing payment...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-300 text-black">
      {/* Header */}
      <header className=" shadow-sm border-b bg-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 bg-slate-700">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/homepage" className="text-gray-100 hover:text-gray-200">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                </svg>
              </Link>
              <h1 className="text-2xl font-bold text-gray-100">
                Manage Subscription
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/homepage" className="text-gray-100 hover:text-gray-200 transition-colors">
                Home
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Page Title */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Start with a free trial or choose a plan that works best for you
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8">
          {/* Free Trial */}
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center border-2 border-gray-200 hover:border-green-300 transition-colors">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Free Trial</h3>
            <div className="text-4xl font-bold text-green-600 mb-2">Free</div>
            <p className="text-gray-500 mb-6">7 days trial</p>
            
            <ul className="text-left space-y-3 mb-8">
              <li className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                Limited chat messages
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                Basic AI responses
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                No commitment
              </li>
            </ul>

            <button
              onClick={handleStartTrial}
              disabled={processingTrial}
              className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {processingTrial ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Starting Trial...
                </div>
              ) : (
                'Start Free Trial'
              )}
            </button>
          </div>

          {/* Monthly Plan */}
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center border-2 border-indigo-300 relative">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span className="bg-indigo-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                Popular
              </span>
            </div>
            <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-6">
              <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Monthly</h3>
            <div className="text-4xl font-bold text-indigo-600 mb-2">$9.99</div>
            <p className="text-gray-500 mb-6">per month</p>
            
            <ul className="text-left space-y-3 mb-8">
              <li className="flex items-center">
                <svg className="w-5 h-5 text-indigo-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                Unlimited chat messages
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 text-indigo-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                Advanced AI responses
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 text-indigo-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                Priority support
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 text-indigo-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                Cancel anytime
              </li>
            </ul>

            <button
              onClick={() => handleSubscription('monthly')}
              disabled={processingSubscription === 'monthly'}
              className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {processingSubscription === 'monthly' ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Redirecting to PayPal...
                </div>
              ) : (
                'Subscribe Monthly'
              )}
            </button>
          </div>

          {/* Yearly Plan */}
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center border-2 border-gray-200 hover:border-purple-300 transition-colors">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-6">
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Yearly</h3>
            <div className="text-4xl font-bold text-purple-600 mb-1">$99.99</div>
            <div className="text-sm text-green-600 font-semibold mb-1">Save 17%</div>
            <p className="text-gray-500 mb-6">per year</p>
            
            <ul className="text-left space-y-3 mb-8">
              <li className="flex items-center">
                <svg className="w-5 h-5 text-purple-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                Everything in Monthly
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 text-purple-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                Premium AI features
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 text-purple-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                Early access to new features
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 text-purple-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                Best value
              </li>
            </ul>

            <button
              onClick={() => handleSubscription('yearly')}
              disabled={processingSubscription === 'yearly'}
              className="w-full bg-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {processingSubscription === 'yearly' ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Redirecting to PayPal...
                </div>
              ) : (
                'Subscribe Yearly'
              )}
            </button>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-12 text-center">
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-2xl mx-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Why Choose Our Premium Plans?</h3>
            <div className="grid md:grid-cols-2 gap-4 text-left">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <div>
                  <h4 className="font-semibold text-gray-900">24/7 Support</h4>
                  <p className="text-gray-600 text-sm">Get help whenever you need it</p>
                </div>
              </div>
              <div className="flex items-start">
                <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <div>
                  <h4 className="font-semibold text-gray-900">Regular Updates</h4>
                  <p className="text-gray-600 text-sm">Always get the latest features</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// Main exported component with Suspense wrapper
export default function PaymentsPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <PaymentsContent />
    </Suspense>
  );
}