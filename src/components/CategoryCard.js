import Link from "next/link"
import Image from "next/image"
import { useState } from "react"
import { LiaToggleOffSolid } from "react-icons/lia";
import { LiaToggleOnSolid } from "react-icons/lia";

export default function CategoryCard({ category }) {
  const [open, setOpen] = useState(false)
  const hasChildren = Array.isArray(category.subcategories) && category.subcategories.length > 0
  return (
    <div className="group cursor-pointer relative">
      <Link href={`/categories/${category.slug}`}>
        <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
          <div className="aspect-video relative overflow-hidden">
            <Image
              src={category.image || "/placeholder.svg?height=200&width=300&query=category"}
              alt={category.name}
              fill
              className="object-cover transition-transform duration-500 brightness-75 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-all duration-500"></div>
            <div className="absolute inset-0 flex items-center justify-center transition-all duration-500">
              <h3
                className="text-3xl font-extrabold text-white drop-shadow-lg tracking-wide transform 
                           transition-all duration-500 group-hover:translate-y-20"
                style={{ fontFamily: "Sugar, serif" }}
              >
                {category.name}
              </h3>
            </div>
          </div>
        </div>
      </Link>

      {/* Desktop hover dropdown */}
      {hasChildren && (
        <div className="hidden md:block absolute left-0 right-0 top-full  opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity duration-200 z-10">
          <div className="bg-white rounded-lg shadow-lg p-3 grid grid-cols-1 gap-1">
            {category.subcategories.map((child) => (
              <Link key={child._id} href={`/categories/${category.slug}/${child.slug || child._id}`} className="flex items-center gap-3 p-2 rounded hover:bg-gray-50">
                {child.image && (
                  <img src={child.image} alt={child.name} className="w-10 h-10 rounded object-cover" />
                )}
                <span className="text-sm font-medium" style={{ fontFamily: "Montserrat, sans-serif", color: "#5A0117" }}>
                  {child.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Mobile toggle button and list */}
      {hasChildren && (
        <div className="md:hidden mt-2">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setOpen((v) => !v)
            }}
            className="w-full px-4 text-center border rounded-lg text-[10px] font-medium"
            style={{ borderColor: "#AFABAA", color: "#5A0117", fontFamily: "Montserrat, sans-serif" }}
            aria-expanded={open}
          >
            {!open ? <span className="flex justify-center items-center gap-1"><LiaToggleOffSolid/>showMore</span>  
             : <span className="flex justify-center items-center gap-1"><LiaToggleOnSolid/>hide</span> }
       
          </button>

          {open && (
            <div className="mt-2 bg-white text-[10px] rounded-lg shadow p-3 grid grid-cols-1 gap-3">
              {category.subcategories.map((child) => (
                <Link key={child._id} href={`/categories/${category.slug}/${child.slug || child._id}`} className="flex items-center gap-3 p-2 rounded hover:bg-gray-50">
                  {child.image && (
                    <img src={child.image} alt={child.name} className="w-10 h-10 rounded object-cover" />
                  )}
                  <span className="text-[10px] font-medium" style={{ fontFamily: "Montserrat, sans-serif", color: "#5A0117" }}>
                    {child.name}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
