"use client"
import { useState, useEffect } from "react"

export default function CouponForm({ coupon, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    code: "",
    discountType: "percentage",
    discountValue: "",
    minimumOrderAmount: 0,
    usageLimit: "",
    isActive: true,
  })
  
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (coupon) {
      setFormData({
        code: coupon.code || "",
        discountType: coupon.discountType || "percentage",
        discountValue: coupon.discountValue?.toString() || "",
        minimumOrderAmount: coupon.minimumOrderAmount || 0,
        usageLimit: coupon.usageLimit?.toString() || "",
        isActive: coupon.isActive ?? true,
      })
    }
  }, [coupon])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    // Basic validation
    if (!formData.code || !formData.discountValue) {
      alert("Please fill in all required fields")
      setLoading(false)
      return
    }

    const submitData = {
      code: formData.code,
      discountType: "percentage",
      discountValue: parseFloat(formData.discountValue),
      minOrderAmount: parseFloat(formData.minimumOrderAmount) || 0,
      usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : null,
      isActive: formData.isActive,
    }

    await onSubmit(submitData)
    setLoading(false)
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-4" style={{ fontFamily: "Sugar, serif", color: "#5A0117" }}>
        {coupon ? "Edit Coupon" : "Create New Coupon"}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "#5A0117" }}>
              Coupon Code *
            </label>
            <input
              type="text"
              name="code"
              value={formData.code}
              onChange={handleChange}
              placeholder="e.g., SAVE20"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
              style={{ focusRingColor: "#5A0117" }}
              required
              maxLength="20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "#5A0117" }}>
              Status
            </label>
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleChange}
                  className="mr-2"
                />
                Active
              </label>
            </div>
          </div>
        </div>

        {/* Discount Information */}
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "#5A0117" }}>
              Discount Price *
            </label>
            <input
              type="number"
              name="discountValue"
              value={formData.discountValue}
              onChange={handleChange}
              placeholder="20"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
              style={{ focusRingColor: "#5A0117" }}
              required
              min="0"
              max="100"
              step="0.01"
            />
            <p className="text-xs text-gray-600 mt-1">Enter percentage value (e.g., 20 for 20% discount)</p>
          </div>
        </div>

        {/* Order and Usage Limits */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "#5A0117" }}>
              Min Order Amount (₹) *
            </label>
            <input
              type="number"
              name="minimumOrderAmount"
              value={formData.minimumOrderAmount}
              onChange={handleChange}
              placeholder="500"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
              style={{ focusRingColor: "#5A0117" }}
              min="0"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "#5A0117" }}>
              Total Usage Limit
            </label>
            <input
              type="number"
              name="usageLimit"
              value={formData.usageLimit}
              onChange={handleChange}
              placeholder="Leave empty for unlimited"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
              style={{ focusRingColor: "#5A0117" }}
              min="1"
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
            style={{ backgroundColor: "#5A0117", fontFamily: "Montserrat, sans-serif" }}
          >
            {loading ? "Saving..." : coupon ? "Update Coupon" : "Create Coupon"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border-2 font-semibold rounded-lg hover:opacity-80 transition-opacity"
            style={{ borderColor: "#8C6141", color: "#8C6141", fontFamily: "Montserrat, sans-serif" }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
