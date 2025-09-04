"use client"
import { useState } from "react"
import { useSession } from "next-auth/react"

export default function CouponSection({ cartItems, orderAmount, onCouponApply, onCouponRemove, appliedCoupon }) {
  const { data: session } = useSession()
  const [couponCode, setCouponCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setError("Please enter a coupon code")
      return
    }

    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: couponCode.trim(),
          orderAmount,
          cartItems,
          userId: session?.user?.id
        }),
      })

      const data = await response.json()

      if (data.success) {
        onCouponApply({
          coupon: data.coupon,
          discount: data.discount
        })
        setCouponCode("")
        setError("")
      } else {
        setError(data.error || "Invalid coupon code")
      }
    } catch (error) {
      console.error("Error applying coupon:", error)
      setError("Error applying coupon. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveCoupon = () => {
    onCouponRemove()
    setCouponCode("")
    setError("")
  }

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleApplyCoupon()
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h3 className="text-lg font-bold mb-4" style={{ fontFamily: "Sugar, serif", color: "#5A0117" }}>
        Apply Coupon
      </h3>

      {appliedCoupon ? (
        // Show applied coupon
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-green-600 text-sm font-semibold">✓ Coupon Applied</span>
                </div>
                <p className="text-lg font-bold text-green-700 mt-1">
                  {appliedCoupon.coupon.code}
                </p>
                <p className="text-sm text-green-600">
                  {appliedCoupon.coupon.description}
                </p>
                <div className="mt-2 text-sm text-gray-600">
                  <p>Discount: 
                    {appliedCoupon.coupon.discountType === 'percentage' 
                      ? ` ${appliedCoupon.coupon.discountValue}%`
                      : ` ₹${appliedCoupon.coupon.discountValue}`
                    }
                  </p>
                </div>
              </div>
              <button
                onClick={handleRemoveCoupon}
                className="text-red-600 hover:text-red-700 text-sm font-semibold px-2 py-1 rounded hover:bg-red-50 transition-colors"
                style={{ fontFamily: "Montserrat, sans-serif" }}
              >
                Remove
              </button>
            </div>
          </div>

          {/* Discount Summary */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-green-700">
                Coupon Discount:
              </span>
              <span className="text-lg font-bold text-green-700">
                -₹{appliedCoupon.discount.discountAmount}
              </span>
            </div>
            <div className="flex justify-between items-center mt-1 pt-1 border-t border-green-200">
              <span className="text-sm font-semibold text-green-800">
                Final Amount:
              </span>
              <span className="text-lg font-bold text-green-800">
                ₹{appliedCoupon.discount.finalAmount}
              </span>
            </div>
          </div>
        </div>
      ) : (
        // Show coupon input
        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="flex-1">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => {
                  setCouponCode(e.target.value.toUpperCase())
                  if (error) setError("") // Clear error when user types
                }}
                onKeyPress={handleKeyPress}
                placeholder="Enter coupon code (e.g., SAVE20)"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
                style={{ fontFamily: "Montserrat, sans-serif", focusRingColor: "#5A0117" }}
                disabled={loading}
                maxLength="20"
              />
              {error && (
                <p className="text-red-600 text-sm mt-1" style={{ fontFamily: "Montserrat, sans-serif" }}>
                  {error}
                </p>
              )}
            </div>
            <button
              onClick={handleApplyCoupon}
              disabled={loading || !couponCode.trim()}
              className="px-6 py-2 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: "#5A0117", fontFamily: "Montserrat, sans-serif" }}
            >
              {loading ? "Applying..." : "Apply"}
            </button>
          </div>

          <div className="text-xs text-gray-500" style={{ fontFamily: "Montserrat, sans-serif" }}>
            <p>💡 Have a coupon code? Enter it above to get instant savings!</p>
          </div>
        </div>
      )}
    </div>
  )
}
