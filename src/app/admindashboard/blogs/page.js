"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import AdminLayout from "../../../components/shared/AdminLayout"
import ProtectedRoute from "../../../components/ProtectedRoute"
import { useNotification } from "../../../contexts/NotificationContext"

export default function AdminBlogs() {
  const [blogs, setBlogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [sortBy, setSortBy] = useState("newest")
  const { showSuccess, showError } = useNotification()

  useEffect(() => {
    fetchBlogs()
  }, [filterStatus, sortBy, searchTerm])

  const fetchBlogs = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()

      if (filterStatus !== "all") {
        params.append("published", filterStatus === "published" ? "true" : "false")
      }
      if (searchTerm) {
        params.append("search", searchTerm)
      }
      params.append("sort", sortBy)

      const response = await fetch(`/api/blogs?${params}`)
      const data = await response.json()
      setBlogs(data.blogs || [])
    } catch (error) {
      console.error("Error fetching blogs:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this blog?")) return

    try {
      const response = await fetch(`/api/blogs/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        const result = await response.json()
        setBlogs(blogs.filter((blog) => blog._id !== id))
        showSuccess(`🗑️ Blog deleted successfully! ${result.imageDeleted ? 'Image also removed from cloud storage.' : ''}`)
      } else {
        const error = await response.json()
        showError(`❌ Failed to delete blog: ${error.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error("Error deleting blog:", error)
      showError("❌ Failed to delete blog. Please try again.")
    }
  }

  const togglePublished = async (id, currentStatus) => {
    try {
      const response = await fetch(`/api/blogs/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ published: !currentStatus }),
      })

      if (response.ok) {
        fetchBlogs()
        const newStatus = !currentStatus
        showSuccess(`✅ Blog ${newStatus ? 'published' : 'unpublished'} successfully!`)
      } else {
        const error = await response.json()
        showError(`❌ Failed to update blog status: ${error.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error("Error updating blog:", error)
      showError("❌ Failed to update blog status. Please try again.")
    }
  }

  return (
    <ProtectedRoute adminOnly={true}>
      <AdminLayout>
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold" style={{ color: "#5A0117", fontFamily: "Sugar, serif" }}>
              Blog Management
            </h1>
            <Link
              href="/admindashboard/blogs/new"
              className="px-6 py-3 text-white rounded-lg hover:opacity-80 transition-opacity"
              style={{ backgroundColor: "#5A0117" }}
            >
              Create New Blog
            </Link>
          </div>

          {/* Filters and Search */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "#5A0117" }}>
                  Search Blogs
                </label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by title, description, or tags..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-opacity-50"
                  style={{ focusRingColor: "#5A0117" }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "#5A0117" }}>
                  Filter by Status
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-opacity-50"
                  style={{ focusRingColor: "#5A0117" }}
                >
                  <option value="all">All Blogs</option>
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "#5A0117" }}>
                  Sort by
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-opacity-50"
                  style={{ focusRingColor: "#5A0117" }}
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="title">Title A-Z</option>
                </select>
              </div>
            </div>
          </div>

          {/* Blogs Table */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {loading ? (
              <div className="p-8 text-center">
                <div
                  className="animate-spin rounded-full h-8 w-8 mx-auto mb-4"
                  style={{ borderColor: "#5A0117", borderTopColor: "transparent", borderWidth: "2px" }}
                ></div>
                <p>Loading blogs...</p>
              </div>
            ) : blogs.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-500 mb-4">No blogs found</p>
                <Link
                  href="/admindashboard/blogs/new"
                  className="px-4 py-2 text-white rounded-lg hover:opacity-80"
                  style={{ backgroundColor: "#5A0117" }}
                >
                  Create Your First Blog
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead style={{ backgroundColor: "#DBCCB7" }}>
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-medium" style={{ color: "#5A0117" }}>
                        Title
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-medium" style={{ color: "#5A0117" }}>
                        Author
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-medium" style={{ color: "#5A0117" }}>
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-medium" style={{ color: "#5A0117" }}>
                        Created
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-medium" style={{ color: "#5A0117" }}>
                        Read Time
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-medium" style={{ color: "#5A0117" }}>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {blogs.map((blog) => (
                      <tr key={blog._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-medium text-gray-900">{blog.title}</div>
                            <div className="text-sm text-gray-500 truncate max-w-xs">{blog.description}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">{blog.author || "Anonymous"}</td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => togglePublished(blog._id, blog.published)}
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              blog.published ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {blog.published ? "Published" : "Draft"}
                          </button>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {new Date(blog.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {blog.readTime ? `${blog.readTime} min` : "N/A"}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <Link
                              href={`/admindashboard/blogs/edit/${blog._id}`}
                              className="px-3 py-1 text-white rounded hover:opacity-80"
                              style={{ backgroundColor: "#8C6141" }}
                            >
                              Edit
                            </Link>
                            <button
                              onClick={() => handleDelete(blog._id)}
                              className="px-3 py-1 text-white rounded hover:opacity-80"
                              style={{ backgroundColor: "#5A0117" }}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  )
}
