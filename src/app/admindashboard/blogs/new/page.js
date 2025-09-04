"use client"
import { useRouter } from "next/navigation"
import AdminLayout from "../../../../components/shared/AdminLayout"
import ProtectedRoute from "../../../../components/ProtectedRoute"
import BlogForm from "../../../../components/admin/BlogForm"
import { useNotification } from "../../../../contexts/NotificationContext"

export default function NewBlog() {
  const router = useRouter()
  const { showSuccess, showError } = useNotification()

  const handleSubmit = async (formData) => {
    try {
      const response = await fetch("/api/blogs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const result = await response.json()
        showSuccess(`✨ Blog "${result.title}" created successfully!`)
        setTimeout(() => {
          router.push("/admindashboard/blogs")
        }, 1000)
      } else {
        const error = await response.json()
        showError(`❌ Failed to create blog: ${error.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error("Error creating blog:", error)
      showError("❌ Failed to create blog. Please try again.")
    }
  }

  const handleCancel = () => {
    router.push("/admindashboard/blogs")
  }

  return (
    <ProtectedRoute adminOnly={true}>
      <AdminLayout>
        <BlogForm onSubmit={handleSubmit} onCancel={handleCancel} />
      </AdminLayout>
    </ProtectedRoute>
  )
}
