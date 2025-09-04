"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import Link from "next/link"
import Header from "../../components/shared/Header"
import Footer from "../../components/shared/Footer"
import { useAuth } from "../../contexts/AuthContext"

export default function AdminLoginPage() {
  const { data: session, status } = useSession()
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [error, setError] = useState("")
  const { login, logout, loading, user } = useAuth()
  const router = useRouter()

  // Session protection - redirect if already logged in as non-admin
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      // Only redirect to home page if user is not an admin
      if (session.user.role !== 'admin') {
        console.log('✅ Non-admin user logged in, redirecting to home')
        router.replace('/')
      } else {
        // If user is admin, redirect to admin dashboard
        console.log('✅ Admin user logged in, redirecting to dashboard')
        router.replace('/admindashboard')
      }
    }
  }, [status, router, session])

  // Loading state during session check
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  // If authenticated, show redirecting message
  if (status === 'authenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Redirecting...</div>
      </div>
    )
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleAdminLogin = async (e) => {
     
    e.preventDefault()
    setError("")

    const result = await login(formData.email, formData.password)

    if (result.success) {
      // 获取最新的用户信息
      const currentUser = result.user || user
      
      // Check if user is admin
      if (currentUser && currentUser.role === 'admin') {
        router.push("/admindashboard")
      } else {
        setError("You do not have admin privileges")
        // Logout non-admin users
        logout()
      }
    } else {
      setError(result.error)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold" style={{ fontFamily: "Sugar, serif", color: "#5A0117" }}>
              Admin Login
            </h1>
            <p className="mt-2" style={{ fontFamily: "Montserrat, sans-serif", color: "#8C6141" }}>
              Sign in to your Kanvei admin account
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-8">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-600 text-sm" style={{ fontFamily: "Montserrat, sans-serif" }}>
                  {error}
                </p>
              </div>
            )}

            <form onSubmit={handleAdminLogin} className="space-y-6">
              <div>
                <label
                  className="block text-sm font-semibold mb-2"
                  style={{ fontFamily: "Montserrat, sans-serif", color: "#5A0117" }}
                >
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
                  style={{ fontFamily: "Montserrat, sans-serif" }}
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <label
                  className="block text-sm font-semibold mb-2"
                  style={{ fontFamily: "Montserrat, sans-serif", color: "#5A0117" }}
                >
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
                  style={{ fontFamily: "Montserrat, sans-serif" }}
                  placeholder="Enter your password"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
                style={{ backgroundColor: "#5A0117", fontFamily: "Montserrat, sans-serif" }}
              >
                {loading ? "Signing In..." : "Sign In"}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p style={{ fontFamily: "Montserrat, sans-serif", color: "#8C6141" }}>
                <Link
                  href="/"
                  className="font-semibold hover:opacity-80 transition-opacity"
                  style={{ color: "#5A0117" }}
                >
                  Back to Home
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}