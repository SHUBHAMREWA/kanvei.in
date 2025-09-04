"use client"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "../contexts/AuthContext"

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { isAuthenticated, user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.push("/login")
        return
      }

      if (adminOnly && user?.role !== "admin") {
        router.push("/")
        return
      }
    }
  }, [isAuthenticated, user, loading, adminOnly, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2" style={{ borderColor: "#5A0117" }}></div>
      </div>
    )
  }

  if (!isAuthenticated || (adminOnly && user?.role !== "admin")) {
    return null
  }

  return children
}
