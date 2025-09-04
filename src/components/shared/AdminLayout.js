"use client"
import { useState } from "react"
import AdminSidebar from "./AdminSidebar"
import ProtectedRoute from "../ProtectedRoute"

export default function AdminLayout({ children }) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  return (
    <ProtectedRoute adminOnly={true}>
      <div className="flex min-h-screen">
        {/* Desktop sidebar */}
        <div className="hidden md:block">
          <AdminSidebar />
        </div>

        {/* Mobile sidebar drawer */}
        {isMobileSidebarOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div className="absolute inset-0 bg-black/40" onClick={() => setIsMobileSidebarOpen(false)}></div>
            <div className="relative h-full w-64">
              <AdminSidebar onLinkClick={() => setIsMobileSidebarOpen(false)} />
            </div>
          </div>
        )}

        <main className="flex-1 bg-gray-50">
          {/* Mobile top bar */}
          <div className="md:hidden sticky top-0 z-40 bg-white border-b border-gray-200">
            <div className="flex items-center gap-3 p-4">
              <button
                aria-label="Open admin menu"
                onClick={() => setIsMobileSidebarOpen(true)}
                className="p-2 rounded-md border border-gray-300"
              >
                ☰
              </button>
              <span className="text-lg font-semibold" style={{ color: "#5A0117", fontFamily: "Sugar, serif" }}>
                Kanvei Admin
              </span>
            </div>
          </div>

          <div className="p-6">{children}</div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
