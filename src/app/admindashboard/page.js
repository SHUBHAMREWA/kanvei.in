"use client"
import { useState, useEffect } from "react"
import AdminLayout from "../../components/shared/AdminLayout"
import StatsCard from "../../components/admin/StatsCard"
import ProtectedRoute from "../../components/ProtectedRoute"

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalCategories: 0,
    totalOrders: 0,
    totalUsers: 0,
  })
  const [recentOrders, setRecentOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch products count
        const productsRes = await fetch("/api/products")
        const productsData = await productsRes.json()
        const totalProducts = productsData.success ? productsData.products.length : 0

        // Fetch categories count
        const categoriesRes = await fetch("/api/categories")
        const categoriesData = await categoriesRes.json()
        const totalCategories = categoriesData.success ? categoriesData.categories.length : 0

        // Fetch orders count
        const ordersRes = await fetch("/api/orders")
        const ordersData = await ordersRes.json()
        const totalOrders = ordersData.success ? ordersData.orders.length : 0
        const recentOrders = ordersData.success ? ordersData.orders.slice(0, 5) : []

        setStats({
          totalProducts,
          totalCategories,
          totalOrders,
          totalUsers: 0, // Will be implemented with user management
        })
        setRecentOrders(recentOrders)
      } catch (error) {
        console.error("Error fetching stats:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  return (
    <ProtectedRoute adminOnly={true}>
      <AdminLayout>
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold" style={{ fontFamily: "Sugar, serif", color: "#5A0117" }}>
              Dashboard
            </h1>
            <p className="mt-2" style={{ fontFamily: "Montserrat, sans-serif", color: "#8C6141" }}>
              Welcome to Kanvei Admin Panel
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatsCard 
              title="Total Products" 
              value={stats.totalProducts} 
              icon="📦" 
              color="#5A0117" 
              href="/admindashboard/products"
            />
            <StatsCard 
              title="Categories" 
              value={stats.totalCategories} 
              icon="📁" 
              color="#8C6141" 
              href="/admindashboard/categories"
            />
            <StatsCard 
              title="Orders" 
              value={stats.totalOrders} 
              icon="🛒" 
              color="#5A0117" 
              href="/admindashboard/orders"
            />
            <StatsCard 
              title="Users" 
              value={stats.totalUsers} 
              icon="👥" 
              color="#8C6141" 
              href="/admindashboard/users"
            />
          </div>

          {/* Recent Orders */}
          <div className="bg-white rounded-lg shadow-md">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold" style={{ fontFamily: "Sugar, serif", color: "#5A0117" }}>
                Recent Orders
              </h2>
            </div>
            <div className="p-6">
              {loading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="bg-gray-200 rounded h-16 animate-pulse"></div>
                  ))}
                </div>
              ) : recentOrders.length > 0 ? (
                <div className="space-y-4">
                  {recentOrders.map((order) => (
                    <div key={order._id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-semibold" style={{ fontFamily: "Montserrat, sans-serif", color: "#5A0117" }}>
                          Order {order.orderId ? `#${order.orderId}` : `#${order._id.slice(-8).toUpperCase()}`}
                        </p>
                        <p className="text-sm" style={{ fontFamily: "Montserrat, sans-serif", color: "#8C6141" }}>
                          {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold" style={{ fontFamily: "Montserrat, sans-serif", color: "#5A0117" }}>
                          ₹{order.totalAmount}
                        </p>
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            order.status === "completed"
                              ? "bg-green-100 text-green-800"
                              : order.status === "pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                          }`}
                          style={{ fontFamily: "Montserrat, sans-serif" }}
                        >
                          {order.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-8" style={{ fontFamily: "Montserrat, sans-serif", color: "#8C6141" }}>
                  No orders yet
                </p>
              )}
            </div>
          </div>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  )
}
