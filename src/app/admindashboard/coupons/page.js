"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import AdminLayout from "../../../components/shared/AdminLayout"
import CouponForm from "../../../components/admin/CouponForm"
import { useNotification } from "../../../contexts/NotificationContext"

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState(null)
  const { showNotification } = useNotification()
  const router = useRouter()

  useEffect(() => {
    fetchCoupons()
  }, [])

  const fetchCoupons = async () => {
    try {
      // Use admin bypass route
      const res = await fetch("/api/coupons/admin")
      const data = await res.json()
      if (data.success) {
        setCoupons(data.coupons)
      } else {
        console.error('Failed to fetch coupons:', data.error)
      }
    } catch (error) {
      console.error("Error fetching coupons:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (formData) => {
    try {
      // Use admin bypass route for creation, original route for editing
      const url = editingCoupon ? `/api/coupons/${editingCoupon._id}` : "/api/coupons/admin"
      const method = editingCoupon ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const data = await res.json()
      if (data.success) {
        await fetchCoupons()
        setShowForm(false)
        setEditingCoupon(null)
        
        showNotification(
          editingCoupon ? "Coupon updated successfully!" : "Coupon created successfully!", 
          "success"
        )
      } else {
        showNotification("Error: " + data.error, "error")
      }
    } catch (error) {
      console.error("Error submitting coupon:", error)
      showNotification("Error submitting coupon", "error")
    }
  }

  const handleDelete = async (couponId) => {
    if (!confirm("Are you sure you want to delete this coupon?")) return

    try {
      const res = await fetch(`/api/coupons/${couponId}`, { 
        method: "DELETE",
      })
      const data = await res.json()
      if (data.success) {
        await fetchCoupons()
        showNotification("Coupon deleted successfully!", "success")
      } else {
        showNotification("Error: " + data.error, "error")
      }
    } catch (error) {
      console.error("Error deleting coupon:", error)
      showNotification("Error deleting coupon", "error")
    }
  }

  const handleToggleStatus = async (coupon) => {
    try {
      const res = await fetch(`/api/coupons/${coupon._id}`, { 
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isActive: !coupon.isActive
        }),
      })
      
      const data = await res.json()
      if (data.success) {
        await fetchCoupons()
        showNotification(
          `Coupon ${coupon.isActive ? 'deactivated' : 'activated'} successfully!`, 
          "success"
        )
      } else {
        showNotification("Error: " + data.error, "error")
      }
    } catch (error) {
      console.error("Error toggling coupon status:", error)
      showNotification("Error updating coupon status", "error")
    }
  }

  const handleEdit = (coupon) => {
    setEditingCoupon(coupon)
    setShowForm(true)
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingCoupon(null)
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const isExpired = (coupon) => {
    return new Date() > new Date(coupon.validTo)
  }

  const isNotYetActive = (coupon) => {
    return new Date() < new Date(coupon.validFrom)
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold" style={{ fontFamily: "Sugar, serif", color: "#5A0117" }}>
              Coupons
            </h1>
            <p className="mt-2" style={{ fontFamily: "Montserrat, sans-serif", color: "#8C6141" }}>
              Manage discount coupons and promotional offers
            </p>
          </div>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="w-full sm:w-auto px-6 py-2 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity"
              style={{ backgroundColor: "#5A0117", fontFamily: "Montserrat, sans-serif" }}
            >
              Add Coupon
            </button>
          )}
        </div>

        {/* Form */}
        {showForm && <CouponForm coupon={editingCoupon} onSubmit={handleSubmit} onCancel={handleCancel} />}

        {/* Coupons List */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold" style={{ fontFamily: "Sugar, serif", color: "#5A0117" }}>
              All Coupons ({coupons.length})
            </h2>
          </div>
          <div className="p-4 sm:p-6">
            {loading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="bg-gray-200 rounded h-24 animate-pulse"></div>
                ))}
              </div>
            ) : coupons.length > 0 ? (
              <div className="space-y-4">
                {coupons.map((coupon) => (
                  <div 
                    key={coupon._id} 
                    className={`p-4 border rounded-lg ${
                      !coupon.isActive ? 'bg-gray-50 border-gray-300' : 
                      isExpired(coupon) ? 'bg-red-50 border-red-200' :
                      isNotYetActive(coupon) ? 'bg-yellow-50 border-yellow-200' :
                      'bg-green-50 border-green-200'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3
                            className="text-lg font-bold"
                            style={{ fontFamily: "Sugar, serif", color: "#5A0117" }}
                          >
                            {coupon.code}
                          </h3>
                          
                          {/* Status Badges */}
                          <div className="flex gap-2">
                            {!coupon.isActive && (
                              <span className="px-2 py-1 text-xs font-semibold text-gray-600 bg-gray-200 rounded">
                                Inactive
                              </span>
                            )}
                            {coupon.isActive && isExpired(coupon) && (
                              <span className="px-2 py-1 text-xs font-semibold text-red-600 bg-red-200 rounded">
                                Expired
                              </span>
                            )}
                            {coupon.isActive && isNotYetActive(coupon) && (
                              <span className="px-2 py-1 text-xs font-semibold text-yellow-600 bg-yellow-200 rounded">
                                Not Yet Active
                              </span>
                            )}
                            {coupon.isActive && !isExpired(coupon) && !isNotYetActive(coupon) && (
                              <span className="px-2 py-1 text-xs font-semibold text-green-600 bg-green-200 rounded">
                                Active
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <p className="text-sm mb-2" style={{ fontFamily: "Montserrat, sans-serif", color: "#8C6141" }}>
                          {coupon.description}
                        </p>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="font-semibold" style={{ color: "#5A0117" }}>Discount:</span>
                            <br />
                            {coupon.discountType === 'percentage' 
                              ? `${coupon.discountValue}%`
                              : `₹${coupon.discountValue}`
                            }
                          </div>
                          <div>
                            <span className="font-semibold" style={{ color: "#5A0117" }}>Min Order:</span>
                            <br />
                            ₹{coupon.minOrderAmount}
                          </div>
                          <div>
                            <span className="font-semibold" style={{ color: "#5A0117" }}>Valid Until:</span>
                            <br />
                            {formatDate(coupon.validTo)}
                          </div>
                          <div>
                            <span className="font-semibold" style={{ color: "#5A0117" }}>Used:</span>
                            <br />
                            {coupon.usedCount}/{coupon.usageLimit || '∞'}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(coupon)}
                          className="px-3 py-2 text-sm border-2 font-semibold rounded-md hover:opacity-80 transition-opacity"
                          style={{
                            borderColor: "#8C6141",
                            color: "#8C6141",
                            fontFamily: "Montserrat, sans-serif",
                          }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleToggleStatus(coupon)}
                          className={`px-3 py-2 text-sm font-semibold rounded-md transition-colors ${
                            coupon.isActive 
                              ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                              : 'bg-green-600 hover:bg-green-700 text-white'
                          }`}
                          style={{ fontFamily: "Montserrat, sans-serif" }}
                        >
                          {coupon.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        {coupon.usedCount === 0 && (
                          <button
                            onClick={() => handleDelete(coupon._id)}
                            className="px-3 py-2 text-sm bg-red-600 text-white font-semibold rounded-md hover:bg-red-700 transition-colors"
                            style={{ fontFamily: "Montserrat, sans-serif" }}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-8" style={{ fontFamily: "Montserrat, sans-serif", color: "#8C6141" }}>
                No coupons found. Create your first coupon!
              </p>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
