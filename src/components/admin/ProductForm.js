"use client"
import { useState, useEffect } from "react"
import ImageUpload from "../ImageUpload"

export default function ProductForm({ product, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    title: product?.title || product?.name || "",
    description: product?.description || "",
    brand: product?.brand || "",
    slug: product?.slug || "",
    weight: product?.weight || "",
    height: product?.height || "",
    width: product?.width || "",
    mrp: product?.mrp || "",
    price: product?.price || "",
    category: product?.categoryId || product?.category || "",
    stock: product?.stock || "",
    featured: product?.featured || false,
    images: product?.images || [],
    attributes: product?.attributes || [],
    options: product?.options || [],
  })
  
  // Track removed images for cleanup
  const [removedImages, setRemovedImages] = useState({
    mainImages: [],
    optionImages: [] // [{optionIndex, images: []}]
  })
  
  // Store original images for comparison
  const [originalImages, setOriginalImages] = useState({
    mainImages: product?.images || [],
    optionImages: (product?.options || []).map(opt => opt.images || [])
  })
  const [categoriesHierarchy, setCategoriesHierarchy] = useState([])
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState((product?.category || product?.categoryId) ? 2 : 1)

  const getCategoryNameById = (id, list = categoriesHierarchy) => {
    if (!id) return ""
    for (const node of list) {
      if (String(node._id) === String(id)) return node.name
      if (Array.isArray(node.subcategories) && node.subcategories.length) {
        const found = getCategoryNameById(id, node.subcategories)
        if (found) return found
      }
    }
    return ""
  }

  const flattenCategories = (list, depth = 0, acc = []) => {
    for (const node of list) {
      acc.push({ id: String(node._id), name: node.name, depth })
      if (Array.isArray(node.subcategories) && node.subcategories.length) {
        flattenCategories(node.subcategories, depth + 1, acc)
      }
    }
    return acc
  }

  const renderCategoryTree = (list, depth = 0) => {
    return (list || []).map((node) => (
      <div key={String(node._id)} className="py-2 px-3 rounded hover:bg-gray-50" style={{ paddingLeft: depth * 16 }}>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="radio"
            name="category"
            checked={String(formData.category) === String(node._id)}
            onChange={() => setFormData({ ...formData, category: String(node._id) })}
            className="accent-[#5A0117]"
          />
          <span className="font-medium" style={{ fontFamily: 'Montserrat, sans-serif', color: '#5A0117' }}>
            {node.name}
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full ml-2" style={{ background: '#F4E8EA', color: '#8C6141' }}>
            {depth === 0 ? 'Main' : 'Child'}
          </span>
        </label>
        {Array.isArray(node.subcategories) && node.subcategories.length > 0 && (
          <div className="mt-1 border-l" style={{ borderColor: '#F0E6E8' }}>
            {renderCategoryTree(node.subcategories, depth + 1)}
          </div>
        )}
      </div>
    ))
  }

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch("/api/categories?withHierarchy=true")
        const data = await res.json()
        if (data.success) {
          setCategoriesHierarchy(data.categories)
        }
      } catch (error) {
        console.error("Error fetching categories:", error)
      }
    }

    fetchCategories()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const attributesArray = (formData.attributes || []).map((attr) => ({
        name: attr.name || "",
        type: attr.type || "",
      }))

      const optionsArray = (formData.options || []).map((opt) => ({
        size: opt.size || "",
        price: opt.price === "" ? 0 : Number.parseFloat(opt.price),
        mrp: opt.mrp === "" ? 0 : Number.parseFloat(opt.mrp),
        color: opt.color || "",
        stock: opt.stock === "" ? 0 : Number.parseInt(opt.stock),
        images: Array.isArray(opt.images) ? opt.images : [],
      }))

      // Calculate removed images if editing
      let removedImagesData = null
      if (product) { // Only when editing
        const currentMainImages = formData.images || []
        const originalMainImages = originalImages.mainImages || []
        
        const removedMainImages = originalMainImages.filter(img => !currentMainImages.includes(img))
        
        // Check for removed option images
        const removedOptionImages = []
        originalImages.optionImages.forEach((originalOptImages, index) => {
          const currentOptImages = (formData.options[index]?.images || [])
          const removedInThisOption = (originalOptImages || []).filter(img => !currentOptImages.includes(img))
          if (removedInThisOption.length > 0) {
            removedOptionImages.push({
              optionIndex: index,
              images: removedInThisOption
            })
          }
        })
        
        if (removedMainImages.length > 0 || removedOptionImages.length > 0) {
          removedImagesData = {
            mainImages: removedMainImages,
            optionImages: removedOptionImages
          }
        }
      }

      const submitData = {
        ...formData,
        name: formData.title, // Keep name for backward compatibility
        title: formData.title, // Also send title field
        price: formData.price === "" ? 0 : Number.parseFloat(formData.price),
        mrp: formData.mrp === "" ? 0 : Number.parseFloat(formData.mrp),
        weight: formData.weight === "" ? 0 : Number.parseFloat(formData.weight),
        height: formData.height === "" ? 0 : Number.parseFloat(formData.height),
        width: formData.width === "" ? 0 : Number.parseFloat(formData.width),
        stock: formData.stock === "" ? 0 : Number.parseInt(formData.stock),
        attributes: attributesArray,
        options: optionsArray,
        // Fix categoryId handling
        categoryId: formData.category && formData.category !== "" ? formData.category : null,
        category: getCategoryNameById(formData.category),
        // Add removed images for cleanup
        ...(removedImagesData && { removedImages: removedImagesData })
      }

      // Call the parent onSubmit function instead of direct API call
      onSubmit(submitData)
    } catch (error) {
      console.error("Error submitting form:", error)
      alert("Error processing form data")
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpload = (images) => {
    setFormData({ ...formData, images })
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
      <h2 className="text-2xl font-bold mb-6" style={{ fontFamily: "Sugar, serif", color: "#5A0117" }}>
        {product ? "Edit Product" : "Add New Product"}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Stepper */}
        <div className="flex items-center gap-3 mb-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${step >= 1 ? '' : ''}`}
               style={{ backgroundColor: step >= 1 ? '#5A0117' : '#AFABAA', fontFamily: 'Montserrat, sans-serif' }}>
            1
          </div>
          <span className="text-sm font-semibold" style={{ fontFamily: 'Montserrat, sans-serif', color: '#5A0117' }}>Select Category</span>
          <div className="flex-1 h-px" style={{ backgroundColor: '#AFABAA' }} />
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${step >= 2 ? '' : ''}`}
               style={{ backgroundColor: step >= 2 ? '#5A0117' : '#AFABAA', fontFamily: 'Montserrat, sans-serif' }}>
            2
          </div>
          <span className="text-sm font-semibold" style={{ fontFamily: 'Montserrat, sans-serif', color: step >= 2 ? '#5A0117' : '#8C6141' }}>Product Details</span>
        </div>

        {/* Step 1: Category selection */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label
                className="block text-sm font-semibold mb-2"
                style={{ fontFamily: "Montserrat, sans-serif", color: "#5A0117" }}
              >
                Category * (Select from nested list)
              </label>
              <div className="max-h-64 overflow-auto rounded border" style={{ borderColor: '#AFABAA' }}>
                {renderCategoryTree(categoriesHierarchy)}
              </div>
              <p className="text-xs mt-1" style={{ fontFamily: "Montserrat, sans-serif", color: "#8C6141" }}>
                Main aur uske child/sub-child categories nested list me select karo
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <button
                type="button"
                disabled={!formData.category}
                onClick={() => setStep(2)}
                className="w-full sm:w-auto px-6 py-2 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                style={{ backgroundColor: "#5A0117", fontFamily: "Montserrat, sans-serif" }}
              >
                Next
              </button>
              <button
                type="button"
                onClick={onCancel}
                className="w-full sm:w-auto px-6 py-2 border-2 font-semibold rounded-lg hover:opacity-80 transition-opacity"
                style={{ borderColor: "#AFABAA", color: "#AFABAA", fontFamily: "Montserrat, sans-serif" }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Product details */}
        {step === 2 && (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 rounded border" style={{ borderColor: '#AFABAA' }}>
              <div className="text-sm" style={{ fontFamily: 'Montserrat, sans-serif', color: '#8C6141' }}>
                Selected Category: <span className="font-semibold" style={{ color: '#5A0117' }}>{getCategoryNameById(formData.category)}</span>
              </div>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full sm:w-auto px-3 py-1 border-2 text-sm font-semibold rounded-lg hover:opacity-80 transition-opacity"
                style={{ borderColor: "#8C6141", color: "#8C6141", fontFamily: "Montserrat, sans-serif" }}
              >
                Change
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label
                  className="block text-sm font-semibold mb-2"
                  style={{ fontFamily: "Montserrat, sans-serif", color: "#5A0117" }}
                >
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
                  style={{ fontFamily: "Montserrat, sans-serif", focusRingColor: "#5A0117" }}
                  placeholder="Enter product name"
                />
              </div>

              <div>
                <label
                  className="block text-sm font-semibold mb-2"
                  style={{ fontFamily: "Montserrat, sans-serif", color: "#5A0117" }}
                >
                  Brand
                </label>
                <input
                  type="text"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
                  style={{ fontFamily: "Montserrat, sans-serif", focusRingColor: "#5A0117" }}
                  placeholder="Brand name"
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
                  placeholder="e.g. product-slug"
                />
              </div>
            </div>

            <div>
              <label
                className="block text-sm font-semibold mb-2"
                style={{ fontFamily: "Montserrat, sans-serif", color: "#5A0117" }}
              >
                Weight (kg)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
                style={{ fontFamily: "Montserrat, sans-serif", focusRingColor: "#5A0117" }}
                placeholder="0.00"
              />
            </div>

            <div>
              <label
                className="block text-sm font-semibold mb-2"
                style={{ fontFamily: "Montserrat, sans-serif", color: "#5A0117" }}
              >
                Height (cm)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.height}
                onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
                style={{ fontFamily: "Montserrat, sans-serif", focusRingColor: "#5A0117" }}
                placeholder="0.00"
              />
            </div>

            <div>
              <label
                className="block text-sm font-semibold mb-2"
                style={{ fontFamily: "Montserrat, sans-serif", color: "#5A0117" }}
              >
                Width (cm)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.width}
                onChange={(e) => setFormData({ ...formData, width: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
                style={{ fontFamily: "Montserrat, sans-serif", focusRingColor: "#5A0117" }}
                placeholder="0.00"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label
                  className="block text-sm font-semibold mb-2"
                  style={{ fontFamily: "Montserrat, sans-serif", color: "#5A0117" }}
                >
                  MRP (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.mrp}
                  onChange={(e) => setFormData({ ...formData, mrp: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
                  style={{ fontFamily: "Montserrat, sans-serif", focusRingColor: "#5A0117" }}
                  placeholder="0.00"
                />
              </div>

              <div>
                <label
                  className="block text-sm font-semibold mb-2"
                  style={{ fontFamily: "Montserrat, sans-serif", color: "#5A0117" }}
                >
                  Price (₹) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
                  style={{ fontFamily: "Montserrat, sans-serif", focusRingColor: "#5A0117" }}
                  placeholder="0.00"
                />
              </div>

              <div>
                <label
                  className="block text-sm font-semibold mb-2"
                  style={{ fontFamily: "Montserrat, sans-serif", color: "#5A0117" }}
                >
                  Stock Quantity *
                </label>
                <input
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
                  style={{ fontFamily: "Montserrat, sans-serif", focusRingColor: "#5A0117" }}
                  placeholder="0"
                />
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
                placeholder="Enter product description"
              />
            </div>

            <div>
              <label
                className="block text-sm font-semibold mb-2"
                style={{ fontFamily: "Montserrat, sans-serif", color: "#5A0117" }}
              >
                Product Images
              </label>
              <ImageUpload currentImages={formData.images} onUpload={handleImageUpload} maxImages={5} />
            </div>

            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.featured}
                  onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm font-semibold" style={{ fontFamily: "Montserrat, sans-serif", color: "#5A0117" }}>
                  Featured Product
                </span>
              </label>
            </div>

            {/* Attributes */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold" style={{ fontFamily: 'Sugar, serif', color: '#5A0117' }}>Attributes</h3>
                <button
                  type="button"
                  onClick={() => setFormData({
                    ...formData,
                    attributes: [...(formData.attributes || []), { name: "", type: "" }],
                  })}
                  className="px-3 py-1 text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: '#5A0117', fontFamily: 'Montserrat, sans-serif' }}
                >
                  + Add Attribute
                </button>
              </div>

              {(formData.attributes || []).map((attr, idx) => (
                <div key={idx} className="p-4 border rounded-lg" style={{ borderColor: '#AFABAA' }}>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2" style={{ fontFamily: 'Montserrat, sans-serif', color: '#5A0117' }}>Name</label>
                      <input
                        type="text"
                        value={attr.name}
                        onChange={(e) => {
                          const attributes = [...formData.attributes]
                          attributes[idx] = { ...attributes[idx], name: e.target.value }
                          setFormData({ ...formData, attributes })
                        }}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
                        style={{ fontFamily: 'Montserrat, sans-serif', focusRingColor: '#5A0117' }}
                        placeholder="e.g. Size, Color"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2" style={{ fontFamily: 'Montserrat, sans-serif', color: '#5A0117' }}>Type</label>
                      <input
                        type="text"
                        value={attr.type}
                        onChange={(e) => {
                          const attributes = [...formData.attributes]
                          attributes[idx] = { ...attributes[idx], type: e.target.value }
                          setFormData({ ...formData, attributes })
                        }}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
                        style={{ fontFamily: 'Montserrat, sans-serif', focusRingColor: '#5A0117' }}
                        placeholder="e.g. select, text"
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={() => {
                          const attributes = [...formData.attributes]
                          attributes.splice(idx, 1)
                          setFormData({ ...formData, attributes })
                        }}
                        className="px-3 py-2 border-2 font-semibold rounded-lg hover:opacity-80 transition-opacity"
                        style={{ borderColor: '#8C6141', color: '#8C6141', fontFamily: 'Montserrat, sans-serif' }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Options - separate from attributes */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold" style={{ fontFamily: 'Sugar, serif', color: '#5A0117' }}>Options</h3>
                <button
                  type="button"
                  onClick={() => setFormData({
                    ...formData,
                    options: [...(formData.options || []), { size: '', price: '', mrp: '', color: '', stock: '' }],
                  })}
                  className="px-3 py-1 text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: '#5A0117', fontFamily: 'Montserrat, sans-serif' }}
                >
                  + Add Option
                </button>
              </div>

              {(formData.options || []).map((opt, oIdx) => (
                <div key={oIdx} className="p-4 border rounded-lg" style={{ borderColor: '#AFABAA' }}>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                    <input
                      type="text"
                      value={opt.size}
                      onChange={(e) => {
                        const options = [...(formData.options || [])]
                        options[oIdx] = { ...options[oIdx], size: e.target.value }
                        setFormData({ ...formData, options })
                      }}
                      placeholder="Size"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                      style={{ fontFamily: 'Montserrat, sans-serif', focusRingColor: '#5A0117' }}
                    />
                    <input
                      type="number"
                      step="0.01"
                      value={opt.price}
                      onChange={(e) => {
                        const options = [...(formData.options || [])]
                        options[oIdx] = { ...options[oIdx], price: e.target.value }
                        setFormData({ ...formData, options })
                      }}
                      placeholder="Price"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                      style={{ fontFamily: 'Montserrat, sans-serif', focusRingColor: '#5A0117' }}
                    />
                    <input
                      type="number"
                      step="0.01"
                      value={opt.mrp}
                      onChange={(e) => {
                        const options = [...(formData.options || [])]
                        options[oIdx] = { ...options[oIdx], mrp: e.target.value }
                        setFormData({ ...formData, options })
                      }}
                      placeholder="MRP"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                      style={{ fontFamily: 'Montserrat, sans-serif', focusRingColor: '#5A0117' }}
                    />
                    <input
                      type="text"
                      value={opt.color}
                      onChange={(e) => {
                        const options = [...(formData.options || [])]
                        options[oIdx] = { ...options[oIdx], color: e.target.value }
                        setFormData({ ...formData, options })
                      }}
                      placeholder="Color"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                      style={{ fontFamily: 'Montserrat, sans-serif', focusRingColor: '#5A0117' }}
                    />
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={opt.stock}
                        onChange={(e) => {
                          const options = [...(formData.options || [])]
                          options[oIdx] = { ...options[oIdx], stock: e.target.value }
                          setFormData({ ...formData, options })
                        }}
                        placeholder="Stock"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                        style={{ fontFamily: 'Montserrat, sans-serif', focusRingColor: '#5A0117' }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const options = [...(formData.options || [])]
                          options.splice(oIdx, 1)
                          setFormData({ ...formData, options })
                        }}
                        className="px-3 py-2 border-2 font-semibold rounded-lg hover:opacity-80 transition-opacity"
                        style={{ borderColor: '#8C6141', color: '#8C6141', fontFamily: 'Montserrat, sans-serif' }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  <div className="mt-3">
                    <label className="block text-sm font-semibold mb-2" style={{ fontFamily: 'Montserrat, sans-serif', color: '#5A0117' }}>
                      Option Images
                    </label>
                    <ImageUpload
                      currentImages={opt.images || []}
                      onUpload={(imgs) => {
                        const options = [...(formData.options || [])]
                        options[oIdx] = { ...options[oIdx], images: imgs }
                        setFormData({ ...formData, options })
                      }}
                      maxImages={5}
                      folder="kanvei/optionImage"
                      idSuffix={`option-${oIdx}`}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto px-6 py-2 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                style={{ backgroundColor: "#5A0117", fontFamily: "Montserrat, sans-serif" }}
              >
                {loading ? "Saving..." : product ? "Update Product" : "Create Product"}
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
          </>
        )}
      </form>
    </div>
  )
}
