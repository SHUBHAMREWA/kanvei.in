"use client"

export default function ProductSkeleton({ count = 10 }) {
  return (
    <>
      {[...Array(count)].map((_, i) => (
        <div key={i} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden animate-pulse">
          {/* Image Skeleton */}
          <div className="aspect-square bg-gradient-to-br from-gray-200 to-gray-300 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
          </div>
          
          {/* Content Skeleton */}
          <div className="p-3 space-y-3">
            {/* Title Skeleton */}
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded-full animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded-full w-3/4 animate-pulse"></div>
            </div>
            
            {/* Price Skeleton */}
            <div className="flex items-center justify-between">
              <div className="h-5 bg-gray-300 rounded-full w-20 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded-full w-16 animate-pulse"></div>
            </div>
            
            {/* Button Skeleton */}
            <div className="h-9 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg animate-pulse"></div>
          </div>
          
          {/* Shimmer Effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse opacity-50"></div>
        </div>
      ))}
    </>
  )
}

// Skeleton for grid layout
export function ProductGridSkeleton({ itemsPerRow = 5, rows = 2 }) {
  const totalItems = itemsPerRow * rows
  
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-5 2xl:grid-cols-5 gap-4 sm:gap-6">
      <ProductSkeleton count={totalItems} />
    </div>
  )
}

// Mobile optimized skeleton
export function MobileProductSkeleton({ count = 4 }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <ProductSkeleton count={count} />
    </div>
  )
}
