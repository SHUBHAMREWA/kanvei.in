"use client"
import { Suspense } from "react"
import ProductsPage from "./productPage" // move your big component to ProductsPage.js

export default function ProductsPageWrapper() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading products...</div>}>
      <ProductsPage />
    </Suspense>
  )
}
