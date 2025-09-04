"use client"
import { useState, useEffect } from "react"
import AdminLayout from "../../../components/shared/AdminLayout"
import { toast } from "@/hooks/use-toast"
import CategoryForm from "../../../components/admin/CategoryForm"

export default function AdminCategories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/categories?withHierarchy=true")
      const data = await res.json()
      if (data.success) {
        setCategories(data.categories)
      }
    } catch (error) {
      console.error("Error fetching categories:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (formData) => {
    try {
      const url = editingCategory ? `/api/categories/${editingCategory._id}` : "/api/categories"
      const method = editingCategory ? "PUT" : "POST"
      const token = typeof window !== 'undefined' ? localStorage.getItem('kanvei-token') : null

      const res = await fetch(url, {
        method,
        headers: { 
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(formData),
      })

      const data = await res.json()
      if (data.success) {
        await fetchCategories()
        setShowForm(false)
        setEditingCategory(null)
        toast({
          variant: "success",
          title: editingCategory ? "Category updated" : "Category created",
          description: editingCategory ? "Category updated successfully!" : "Category created successfully!",
        })
      } else {
        toast({ variant: "destructive", title: "Error", description: data.error || "Failed to save category" })
      }
    } catch (error) {
      console.error("Error submitting category:", error)
      toast({ variant: "destructive", title: "Error", description: "Error submitting category" })
    }
  }

  const handleDelete = async (categoryId) => {
    if (!confirm("Are you sure you want to delete this category? This will also delete all its subcategories and related products.")) return

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('kanvei-token') : null
      
      const res = await fetch(`/api/categories/${categoryId}`, { 
        method: "DELETE",
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      })
      const data = await res.json()
      if (data.success) {
        await fetchCategories()
        toast({ 
          variant: "success", 
          title: "Category deleted", 
          description: `Category and ${data.deletedProducts} products deleted successfully!` 
        })
      } else {
        toast({ variant: "destructive", title: "Error", description: data.error || "Failed to delete category" })
      }
    } catch (error) {
      console.error("Error deleting category:", error)
      toast({ variant: "destructive", title: "Error", description: "Error deleting category" })
    }
  }

  const handleEdit = (category) => {
    setEditingCategory(category)
    setShowForm(true)
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingCategory(null)
  }

  const countTree = (nodes = []) => nodes.reduce((sum, n) => sum + 1 + countTree(n.subcategories || []), 0)
  const totalCategories = countTree(categories)

  const CategoryNode = ({ node, parentName }) => {
    const [expanded, setExpanded] = useState(false)
    const hasChildren = (node.subcategories && node.subcategories.length > 0)
    return (
      <div className="border rounded-lg p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 p-3 sm:p-4 bg-gray-50 rounded-lg">
          <div className="flex items-start sm:items-center gap-3 sm:gap-4">
            {hasChildren && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="w-8 h-8 flex items-center justify-center rounded border"
                style={{ borderColor: "#AFABAA" }}
                aria-label={expanded ? "Collapse" : "Expand"}
                title={expanded ? "Collapse" : "Expand"}
              >
                <span style={{ color: "#5A0117", fontWeight: 700 }}>{expanded ? "−" : "+"}</span>
              </button>
            )}
            {node.image && (
              <img src={node.image || "/placeholder.svg"} alt={node.name} className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded-lg" />
            )}
            <div>
              <h3 className="text-lg font-semibold" style={{ fontFamily: "Sugar, serif", color: "#5A0117" }}>
                {parentName ? "📄" : "📁"} {node.name}
              </h3>
              {node.description && (
                <p className="text-sm break-words" style={{ fontFamily: "Montserrat, sans-serif", color: "#8C6141" }}>
                  {node.description}
                </p>
              )}
              <p className="text-xs mt-1" style={{ fontFamily: "Montserrat, sans-serif", color: "#AFABAA" }}>
                {parentName ? `Subcategory of ${parentName}` : `Main Category • ${node.subcategories?.length || 0} subcategories`}
              </p>
            </div>
          </div>
          <div className="flex gap-1 sm:gap-2 flex-shrink-0">
            <button
              onClick={() => handleEdit(node)}
              className="px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm border-2 font-semibold rounded-md hover:opacity-80 transition-opacity"
              style={{ borderColor: "#8C6141", color: "#8C6141", fontFamily: "Montserrat, sans-serif" }}
            >
              Edit
            </button>
            <button
              onClick={() => handleDelete(node._id)}
              className="px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm bg-red-600 text-white font-semibold rounded-md hover:bg-red-700 transition-colors"
              style={{ fontFamily: "Montserrat, sans-serif" }}
            >
              Delete
            </button>
          </div>
        </div>

        {hasChildren && expanded && (
          <div className="mt-3 sm:mt-4 ml-4 sm:ml-8 space-y-2">
            {node.subcategories.map((child) => (
              <CategoryNode key={child._id} node={child} parentName={node.name} />
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold" style={{ fontFamily: "Sugar, serif", color: "#5A0117" }}>
              Categories & Subcategories
            </h1>
            <p className="mt-2" style={{ fontFamily: "Montserrat, sans-serif", color: "#8C6141" }}>
              Manage your product categories and subcategories
            </p>
          </div>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="px-6 py-2 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity"
              style={{ backgroundColor: "#5A0117", fontFamily: "Montserrat, sans-serif" }}
            >
              Add Category
            </button>
          )}
        </div>

        {/* Form */}
        {showForm && <CategoryForm category={editingCategory} onSubmit={handleSubmit} onCancel={handleCancel} />}

        {/* Categories List */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold" style={{ fontFamily: "Sugar, serif", color: "#5A0117" }}>
              All Categories ({totalCategories})
            </h2>
          </div>
          <div className="p-4 sm:p-6">
            {loading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-gray-200 rounded h-16 sm:h-20 animate-pulse"></div>
                ))}
              </div>
            ) : categories.length > 0 ? (
              <div className="space-y-6">
                {categories.map((category) => (
                  <CategoryNode key={category._id} node={category} />
                ))}
              </div>
            ) : (
              <p className="text-center py-8" style={{ fontFamily: "Montserrat, sans-serif", color: "#8C6141" }}>
                No categories found. Create your first category!
              </p>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
