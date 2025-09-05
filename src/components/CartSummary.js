"use client"

import { useCart } from "../contexts/CartContext"

export default function CartSummary({ showCheckoutButton = true, onCheckout, appliedCoupon, finalTotal }) {
  const { items, getCartTotal } = useCart()

  const subtotal = getCartTotal()
  const shipping = 0 // Always free shipping
  const total = finalTotal ? parseFloat(finalTotal) : (subtotal + shipping)

  return (
    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 sticky top-4">
      <h2 className="text-lg sm:text-xl font-bold mb-4" style={{ fontFamily: "Sugar, serif", color: "#5A0117" }}>
        Order Summary
      </h2>

      <div className="space-y-3 mb-4 sm:mb-6">
        <div className="flex justify-between text-sm sm:text-base" style={{ fontFamily: "Montserrat, sans-serif", color: "#8C6141" }}>
          <span>Subtotal ({items.length} items)</span>
          <span className="font-medium">₹{subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm sm:text-base" style={{ fontFamily: "Montserrat, sans-serif", color: "#8C6141" }}>
          <span>Shipping</span>
          <span className="font-medium text-green-600">Free</span>
        </div>
        {appliedCoupon && (
          <div className="flex justify-between text-sm sm:text-base" style={{ fontFamily: "Montserrat, sans-serif", color: "#10B981" }}>
            <span>Coupon Discount ({appliedCoupon.coupon.code})</span>
            <span className="font-medium">-₹{parseFloat(appliedCoupon.discount.discountAmount).toFixed(2)}</span>
          </div>
        )}
        <div className="border-t pt-3">
          <div
            className="flex justify-between text-lg sm:text-xl font-bold"
            style={{ fontFamily: "Sugar, serif", color: "#5A0117" }}
          >
            <span>Total</span>
            <span>₹{total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Shipping is always free now */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
        <p className="text-xs sm:text-sm text-green-700" style={{ fontFamily: "Montserrat, sans-serif" }}>
          🚚 Free shipping on all orders! No minimum purchase required.
        </p>
      </div>

      {showCheckoutButton && (
        <button
          onClick={onCheckout}
          disabled={items.length === 0}
          className="w-full py-3 sm:py-4 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
          style={{ backgroundColor: "#5A0117", fontFamily: "Montserrat, sans-serif" }}
        >
          Proceed to Checkout
        </button>
      )}
    </div>
  )
}
