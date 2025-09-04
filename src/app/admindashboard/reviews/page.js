"use client"
import { useState, useEffect } from "react"
import AdminLayout from "../../../components/shared/AdminLayout"
import { useToast } from "../../../contexts/ToastContext"
import { 
  AiOutlineEye, 
  AiOutlineEdit, 
  AiOutlineDelete, 
  AiOutlinePlus,
  AiFillStar
} from "react-icons/ai"
import { MdSearch, MdRefresh } from "react-icons/md"

export default function AdminReviews() {
  const { showSuccess, showError } = useToast()
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [showAddModal, setShowAddModal] = useState(false)
  const [newReview, setNewReview] = useState({
    productId: "",
    userName: "",
    rating: 5,
    comment: ""
  })
  const [products, setProducts] = useState([])
  const [addingReview, setAddingReview] = useState(false)

  useEffect(() => {
    fetchReviews()
    fetchProducts()
  }, [])

  const fetchReviews = async () => {
    try {
      const res = await fetch("/api/admin/reviews")
      const data = await res.json()
      if (data.success) {
        setReviews(data.reviews)
      }
    } catch (error) {
      console.error("Error fetching reviews:", error)
      showError("Error fetching reviews")
    } finally {
      setLoading(false)
    }
  }

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/products")
      const data = await res.json()
      if (data.success) {
        setProducts(data.products)
      }
    } catch (error) {
      console.error("Error fetching products:", error)
    }
  }

  const handleAddReview = async (e) => {
    e.preventDefault()
    if (!newReview.productId || !newReview.userName.trim() || !newReview.comment.trim()) {
      showError("Please fill all fields")
      return
    }

    setAddingReview(true)
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newReview)
      })

      const data = await res.json()
      if (data.success) {
        showSuccess("✅ Review added successfully!")
        setShowAddModal(false)
        setNewReview({
          productId: "",
          userName: "",
          rating: 5,
          comment: ""
        })
        fetchReviews()
      } else {
        showError(`❌ ${data.error || "Failed to add review"}`)
      }
    } catch (error) {
      console.error("Error adding review:", error)
      showError("❌ Error adding review")
    } finally {
      setAddingReview(false)
    }
  }

  const handleDeleteReview = async (reviewId) => {
    if (!confirm("Are you sure you want to delete this review?")) return

    try {
      const res = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: "DELETE"
      })

      const data = await res.json()
      if (data.success) {
        showSuccess("✅ Review deleted successfully!")
        fetchReviews()
      } else {
        showError(`❌ ${data.error || "Failed to delete review"}`)
      }
    } catch (error) {
      console.error("Error deleting review:", error)
      showError("❌ Error deleting review")
    }
  }

  const filteredReviews = reviews.filter(review =>
    review.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    review.comment?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    review.productId?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getSelectedProduct = () => {
    return products.find(p => p._id === newReview.productId)
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold" style={{ fontFamily: "Sugar, serif", color: "#5A0117" }}>
              Reviews Management
            </h1>
            <p className="mt-2" style={{ fontFamily: "Montserrat, sans-serif", color: "#8C6141" }}>
              Manage product reviews and add admin reviews
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center px-4 py-2 text-white rounded-lg hover:opacity-90 transition-opacity"
              style={{ backgroundColor: "#5A0117", fontFamily: "Montserrat, sans-serif" }}
            >
              <AiOutlinePlus className="w-4 h-4 mr-2" />
              Add Review
            </button>
            <button
              onClick={fetchReviews}
              className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              style={{ fontFamily: "Montserrat, sans-serif" }}
            >
              <MdRefresh className="w-4 h-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <MdSearch className="w-5 h-5 mr-3 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search reviews by user, comment, or product..."
              className="flex-1 outline-none"
              style={{ fontFamily: "Montserrat, sans-serif" }}
            />
          </div>
        </div>

        {/* Reviews Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-xl font-bold" style={{ fontFamily: "Sugar, serif", color: "#5A0117" }}>
              All Reviews ({filteredReviews.length})
            </h2>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: "#5A0117" }}></div>
              <p style={{ fontFamily: "Montserrat, sans-serif", color: "#8C6141" }}>Loading reviews...</p>
            </div>
          ) : filteredReviews.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product & User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rating & Comment
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredReviews.map((review, index) => (
                    <tr key={review._id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-medium" style={{ color: "#5A0117" }}>
                            {review.productId?.name || 'Product Deleted'}
                          </p>
                          <p className="text-sm text-gray-500">
                            by {review.userName}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="flex items-center mb-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <AiFillStar
                                key={star}
                                className={`w-4 h-4 ${star <= review.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                              />
                            ))}
                            <span className="ml-2 text-sm font-medium">({review.rating})</span>
                          </div>
                          <p className="text-sm text-gray-700 max-w-xs truncate">
                            {review.comment}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-500">
                          {formatDate(review.createdAt)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleDeleteReview(review._id)}
                            className="text-red-600 hover:text-red-900 p-2 rounded hover:bg-red-50 transition-colors"
                            title="Delete Review"
                          >
                            <AiOutlineDelete className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <AiFillStar className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No reviews found</h3>
              <p className="mt-1 text-sm text-gray-500">Start by adding a review for a product</p>
            </div>
          )}
        </div>

        {/* Add Review Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
                <h3 className="text-xl font-bold" style={{ fontFamily: "Sugar, serif", color: "#5A0117" }}>
                  👑 Add Admin Review
                </h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-200 transition-colors"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAddReview} className="p-6 space-y-6">
                {/* Product Selection */}
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: "#5A0117" }}>
                    Select Product *
                  </label>
                  <select
                    value={newReview.productId}
                    onChange={(e) => setNewReview(prev => ({ ...prev, productId: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
                    required
                  >
                    <option value="">Choose a product...</option>
                    {products.map((product) => (
                      <option key={product._id} value={product._id}>
                        {product.name} - ₹{product.price}
                      </option>
                    ))}
                  </select>
                  {getSelectedProduct() && (
                    <div className="mt-2 p-3 bg-blue-50 rounded border border-blue-200">
                      <p className="text-sm text-blue-800">
                        📦 Selected: <strong>{getSelectedProduct().name}</strong>
                      </p>
                    </div>
                  )}
                </div>

                {/* Reviewer Name */}
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: "#5A0117" }}>
                    Reviewer Name *
                  </label>
                  <input
                    type="text"
                    value={newReview.userName}
                    onChange={(e) => setNewReview(prev => ({ ...prev, userName: e.target.value }))}
                    placeholder="Enter reviewer name..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
                    required
                  />
                </div>

                {/* Rating */}
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: "#5A0117" }}>
                    Rating *
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setNewReview(prev => ({ ...prev, rating: star }))}
                        className={`text-3xl transition-colors ${
                          star <= newReview.rating ? 'text-yellow-400 hover:text-yellow-500' : 'text-gray-300 hover:text-yellow-300'
                        }`}
                      >
                        ★
                      </button>
                    ))}
                    <span className="ml-3 text-sm font-medium">
                      ({newReview.rating} star{newReview.rating !== 1 ? 's' : ''})
                    </span>
                  </div>
                </div>

                {/* Comment */}
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: "#5A0117" }}>
                    Review Comment *
                  </label>
                  <textarea
                    value={newReview.comment}
                    onChange={(e) => setNewReview(prev => ({ ...prev, comment: e.target.value }))}
                    rows={4}
                    placeholder="Write a detailed review..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
                    required
                  />
                  <p className="text-xs mt-1 text-gray-500">
                    {newReview.comment.length}/500 characters
                  </p>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    disabled={addingReview}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={addingReview || !newReview.productId || !newReview.userName.trim() || !newReview.comment.trim()}
                    className="px-6 py-2 text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: "#5A0117" }}
                  >
                    {addingReview ? (
                      <span className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Adding Review...
                      </span>
                    ) : (
                      "👑 Add Review"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
