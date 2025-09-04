"use client"

import Image from "next/image"
import Link from "next/link"
import { useCart } from "../contexts/CartContext"

export default function CartItem({ item }) {
  const { updateQuantity, removeFromCart } = useCart()
  
  console.log('🧾 CARTITEM FRONTEND DEBUG:', {
    itemId: item._id,
    itemName: item.name,
    itemType: item.itemType,
    isOption: item.isOption,
    
    // IMAGE DEBUG
    imageField: item.image,
    imageType: typeof item.image,
    imageLength: item.image ? item.image.length : 'NULL',
    hasImage: !!item.image,
    imageStartsWith: item.image ? item.image.substring(0, 50) : 'NULL',
    
    // OTHER FIELDS
    quantity: item.quantity,
    stock: item.stock,
    productOptionId: item.productOptionId,
    slug: item.slug,
    
    // FULL ITEM FOR DEBUG
    fullItem: item
  })
  
  // Smart routing: option products to option page, main products to main page
  const getProductUrl = () => {
    if (item.isOption && item.productOptionId) {
      // Option product - route to option page using the productOption ID
      return `/products/option/${item.productOptionId}`
    } else if (item.slug) {
      // Main product - route to main product page with slug
      return `/products/${item.slug}`
    } else {
      // Fallback - route to main product page using main product ID
      // For options without proper slug, go to main product page
      return `/products/${item._id}`
    }
  }
  
  const productUrl = getProductUrl()
  
  // Clean display name - no extra size/color details
  const displayName = item.name || 'Product'
  const altText = displayName ? `Image of ${displayName}` : 'Product image'
  
  const productSlug = item.slug || item._id

  return (
    <div className="border rounded-lg p-3 sm:p-4">
      {/* Mobile Layout */}
      <div className="block sm:hidden">
        <div className="flex gap-3 mb-3">
          {/* Product Image */}
          <Link href={productUrl} className="block flex-shrink-0">
            <div className="w-16 h-16 relative rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity border border-gray-200">
              {item.image && item.image.trim() !== '' ? (
                <Image
                  src={item.image}
                  alt={altText}
                  fill
                  className="object-cover"
                  onError={(e) => {
                    console.log('Image failed to load:', item.image)
                    e.target.src = '/placeholder.svg'
                  }}
                />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-400 text-xs">No Image</span>
                </div>
              )}
            </div>
          </Link>
          
          {/* Product Info */}
          <div className="flex-1 min-w-0">
            <Link href={productUrl}>
              <h3 className="text-sm sm:text-lg font-semibold cursor-pointer hover:opacity-80 transition-opacity truncate" style={{ fontFamily: "Sugar, serif", color: "#5A0117" }}>
                {displayName}
              </h3>
            </Link>
            <div className="flex flex-wrap items-center gap-1 mt-1">
              <span className="text-sm font-bold" style={{ fontFamily: "Montserrat, sans-serif", color: "#5A0117" }}>
                ₹{item.price?.toLocaleString() || 'N/A'}
              </span>
              {item.mrp && item.mrp > item.price && (
                <>
                  <span className="text-xs text-gray-500 line-through" style={{ fontFamily: "Montserrat, sans-serif" }}>
                    ₹{item.mrp.toLocaleString()}
                  </span>
                  <span className="text-xs bg-green-100 text-green-800 px-1 py-0.5 rounded font-medium">
                    {Math.round(((item.mrp - item.price) / item.mrp) * 100)}% OFF
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
        
        {/* Controls Row */}
        <div className="flex items-center justify-between">
          {/* Quantity Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const newQuantity = item.quantity - 1
                updateQuantity(item._id, newQuantity)
              }}
              className="w-7 h-7 rounded-full border-2 flex items-center justify-center hover:opacity-80 transition-opacity"
              style={{ borderColor: "#5A0117", color: "#5A0117" }}
            >
              -
            </button>
            <span
              className="text-sm font-semibold w-6 text-center"
              style={{ fontFamily: "Montserrat, sans-serif", color: "#5A0117" }}
            >
              {item.quantity}
            </span>
            <button
              onClick={() => {
                const availableStock = item.stock || 999
                const newQuantity = Math.min(availableStock, item.quantity + 1)
                updateQuantity(item._id, newQuantity)
              }}
              disabled={item.quantity >= (item.stock || 999)}
              className="w-7 h-7 rounded-full border-2 flex items-center justify-center hover:opacity-80 transition-opacity disabled:opacity-50"
              style={{ borderColor: "#5A0117", color: "#5A0117" }}
            >
              +
            </button>
          </div>
          
          {/* Total & Remove */}
          <div className="text-right">
            <p className="text-sm font-bold mb-1" style={{ fontFamily: "Montserrat, sans-serif", color: "#5A0117" }}>
              ₹{(item.price * item.quantity)?.toLocaleString() || 'N/A'}
            </p>
            <button
              onClick={() => removeFromCart(item._id)}
              className="text-xs text-red-600 hover:text-red-800 transition-colors"
              style={{ fontFamily: "Montserrat, sans-serif" }}
            >
              Remove
            </button>
          </div>
        </div>
      </div>
      
      {/* Desktop Layout */}
      <div className="hidden sm:flex items-center gap-4">
        {/* Clickable Product Image */}
        <Link href={productUrl} className="block">
          <div className="w-20 h-20 relative rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity border border-gray-200">
            {item.image && item.image.trim() !== '' ? (
              <Image
                src={item.image}
                alt={altText}
                fill
                className="object-cover"
                onError={(e) => {
                  console.log('Image failed to load:', item.image)
                  e.target.src = '/placeholder.svg'
                }}
              />
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                <span className="text-gray-400 text-xs">No Image</span>
              </div>
            )}
          </div>
        </Link>

        <div className="flex-1">
          {/* Clickable Product Name with option details */}
          <Link href={productUrl}>
            <h3 className="text-lg font-semibold cursor-pointer hover:opacity-80 transition-opacity" style={{ fontFamily: "Sugar, serif", color: "#5A0117" }}>
              {displayName}
            </h3>
          </Link>
          {/* Price and MRP Display */}
          <div className="flex items-center gap-2 mt-1">
            <span className="text-lg font-bold" style={{ fontFamily: "Montserrat, sans-serif", color: "#5A0117" }}>
              ₹{item.price?.toLocaleString() || 'N/A'}
            </span>
            {item.mrp && item.mrp > item.price && (
              <>
                <span className="text-sm text-gray-500 line-through" style={{ fontFamily: "Montserrat, sans-serif" }}>
                  ₹{item.mrp.toLocaleString()}
                </span>
                <span className="text-xs bg-green-100 text-green-800 px-1 py-0.5 rounded text-[10px] font-medium">
                  {Math.round(((item.mrp - item.price) / item.mrp) * 100)}% OFF
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              const newQuantity = item.quantity - 1
              console.log('🔻 Decrease button clicked:', { 
                itemId: item._id, 
                currentQuantity: item.quantity, 
                newQuantity 
              })
              updateQuantity(item._id, newQuantity)
            }}
            className="w-8 h-8 rounded-full border-2 flex items-center justify-center hover:opacity-80 transition-opacity"
            style={{ borderColor: "#5A0117", color: "#5A0117" }}
          >
            -
          </button>
          <span
            className="text-lg font-semibold w-8 text-center"
            style={{ fontFamily: "Montserrat, sans-serif", color: "#5A0117" }}
          >
            {item.quantity}
          </span>
          <button
            onClick={() => {
              // Handle undefined stock - default to a high number or prevent increase
              const availableStock = item.stock || 999
              const newQuantity = Math.min(availableStock, item.quantity + 1)
              console.log('🔺 Increase button clicked:', { 
                itemId: item._id, 
                itemIdType: typeof item._id,
                currentQuantity: item.quantity, 
                quantityType: typeof item.quantity,
                stock: item.stock,
                availableStock,
                stockType: typeof item.stock,
                newQuantity,
                newQuantityType: typeof newQuantity,
                fullItem: item
              })
              console.log('🎯 Calling updateQuantity with:', {
                cartItemId: item._id,
                quantity: newQuantity,
                isValidId: !!item._id,
                isValidQuantity: typeof newQuantity === 'number' && newQuantity >= 0 && !isNaN(newQuantity)
              })
              updateQuantity(item._id, newQuantity)
            }}
            disabled={item.quantity >= (item.stock || 999)}
            className="w-8 h-8 rounded-full border-2 flex items-center justify-center hover:opacity-80 transition-opacity disabled:opacity-50"
            style={{ borderColor: "#5A0117", color: "#5A0117" }}
          >
            +
          </button>
        </div>

        <div className="text-right">
          <p className="text-lg font-bold" style={{ fontFamily: "Montserrat, sans-serif", color: "#5A0117" }}>
            ₹{(item.price * item.quantity)?.toLocaleString() || 'N/A'}
          </p>
          <button
            onClick={() => removeFromCart(item._id)}
            className="text-sm text-red-600 hover:text-red-800 transition-colors"
            style={{ fontFamily: "Montserrat, sans-serif" }}
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  )
}
