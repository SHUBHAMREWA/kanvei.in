"use client"
import { useState, useRef, useEffect } from "react"

export default function OTPVerification({ email, type, onVerify, onResend, loading }) {
  const [otp, setOtp] = useState(["", "", "", "", "", ""])
  const [error, setError] = useState("")
  const [resendTimer, setResendTimer] = useState(60)
  const inputRefs = useRef([])

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendTimer])

  const handleChange = (index, value) => {
    if (value.length > 1) return

    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }

    // Auto-submit when all fields are filled
    if (newOtp.every((digit) => digit !== "") && newOtp.join("").length === 6) {
      handleVerify(newOtp.join(""))
    }
  }

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handleVerify = async (otpCode = otp.join("")) => {
    if (otpCode.length !== 6) {
      setError("Please enter all 6 digits")
      return
    }

    setError("")
    const result = await onVerify(otpCode)
    if (!result.success) {
      setError(result.error)
    }
  }

  const handleResend = async () => {
    setResendTimer(60)
    setError("")
    await onResend()
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-bold mb-2" style={{ fontFamily: "Sugar, serif", color: "#5A0117" }}>
          Enter Verification Code
        </h3>
        <p className="text-sm" style={{ fontFamily: "Montserrat, sans-serif", color: "#8C6141" }}>
          We have sent a 6-digit code to {email}
        </p>
      </div>

      <div className="flex justify-center space-x-3">
        {otp.map((digit, index) => (
          <input
            key={index}
            ref={(el) => (inputRefs.current[index] = el)}
            type="text"
            maxLength="1"
            value={digit}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            className="w-12 h-12 text-center text-xl font-bold border-2 rounded-lg focus:outline-none focus:border-opacity-100"
            style={{
              fontFamily: "Montserrat, sans-serif",
              borderColor: digit ? "#5A0117" : "#DBCCB7",
              color: "#5A0117",
            }}
          />
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-red-600 text-sm text-center" style={{ fontFamily: "Montserrat, sans-serif" }}>
            {error}
          </p>
        </div>
      )}

      <div className="text-center space-y-4">
        <button
          onClick={() => handleVerify()}
          disabled={loading || otp.some((digit) => !digit)}
          className="w-full py-3 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
          style={{ backgroundColor: "#5A0117", fontFamily: "Montserrat, sans-serif" }}
        >
          {loading ? "Verifying..." : "Verify Code"}
        </button>

        <div className="text-sm" style={{ fontFamily: "Montserrat, sans-serif", color: "#8C6141" }}>
          {resendTimer > 0 ? (
            <span>Resend code in {resendTimer}s</span>
          ) : (
            <button
              onClick={handleResend}
              className="font-semibold hover:opacity-80 transition-opacity"
              style={{ color: "#5A0117" }}
            >
              Resend Code
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
