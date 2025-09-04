"use client"
import { useState, useEffect } from "react"
import BlogImageUpload from "../BlogImageUpload"

export default function BlogForm({ blog = null, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    heroImage: "",
    heroImagePublicId: "",
    description: "",
    subtitle: "",
    content: "",
    youtubeLinks: [""],
    additionalLinks: [{ title: "", url: "" }],
    author: "Kanvei Team",
    tags: "",
    published: false,
    metaTitle: "",
    metaDescription: "",
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (blog) {
      setFormData({
        title: blog.title || "",
        slug: blog.slug || "",
        heroImage: blog.heroImage || "",
        description: blog.description || "",
        subtitle: blog.subtitle || "",
        content: blog.content || "",
        youtubeLinks: blog.youtubeLinks?.length ? blog.youtubeLinks : [""],
        additionalLinks: blog.additionalLinks?.length ? blog.additionalLinks : [{ title: "", url: "" }],
        author: blog.author || "",
        tags: blog.tags?.join(", ") || "",
        published: blog.published || false,
        metaTitle: blog.metaTitle || "",
        metaDescription: blog.metaDescription || "",
      })
    }
  }, [blog])

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
  }

  const handleYoutubeLinkChange = (index, value) => {
    const newLinks = [...formData.youtubeLinks]
    newLinks[index] = value
    setFormData((prev) => ({ ...prev, youtubeLinks: newLinks }))
  }

  const addYoutubeLink = () => {
    setFormData((prev) => ({
      ...prev,
      youtubeLinks: [...prev.youtubeLinks, ""],
    }))
  }

  const removeYoutubeLink = (index) => {
    setFormData((prev) => ({
      ...prev,
      youtubeLinks: prev.youtubeLinks.filter((_, i) => i !== index),
    }))
  }

  const handleAdditionalLinkChange = (index, field, value) => {
    const newLinks = [...formData.additionalLinks]
    newLinks[index][field] = value
    setFormData((prev) => ({ ...prev, additionalLinks: newLinks }))
  }

  const addAdditionalLink = () => {
    setFormData((prev) => ({
      ...prev,
      additionalLinks: [...prev.additionalLinks, { title: "", url: "" }],
    }))
  }

  const removeAdditionalLink = (index) => {
    setFormData((prev) => ({
      ...prev,
      additionalLinks: prev.additionalLinks.filter((_, i) => i !== index),
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const submitData = {
        ...formData,
        tags: formData.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        youtubeLinks: formData.youtubeLinks.filter(Boolean),
        additionalLinks: formData.additionalLinks.filter((link) => link.title && link.url),
      }

      await onSubmit(submitData)
    } catch (error) {
      console.error("Error submitting blog:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6" style={{ backgroundColor: "#DBCCB7" }}>
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-2xl font-bold mb-6" style={{ color: "#5A0117", fontFamily: "Sugar, serif" }}>
          {blog ? "Edit Blog" : "Create New Blog"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: "#5A0117" }}>
                Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-opacity-50"
                style={{ focusRingColor: "#5A0117" }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: "#5A0117" }}>
                Slug
              </label>
              <input
                type="text"
                name="slug"
                value={formData.slug}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-opacity-50"
                style={{ focusRingColor: "#5A0117" }}
                placeholder="Auto-generated from title"
              />
            </div>
          </div>

          {/* Hero Image */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "#5A0117" }}>
              Hero Image (1000x1000px)
            </label>
            <BlogImageUpload
              value={formData.heroImage}
              onChange={(imageData) => {
                if (typeof imageData === 'object' && imageData.url) {
                  setFormData((prev) => ({ 
                    ...prev, 
                    heroImage: imageData.url,
                    heroImagePublicId: imageData.publicId 
                  }))
                } else {
                  setFormData((prev) => ({ 
                    ...prev, 
                    heroImage: imageData,
                    heroImagePublicId: '' 
                  }))
                }
              }}
              disabled={isSubmitting}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "#5A0117" }}>
              Description *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              required
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-opacity-50"
              style={{ focusRingColor: "#5A0117" }}
            />
          </div>

          {/* Subtitle */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "#5A0117" }}>
              Subtitle
            </label>
            <input
              type="text"
              name="subtitle"
              value={formData.subtitle}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-opacity-50"
              style={{ focusRingColor: "#5A0117" }}
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "#5A0117" }}>
              Content *
            </label>
            <textarea
              name="content"
              value={formData.content}
              onChange={handleInputChange}
              required
              rows={10}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-opacity-50"
              style={{ focusRingColor: "#5A0117" }}
              placeholder="Write your blog content here..."
            />
          </div>

          {/* YouTube Links */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "#5A0117" }}>
              YouTube Links
            </label>
            {formData.youtubeLinks.map((link, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="url"
                  value={link}
                  onChange={(e) => handleYoutubeLinkChange(index, e.target.value)}
                  placeholder="https://youtube.com/watch?v=..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-opacity-50"
                  style={{ focusRingColor: "#5A0117" }}
                />
                <button
                  type="button"
                  onClick={() => removeYoutubeLink(index)}
                  className="px-3 py-2 text-white rounded-lg hover:opacity-80"
                  style={{ backgroundColor: "#5A0117" }}
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addYoutubeLink}
              className="px-4 py-2 text-white rounded-lg hover:opacity-80"
              style={{ backgroundColor: "#8C6141" }}
            >
              Add YouTube Link
            </button>
          </div>

          {/* Additional Links */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "#5A0117" }}>
              Additional Links
            </label>
            {formData.additionalLinks.map((link, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                <input
                  type="text"
                  value={link.title}
                  onChange={(e) => handleAdditionalLinkChange(index, "title", e.target.value)}
                  placeholder="Link title"
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-opacity-50"
                  style={{ focusRingColor: "#5A0117" }}
                />
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={link.url}
                    onChange={(e) => handleAdditionalLinkChange(index, "url", e.target.value)}
                    placeholder="https://example.com"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-opacity-50"
                    style={{ focusRingColor: "#5A0117" }}
                  />
                  <button
                    type="button"
                    onClick={() => removeAdditionalLink(index)}
                    className="px-3 py-2 text-white rounded-lg hover:opacity-80"
                    style={{ backgroundColor: "#5A0117" }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={addAdditionalLink}
              className="px-4 py-2 text-white rounded-lg hover:opacity-80"
              style={{ backgroundColor: "#8C6141" }}
            >
              Add Additional Link
            </button>
          </div>

          {/* Author and Tags */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: "#5A0117" }}>
                Author
              </label>
              <input
                type="text"
                name="author"
                value={formData.author}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-opacity-50"
                style={{ focusRingColor: "#5A0117" }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: "#5A0117" }}>
                Tags (comma separated)
              </label>
              <input
                type="text"
                name="tags"
                value={formData.tags}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-opacity-50"
                style={{ focusRingColor: "#5A0117" }}
                placeholder="fashion, lifestyle, tips"
              />
            </div>
          </div>

          {/* SEO Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: "#5A0117" }}>
                Meta Title
              </label>
              <input
                type="text"
                name="metaTitle"
                value={formData.metaTitle}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-opacity-50"
                style={{ focusRingColor: "#5A0117" }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: "#5A0117" }}>
                Meta Description
              </label>
              <textarea
                name="metaDescription"
                value={formData.metaDescription}
                onChange={handleInputChange}
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-opacity-50"
                style={{ focusRingColor: "#5A0117" }}
              />
            </div>
          </div>

          {/* Published Status */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              name="published"
              id="published"
              checked={formData.published}
              onChange={handleInputChange}
              className="w-4 h-4 rounded"
              style={{ accentColor: "#5A0117" }}
            />
            <label htmlFor="published" className="text-sm font-medium" style={{ color: "#5A0117" }}>
              Publish immediately
            </label>
          </div>

          {/* Form Actions */}
          <div className="flex gap-4 pt-6">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 text-white rounded-lg hover:opacity-80 disabled:opacity-50"
              style={{ backgroundColor: "#5A0117" }}
            >
              {isSubmitting ? "Saving..." : blog ? "Update Blog" : "Create Blog"}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
