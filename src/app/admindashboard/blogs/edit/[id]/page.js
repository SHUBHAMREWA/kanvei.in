"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import AdminLayout from "../../../../../components/shared/AdminLayout"
import ProtectedRoute from "../../../../../components/ProtectedRoute"
import BlogForm from "../../../../../components/admin/BlogForm"
import { useNotification } from "../../../../../contexts/NotificationContext"

export default function EditBlog({ params }) {
  const [blog, setBlog] = useState(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const { id } = params
  const { showSuccess, showError } = useNotification()

  useEffect(() => {
    fetchBlog()
  }, [id])

  const fetchBlog = async () => {
    try {
      const response = await fetch(`/api/blogs/${id}`)
      if (response.ok) {
        const blogData = await response.json()
        setBlog(blogData)
      } else {
        showError("❌ Blog not found")
        router.push("/admindashboard/blogs")
      }
    } catch (error) {
      console.error("Error fetching blog:", error)
      showError("❌ Failed to load blog")
      router.push("/admindashboard/blogs")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (formData) => {
    try {
      const response = await fetch(`/api/blogs/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        showSuccess("✅ Blog updated successfully!")
        setTimeout(() => {
          router.push("/admindashboard/blogs")
        }, 1000)
      } else {
        const error = await response.json()
        showError(`❌ Failed to update blog: ${error.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error("Error updating blog:", error)
      showError("❌ Failed to update blog. Please try again.")
    }
  }

  const handleCancel = () => {
    router.push("/admindashboard/blogs")
  }

  if (loading) {
    return (
      <ProtectedRoute adminOnly={true}>
        <AdminLayout>
          <div className="p-6 text-center">
            <div
              className="animate-spin rounded-full h-8 w-8 mx-auto mb-4"
              style={{ borderColor: "#5A0117", borderTopColor: "transparent", borderWidth: "2px" }}
            ></div>
            <p>Loading blog...</p>
          </div>
        </AdminLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute adminOnly={true}>
      <AdminLayout>
        <BlogForm blog={blog} onSubmit={handleSubmit} onCancel={handleCancel} />
      </AdminLayout>
    </ProtectedRoute>
  )
}
