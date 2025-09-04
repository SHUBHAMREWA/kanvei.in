"use client"
import { useState, useEffect } from "react"
import ImageUpload from "../ImageUpload"

export default function CategoryForm({ category, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    name: category?.name || "",
    slug: category?.slug || "",
    description: category?.description || "",
    image: category?.image || "",
    parentCategory: category?.parentCategory ? String(category.parentCategory) : "",
  })
  const [loading, setLoading] = useState(false)
  const [parentOptions, setParentOptions] = useState([])

  useEffect(() => {
    const fetchAllCategories = async () => {
      try {
        const res = await fetch("/api/categories")
        const data = await res.json()
        if (data.success) {
          setParentOptions(data.categories)
        }
      } catch (error) {
        console.error("Error fetching categories:", error)
      }
    }

    fetchAllCategories()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const submitData = {
        ...formData,
        parentCategory: formData.parentCategory || null,
      }
      await onSubmit(submitData)
    } catch (error) {
      console.error("Error submitting form:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
      <h2 className="text-2xl font-bold mb-6" style={{ fontFamily: "Sugar, serif", color: "#5A0117" }}>
        {category ? "Edit Category" : "Add New Category"}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label
              className="block text-sm font-semibold mb-2"
              style={{ fontFamily: "Montserrat, sans-serif", color: "#5A0117" }}
            >
              Category Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
              style={{ fontFamily: "Montserrat, sans-serif", focusRingColor: "#5A0117" }}
              placeholder="Enter category name"
            />
          </div>

          <div>
            <label
              className="block text-sm font-semibold mb-2"
              style={{ fontFamily: "Montserrat, sans-serif", color: "#5A0117" }}
            >
              Slug
            </label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
              style={{ fontFamily: "Montserrat, sans-serif", focusRingColor: "#5A0117" }}
              placeholder="e.g. electronics, mens-wear"
            />
          </div>

          

          <div>
            <label
              className="block text-sm font-semibold mb-2"
              style={{ fontFamily: "Montserrat, sans-serif", color: "#5A0117" }}
            >
              Parent Category
            </label>
            <select
              value={formData.parentCategory}
              onChange={(e) => setFormData({ ...formData, parentCategory: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
              style={{ fontFamily: "Montserrat, sans-serif", focusRingColor: "#5A0117" }}
            >
              <option value="">Main Category (No Parent)</option>
              {parentOptions
                .filter((cat) => !category || String(cat._id) !== String(category._id))
                .map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                    {cat.description ? ` — ${cat.description.substring(0, 50)}${cat.description.length > 50 ? "..." : ""}` : ""}
                  </option>
                ))}
            </select>
            <p className="text-xs mt-1" style={{ fontFamily: "Montserrat, sans-serif", color: "#8C6141" }}>
              Leave empty to create a main category, or select a parent to create a subcategory
            </p>
          </div>
        </div>

        <div>
          <label
            className="block text-sm font-semibold mb-2"
            style={{ fontFamily: "Montserrat, sans-serif", color: "#5A0117" }}
          >
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
            style={{ fontFamily: "Montserrat, sans-serif", focusRingColor: "#5A0117" }}
            placeholder="Enter category description"
          />
        </div>

        <div>
          <label
            className="block text-sm font-semibold mb-2"
            style={{ fontFamily: "Montserrat, sans-serif", color: "#5A0117" }}
          >
            Category Image
          </label>
          <ImageUpload
            onUpload={(images) => setFormData({ ...formData, image: images[0] || "" })}
            currentImages={formData.image ? [formData.image] : []}
            maxImages={1}
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto px-6 py-2 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
            style={{ backgroundColor: "#5A0117", fontFamily: "Montserrat, sans-serif" }}
          >
            {loading ? "Saving..." : category ? "Update Category" : "Create Category"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="w-full sm:w-auto px-6 py-2 border-2 font-semibold rounded-lg hover:opacity-80 transition-opacity"
            style={{
              borderColor: "#AFABAA",
              color: "#AFABAA",
              fontFamily: "Montserrat, sans-serif",
            }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
