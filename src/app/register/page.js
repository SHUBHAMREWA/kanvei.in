'use client'
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import Link from "next/link"
import Header from "../../components/shared/Header"
import Footer from "../../components/shared/Footer"
import OTPVerification from "../../components/OTPVerification"
import { useAuth } from "../../contexts/AuthContext"

export default function RegisterPage() {
  const [registrationMethod, setRegistrationMethod] = useState("email") // email, otp, oauth
  const [step, setStep] = useState("form") // form, otp
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [error, setError] = useState("")
  const { register, registerWithOTP, sendOTP, loading, isAuthenticated } = useAuth()
  const router = useRouter()

  // Session protection - redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/')
    }
  }, [isAuthenticated, router])

  // If authenticated, show redirecting message
  if (isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Redirecting to home...</div>
      </div>
    )
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError("Please enter your full name")
      return false
    }
    if (!formData.email.trim()) {
      setError("Please enter your email address")
      return false
    }
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters")
      return false
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      return false
    }
    return true
  }

  const handleEmailRegister = async (e) => {
    e.preventDefault()
    setError("")
    if (!validateForm()) return
    const result = await register(formData.name, formData.email, formData.password)
    if (result.success) {
      router.push("/")
    } else {
      setError(result.error)
    }
  }

  const handleOTPRegister = async (e) => {
    e.preventDefault()
    setError("")
    if (!validateForm()) return
    const result = await sendOTP(formData.email, "register")
    if (result.success) {
      setStep("otp")
    } else {
      setError(result.error)
    }
  }

  const handleOTPVerify = async (otp) => {
    const result = await registerWithOTP(formData.name, formData.email, formData.password, otp)
    if (result.success) {
      router.push("/")
    }
    return result
  }

  const handleOTPResend = async () => {
    return await sendOTP(formData.email, "register")
  }

  const handleGoogleRegister = async () => {
    try {
      setError("")
      await signIn("google", { callbackUrl: "/" })
    } catch (error) {
      setError("Google registration failed. Please try again.")
    }
  }

  const handleFacebookRegister = async () => {
    try {
      setError("")
      await signIn("facebook", { callbackUrl: "/" })
    } catch (error) {
      setError("Facebook registration failed. Please try again.")
    }
  }

  if (step === "otp") {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full">
            <div className="bg-white rounded-lg shadow-md p-8">
              <OTPVerification
                email={formData.email}
                type="register"
                onVerify={handleOTPVerify}
                onResend={handleOTPResend}
                loading={loading}
              />
              <div className="mt-6 text-center">
                <button
                  onClick={() => setStep("form")}
                  className="text-sm font-semibold hover:opacity-80 transition-opacity cursor-pointer"
                  style={{ color: "#5A0117", fontFamily: "Montserrat, sans-serif" }}
                >
                  ← Back to registration
                </button>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold" style={{ fontFamily: "Sugar, serif", color: "#5A0117" }}>
              Join Kanvei
            </h1>
            <p className="mt-2" style={{ fontFamily: "Montserrat, sans-serif", color: "#8C6141" }}>
              Create your account to start shopping
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="flex mb-6 border-b">
              <button
                onClick={() => setRegistrationMethod("email")}
                className={`flex-1 py-2 px-4 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
                  registrationMethod === "email" ? "border-current" : "border-transparent"
                }`}
                style={{
                  color: registrationMethod === "email" ? "#5A0117" : "#8C6141",
                  fontFamily: "Montserrat, sans-serif",
                }}
              >
                Email & Password
              </button>
              <button
                onClick={() => setRegistrationMethod("otp")}
                className={`flex-1 py-2 px-4 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
                  registrationMethod === "otp" ? "border-current" : "border-transparent"
                }`}
                style={{
                  color: registrationMethod === "otp" ? "#5A0117" : "#8C6141",
                  fontFamily: "Montserrat, sans-serif",
                }}
              >
                Email OTP
              </button>
            </div>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-600 text-sm" style={{ fontFamily: "Montserrat, sans-serif" }}>
                  {error}
                </p>
              </div>
            )}
            <form
              onSubmit={registrationMethod === "email" ? handleEmailRegister : handleOTPRegister}
              className="space-y-6"
            >
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ fontFamily: "Montserrat, sans-serif", color: "#5A0117" }}>
                  Full Name
                </label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} required className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50" style={{ fontFamily: "Montserrat, sans-serif" }} placeholder="Enter your full name" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ fontFamily: "Montserrat, sans-serif", color: "#5A0117" }}>
                  Email Address
                </label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} required className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50" style={{ fontFamily: "Montserrat, sans-serif" }} placeholder="Enter your email" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ fontFamily: "Montserrat, sans-serif", color: "#5A0117" }}>
                  Password
                </label>
                <input type="password" name="password" value={formData.password} onChange={handleChange} required className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50" style={{ fontFamily: "Montserrat, sans-serif" }} placeholder="Create a password (min 6 characters)" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ fontFamily: "Montserrat, sans-serif", color: "#5A0117" }}>
                  Confirm Password
                </label>
                <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50" style={{ fontFamily: "Montserrat, sans-serif" }} placeholder="Confirm your password" />
              </div>
              <button type="submit" disabled={loading} className="w-full py-3 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer" style={{ backgroundColor: "#5A0117", fontFamily: "Montserrat, sans-serif" }}>
                {loading
                  ? registrationMethod === "email"
                    ? "Creating Account..."
                    : "Sending OTP..."
                  : registrationMethod === "email"
                    ? "Create Account"
                    : "Send OTP & Register"}
              </button>
            </form>
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white" style={{ color: "#8C6141", fontFamily: "Montserrat, sans-serif" }}>
                    Or register with
                  </span>
                </div>
              </div>
              <div className="mt-6 grid grid-cols-2 gap-3">
                <button onClick={handleGoogleRegister} className="w-full inline-flex justify-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors cursor-pointer" style={{ fontFamily: "Montserrat, sans-serif" }}>
                  <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                  <span className="ml-2">Google</span>
                </button>
                <button onClick={handleFacebookRegister} className="w-full inline-flex justify-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors cursor-pointer" style={{ fontFamily: "Montserrat, sans-serif" }}>
                  <svg className="w-5 h-5" fill="#1877F2" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                  <span className="ml-2">Facebook</span>
                </button>
              </div>
            </div>
            <div className="mt-6 text-center">
              <p style={{ fontFamily: "Montserrat, sans-serif", color: "#8C6141" }}>
                Already have an account?{" "}
                <Link href="/login" className="font-semibold hover:opacity-80 transition-opacity" style={{ color: "#5A0117" }}>
                  Sign in
                </Link>
              </p>
              <p className="mt-2" style={{ fontFamily: "Montserrat, sans-serif", color: "#8C6141" }}>
                <Link href="/forgot-password" className="font-semibold hover:opacity-80 transition-opacity" style={{ color: "#5A0117" }}>
                  Forgot Password?
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