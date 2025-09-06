import Link from "next/link"
import CategoryPage from "../../../components/CategoryPage"

export default function ClothingCategoryPage() {
  // Subcategory components
  const subcategories = [
    <Link
      key="mens-wear"
      href="/categories/clothing/mens-wear"
      className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-8 text-center group hover:scale-105"
    >
      <h3 className="text-2xl font-bold mb-3 group-hover:text-opacity-80" style={{ fontFamily: "Sugar, serif", color: "#5A0117" }}>
        Men&apos;s Wear
      </h3>
      <p className="text-lg" style={{ fontFamily: "Montserrat, sans-serif", color: "#8C6141" }}>
        Stylish clothing for men
      </p>
    </Link>,
    
    <Link
      key="womens-wear"
      href="/categories/clothing/womens-wear"
      className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-8 text-center group hover:scale-105"
    >
      <h3 className="text-2xl font-bold mb-3 group-hover:text-opacity-80" style={{ fontFamily: "Sugar, serif", color: "#5A0117" }}>
        Women&apos;s Wear
      </h3>
      <p className="text-lg" style={{ fontFamily: "Montserrat, sans-serif", color: "#8C6141" }}>
        Elegant fashion for women
      </p>
    </Link>,
    
    <Link
      key="kids-wear"
      href="/categories/clothing/kids-wear"
      className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-8 text-center group hover:scale-105"
    >
      <h3 className="text-2xl font-bold mb-3 group-hover:text-opacity-80" style={{ fontFamily: "Sugar, serif", color: "#5A0117" }}>
        Kids Wear
      </h3>
      <p className="text-lg" style={{ fontFamily: "Montserrat, sans-serif", color: "#8C6141" }}>
        Comfortable clothes for children
      </p>
    </Link>
  ]

  return (
    <CategoryPage 
      categoryName="Clothing"
      displayName="Fashion & Clothing"
      description="Discover our premium collection of clothing, fashion accessories, and apparel for men, women, and kids"
      icon="👕"
      subcategories={subcategories}
    />
  )
}
