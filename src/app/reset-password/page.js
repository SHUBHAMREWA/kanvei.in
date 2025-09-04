'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Header from '../../components/shared/Header'
import Footer from '../../components/shared/Footer'
import { useAuth } from '../../contexts/AuthContext'
import { toast } from '../../hooks/use-toast'

function ResetPasswordComponent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { isAuthenticated } = useAuth()

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/')
    }
  }, [isAuthenticated, router])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    if (!token) {
      setError('Invalid or missing reset token.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          variant: 'success',
          title: 'Password Reset Successful',
          description: 'You can now log in with your new password.',
        })
        router.push('/login')
      } else {
        setError(data.error || 'Failed to reset password.')
        toast({
          variant: 'destructive',
          title: 'Error',
          description: data.error || 'Failed to reset password.',
        })
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
      toast({
        variant: 'destructive',
        title: 'Network Error',
        description: 'Could not connect to the server.',
      })
    } finally {
      setLoading(false)
    }
  }

  if (isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Redirecting...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold" style={{ fontFamily: 'Sugar, serif', color: '#5A0117' }}>
              Reset Your Password
            </h1>
            <p className="mt-2" style={{ fontFamily: 'Montserrat, sans-serif', color: '#8C6141' }}>
              Choose a new password for your account.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-8">
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-semibold mb-2"
                  style={{ fontFamily: 'Montserrat, sans-serif', color: '#5A0117' }}
                >
                  New Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                  placeholder="Enter your new password"
                />
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-semibold mb-2"
                  style={{ fontFamily: 'Montserrat, sans-serif', color: '#5A0117' }}
                >
                  Confirm New Password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                  placeholder="Confirm your new password"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-600 text-sm text-center" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    {error}
                  </p>
                </div>
              )}

              <div>
                <button
                  type="submit"
                  disabled={loading || !token}
                  className="w-full py-3 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
                  style={{ backgroundColor: '#5A0117', fontFamily: 'Montserrat, sans-serif' }}
                >
                  {loading ? 'Resetting Password...' : 'Reset Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordComponent />
    </Suspense>
  )
}
