'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '../../components/shared/Header'
import Footer from '../../components/shared/Footer'
import { useAuth } from '../../contexts/AuthContext'
import { toast } from '../../hooks/use-toast'
import { signIn , signOut } from 'next-auth/react'

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(1) // 1: Enter Email, 2: Enter OTP & New Password
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/')
    }
  }, [isAuthenticated, router])


    const handleGoogleLogin = async () => {
    try {
  
      await signIn("google", { callbackUrl: "/" })
    } catch (error) {
      setError("Google login failed. Please try again.")
    }
  }

  const handleFacebookLogin = async () => {
    try {
   
      await signIn("facebook", { callbackUrl: "/" })
    } catch (error) {
      setError("Facebook login failed. Please try again.")
    }
  }


  const handleSendOtp = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await response.json()
      if (data.success) {
        toast({ variant: 'success', title: 'OTP Sent', description: data.message })
        setStep(2)
      } else {
        toast({ variant: 'destructive', title: 'Error', description: data.error })
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Network Error', description: 'Could not connect to server.' })
    } finally {
      setLoading(false)
    }
  }

  const handleUpdatePassword = async (e) => {
    e.preventDefault()
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
    if (!passwordRegex.test(password)) {
      toast({
        variant: 'destructive',
        title: 'Weak Password',
        description: 'Password must be 8+ characters with uppercase, lowercase, number, and special character.',
      })
      return
    }
    if (password !== confirmPassword) {
      toast({ variant: 'destructive', title: 'Error', description: 'Passwords do not match.' })
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/auth/update-password-with-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, password }),
      })
      const data = await response.json()
      if (data.success) {
        toast({ variant: 'success', title: 'Password Updated', description: 'Your password has been updated successfully.' })
        router.push('/login')
      } else {
        toast({ variant: 'destructive', title: 'Error', description: data.error })
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Network Error', description: 'Could not connect to server.' })
    } finally {
      setLoading(false)
    }
  }

  if (isAuthenticated) {
    return <div className="min-h-screen flex items-center justify-center">Redirecting...</div>
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold" style={{ fontFamily: 'Sugar, serif', color: '#5A0117' }}>
              {step === 1 ? 'Forgot Your Password?' : 'Reset Your Password'}
            </h1>
            <p className="mt-2" style={{ fontFamily: 'Montserrat, sans-serif', color: '#8C6141' }}>
              {step === 1
                ? "No worries! Enter your email and we\'ll send you an OTP."
                : 'Enter the OTP from your email and set a new password.'}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-8">
            {step === 1 ? (
              <form className="space-y-6" onSubmit={handleSendOtp}>
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold mb-2" style={{ fontFamily: 'Montserrat, sans-serif', color: '#5A0117' }}>
                    Email Address
                  </label>
                  <input id="email" name="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50" style={{ fontFamily: 'Montserrat, sans-serif' }} placeholder="Enter your email" />
                </div>
                <div>
                  <button type="submit" disabled={loading} className="w-full py-3 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer" style={{ backgroundColor: '#5A0117', fontFamily: 'Montserrat, sans-serif' }}>
                    {loading ? 'Sending OTP...' : 'Send OTP'}
                  </button>
                </div>
              </form>
            ) : (
              <form className="space-y-6" onSubmit={handleUpdatePassword}>
                <div>
                  <label htmlFor="otp" className="block text-sm font-semibold mb-2" style={{ fontFamily: 'Montserrat, sans-serif', color: '#5A0117' }}>
                    OTP
                  </label>
                  <input id="otp" name="otp" type="text" required value={otp} onChange={(e) => setOtp(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50" style={{ fontFamily: 'Montserrat, sans-serif' }} placeholder="Enter the 6-digit OTP" />
                </div>
                <div>
                  <label htmlFor="password" className="block text-sm font-semibold mb-2" style={{ fontFamily: 'Montserrat, sans-serif', color: '#5A0117' }}>
                    New Password
                  </label>
                  <input id="password" name="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50" style={{ fontFamily: 'Montserrat, sans-serif' }} placeholder="e.g., Shubham@3534" />
                </div>
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-semibold mb-2" style={{ fontFamily: 'Montserrat, sans-serif', color: '#5A0117' }}>
                    Confirm New Password
                  </label>
                  <input id="confirmPassword" name="confirmPassword" type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50" style={{ fontFamily: 'Montserrat, sans-serif' }} placeholder="Confirm your new password" />
                </div>
                <div>
                  <button type="submit" disabled={loading} className="w-full py-3 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer" style={{ backgroundColor: '#5A0117', fontFamily: 'Montserrat, sans-serif' }}>
                    {loading ? 'Updating Password...' : 'Update Password'}
                  </button>
                </div>
              </form>
            )}

            <div className="mt-6 text-center">
              <p style={{ fontFamily: 'Montserrat, sans-serif', color: '#8C6141' }}>
                Remember your password?{' '}
                <Link href="/login" className="font-semibold hover:opacity-80 transition-opacity" style={{ color: '#5A0117' }}>
                  Sign in
                </Link>
              </p>
            </div>
                  <div className="mt-6 grid grid-cols-2 gap-3">
                <button onClick={handleGoogleLogin} className="w-full inline-flex justify-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors cursor-pointer" style={{ fontFamily: "Montserrat, sans-serif" }}>
                  <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                  <span className="ml-2">Google</span>
                </button>
                <button onClick={handleFacebookLogin} className="w-full inline-flex justify-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors cursor-pointer" style={{ fontFamily: "Montserrat, sans-serif" }}>
                  <svg className="w-5 h-5" fill="#1877F2" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                  <span className="ml-2">Facebook</span>
                </button>
              </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}