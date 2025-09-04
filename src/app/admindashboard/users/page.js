"use client"
import { useState, useEffect } from "react"
import AdminLayout from "../../../components/shared/AdminLayout"
import { useToast } from "../../../contexts/ToastContext"
import { useNotification } from "../../../contexts/NotificationContext"
import { useAuth } from "../../../contexts/AuthContext"
import { 
  AiOutlineEye, 
  AiOutlineEdit,
  AiOutlineDelete,
  AiOutlineUser, 
  AiOutlineMail,
  AiOutlinePhone,
  AiOutlineClose,
  AiOutlineUserAdd,
  AiOutlineCalendar,
  AiOutlineSafety,
  AiOutlineCheckCircle,
  AiOutlineCloseCircle,
  AiOutlineLock,
  AiOutlineUnlock
} from "react-icons/ai"

export default function AdminUsers() {
  const { showSuccess, showError, showWarning } = useToast()
  const { showNotification } = useNotification()
  const { token, loading: authLoading } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [blockedStatusLoading, setBlockedStatusLoading] = useState(false)
  const [search, setSearch] = useState("")
  const [dateFilter, setDateFilter] = useState("all")
  const [customDateRange, setCustomDateRange] = useState({ start: "", end: "" })
  const [blockedUsers, setBlockedUsers] = useState(new Set())
  const [blockingUsers, setBlockingUsers] = useState(new Set())
  const [selectedUser, setSelectedUser] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editFormData, setEditFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "user",
    emailVerified: false,
    password: ""
  })
  const [updating, setUpdating] = useState(false)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      let url = "/api/users?"
      const params = new URLSearchParams()
      
      if (search.trim()) params.append("search", search.trim())
      if (dateFilter !== "all") {
        params.append("dateFilter", dateFilter)
        if (dateFilter === "custom" && customDateRange.start && customDateRange.end) {
          params.append("customStart", customDateRange.start)
          params.append("customEnd", customDateRange.end)
        }
      }
      
      if (params.toString()) url += params.toString()

      const res = await fetch(url)
      const data = await res.json()
      if (data.success) {
        setUsers(data.users)
        
        // Don't fetch blocked status here - let the useEffect handle it when auth is ready
      } else {
        console.error('Error fetching users:', data.error)
        showError('❌ Error fetching users: ' + data.error)
      }
    } catch (error) {
      console.error("Error fetching users:", error)
      showError('❌ Network error while fetching users')
    } finally {
      setLoading(false)
    }
  }

  const refreshBlockedStatus = async (usersList = users) => {
    if (!usersList || usersList.length === 0) {
      console.log('⏭️ No users to check blocked status for')
      setBlockedUsers(new Set())
      return
    }

    setBlockedStatusLoading(true)
    const blockedSet = new Set()
    
    try {
      const headers = { 'Content-Type': 'application/json' }
      
      // Only add Authorization header for JWT tokens, not NextAuth sessions
      if (token && token !== 'nextauth_session') {
        headers.Authorization = `Bearer ${token}`
        console.log('🔑 Using JWT token for blocked status')
      } else {
        console.log('🍪 Using NextAuth session for blocked status')
      }
      
      console.log('📡 Fetching blocked status for', usersList.length, 'users')
      const blockedRes = await fetch('/api/admin/users/blocked-status', {
        method: 'POST',
        headers,
        body: JSON.stringify({ userIds: usersList.map(u => u._id) })
      })
      
      const blockedData = await blockedRes.json()
      if (blockedData.success) {
        blockedData.blockedUsers.forEach(userId => blockedSet.add(userId))
        console.log('✅ Blocked status loaded:', blockedData.blockedUsers.length, 'blocked users')
      } else {
        console.error('❌ Failed to fetch blocked status:', blockedData.error)
        if (blockedRes.status === 401) {
          console.log('🔐 Authentication failed for blocked status')
        }
      }
    } catch (error) {
      console.error('❌ Error fetching blocked status:', error)
    } finally {
      setBlockedStatusLoading(false)
    }
    
    setBlockedUsers(blockedSet)
  }

  // Load blocked status when auth is ready and users are loaded
  useEffect(() => {
    if (!authLoading && users.length > 0) {
      console.log('🔄 Auth ready, loading blocked status for', users.length, 'users', { hasToken: !!token })
      refreshBlockedStatus(users)
    }
  }, [authLoading, users.length, token])

  // Trigger fetch when filters change
  useEffect(() => {
    if (!loading) {
      setLoading(true)
      fetchUsers()
    }
  }, [search, dateFilter, customDateRange])

  const handleViewUser = (user) => {
    setSelectedUser(user)
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setSelectedUser(null)
  }

  const handleEditUser = (user) => {
    setEditFormData({
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
      role: user.role || "user",
      emailVerified: user.emailVerified || false,
      password: ""
    })
    setSelectedUser(user)
    setShowEditModal(true)
  }

  const handleCloseEditModal = () => {
    setShowEditModal(false)
    setSelectedUser(null)
    setEditFormData({
      name: "",
      email: "",
      phone: "",
      role: "user",
      emailVerified: false,
      password: ""
    })
  }

  const handleCreateUser = () => {
    setEditFormData({
      name: "",
      email: "",
      phone: "",
      role: "user",
      emailVerified: false,
      password: ""
    })
    setShowCreateModal(true)
  }

  const handleCloseCreateModal = () => {
    setShowCreateModal(false)
    setEditFormData({
      name: "",
      email: "",
      phone: "",
      role: "user",
      emailVerified: false,
      password: ""
    })
  }

  const handleUpdateUser = async (e) => {
    e.preventDefault()
    if (!selectedUser) return

    setUpdating(true)
    try {
      const res = await fetch(`/api/users/${selectedUser._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editFormData),
      })

      const data = await res.json()
      if (data.success) {
        await fetchUsers()
        handleCloseEditModal()
        showSuccess('✅ User updated successfully!')
      } else {
        showError(`❌ ${data.error || 'Failed to update user'}`)
      }
    } catch (error) {
      console.error("Error updating user:", error)
      showError('❌ Network error: Could not update user')
    } finally {
      setUpdating(false)
    }
  }

  const handleCreateNewUser = async (e) => {
    e.preventDefault()
    
    if (!editFormData.name.trim() || !editFormData.email.trim()) {
      showError('❌ Name and email are required')
      return
    }

    setCreating(true)
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editFormData),
      })

      const data = await res.json()
      if (data.success) {
        await fetchUsers()
        handleCloseCreateModal()
        showSuccess('✅ User created successfully!')
      } else {
        showError(`❌ ${data.error || 'Failed to create user'}`)
      }
    } catch (error) {
      console.error("Error creating user:", error)
      showError('❌ Network error: Could not create user')
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteUser = async (userId, userName) => {
    if (!confirm(`Are you sure you want to delete user "${userName}"? This action cannot be undone.`)) {
      return
    }

    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
      })

      const data = await res.json()
      if (data.success) {
        await fetchUsers()
        showSuccess('✅ User deleted successfully!')
      } else {
        showError(`❌ ${data.error || 'Failed to delete user'}`)
      }
    } catch (error) {
      console.error("Error deleting user:", error)
      showError('❌ Network error: Could not delete user')
    }
  }

  const handleBlockUser = async (userId, userName) => {
    // Check if user is already blocked
    if (blockedUsers.has(userId)) {
      showWarning(`⚠️ User "${userName}" is already blocked!`)
      return
    }

    const reason = prompt(`Block reason for "${userName}":`, "Violation of terms and conditions")
    if (reason === null) return // User cancelled

    setBlockingUsers(prev => new Set([...prev, userId]))
    try {
      const headers = { "Content-Type": "application/json" }
      if (token && token !== 'nextauth_session') {
        headers.Authorization = `Bearer ${token}`
      }
      
      const res = await fetch(`/api/admin/users/${userId}/block`, {
        method: "POST",
        headers,
        body: JSON.stringify({ reason: reason.trim() || "Account blocked by administrator" })
      })

      const data = await res.json()
      if (data.success) {
        setBlockedUsers(prev => new Set([...prev, userId]))
        // Refresh blocked status to ensure consistency
        await refreshBlockedStatus()
        showSuccess(`🚫 User "${userName}" has been blocked successfully!`)
      } else {
        // Handle the "already blocked" case specifically
        if (data.error && data.error.includes('already blocked')) {
          setBlockedUsers(prev => new Set([...prev, userId]))
          showWarning(`⚠️ User "${userName}" is already blocked!`)
        } else {
          showError(`❌ ${data.error || 'Failed to block user'}`)
        }
      }
    } catch (error) {
      console.error("Error blocking user:", error)
      showError('❌ Network error: Could not block user')
    } finally {
      setBlockingUsers(prev => {
        const newSet = new Set(prev)
        newSet.delete(userId)
        return newSet
      })
    }
  }

  const handleUnblockUser = async (userId, userName) => {
    // Check if user is already unblocked
    if (!blockedUsers.has(userId)) {
      showWarning(`⚠️ User "${userName}" is not blocked!`)
      return
    }

    if (!confirm(`Are you sure you want to unblock user "${userName}"?`)) {
      return
    }

    setBlockingUsers(prev => new Set([...prev, userId]))
    try {
      const headers = { "Content-Type": "application/json" }
      if (token && token !== 'nextauth_session') {
        headers.Authorization = `Bearer ${token}`
      }
      
      const res = await fetch(`/api/admin/users/${userId}/unblock`, {
        method: "POST",
        headers
      })

      const data = await res.json()
      if (data.success) {
        setBlockedUsers(prev => {
          const newSet = new Set(prev)
          newSet.delete(userId)
          return newSet
        })
        // Refresh blocked status to ensure consistency
        await refreshBlockedStatus()
        showSuccess(`✅ User "${userName}" has been unblocked successfully!`)
      } else {
        // Handle the "not blocked" case specifically
        if (data.error && data.error.includes('not blocked')) {
          setBlockedUsers(prev => {
            const newSet = new Set(prev)
            newSet.delete(userId)
            return newSet
          })
          showWarning(`⚠️ User "${userName}" is not blocked!`)
        } else {
          showError(`❌ ${data.error || 'Failed to unblock user'}`)
        }
      }
    } catch (error) {
      console.error("Error unblocking user:", error)
      showError('❌ Network error: Could not unblock user')
    } finally {
      setBlockingUsers(prev => {
        const newSet = new Set(prev)
        newSet.delete(userId)
        return newSet
      })
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getUserId = (userId) => {
    return `#${userId.toString().slice(-8).toUpperCase()}`
  }

  const getRoleBadge = (role) => {
    const isAdmin = role === 'admin'
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        isAdmin ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
      }`} style={{ fontFamily: "Montserrat, sans-serif" }}>
        <AiOutlineSafety className="w-3 h-3 mr-1" />
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </span>
    )
  }

  const getVerificationBadge = (isVerified) => {
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        isVerified ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
      }`} style={{ fontFamily: "Montserrat, sans-serif" }}>
        {isVerified ? (
          <AiOutlineCheckCircle className="w-3 h-3 mr-1" />
        ) : (
          <AiOutlineCloseCircle className="w-3 h-3 mr-1" />
        )}
        {isVerified ? 'Verified' : 'Unverified'}
      </span>
    )
  }

  const getStatusBadge = (userId, userName) => {
    const isBlocked = blockedUsers.has(userId)
    const isLoading = blockingUsers.has(userId)
    
    return (
      <span 
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium cursor-pointer transition-all duration-200 hover:scale-105 ${
          isBlocked ? 'bg-red-100 text-red-800 hover:bg-red-200' : 'bg-green-100 text-green-800 hover:bg-green-200'
        }`} 
        style={{ fontFamily: "Montserrat, sans-serif" }}
        onClick={() => {
          if (isBlocked && !isLoading) {
            handleUnblockUser(userId, userName)
          }
        }}
        title={isBlocked ? `Click to unblock ${userName}` : 'User is active'}
      >
        {isLoading ? (
          <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin mr-1"></div>
        ) : isBlocked ? (
          <AiOutlineLock className="w-3 h-3 mr-1" />
        ) : (
          <AiOutlineUnlock className="w-3 h-3 mr-1" />
        )}
        {isLoading ? 'Processing...' : isBlocked ? 'Blocked' : 'Active'}
      </span>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold" style={{ fontFamily: "Sugar, serif", color: "#5A0117" }}>
                User Management
              </h1>
              <p className="mt-2" style={{ fontFamily: "Montserrat, sans-serif", color: "#8C6141" }}>
                Manage system users with advanced filtering
              </p>
            </div>
            <button
              onClick={handleCreateUser}
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              style={{ fontFamily: "Montserrat, sans-serif" }}
            >
              <AiOutlineUserAdd className="w-4 h-4 mr-2" />
              Create User
            </button>
          </div>

          {/* Advanced Filters */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4" style={{ fontFamily: "Sugar, serif", color: "#5A0117" }}>
              Filter & Search Users
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {/* Search */}
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium mb-2" style={{ fontFamily: "Montserrat, sans-serif", color: "#5A0117" }}>
                  Search Users
                </label>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Name, email, or phone..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
                  style={{ fontFamily: "Montserrat, sans-serif", focusRingColor: "#5A0117" }}
                />
              </div>

              {/* Date Filter */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ fontFamily: "Montserrat, sans-serif", color: "#5A0117" }}>
                  Registration Date
                </label>
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
                  style={{ fontFamily: "Montserrat, sans-serif", focusRingColor: "#5A0117" }}
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="yesterday">Yesterday</option>
                  <option value="last_7_days">Last 7 Days</option>
                  <option value="last_30_days">Last 30 Days</option>
                  <option value="last_3_months">Last 3 Months</option>
                  <option value="last_6_months">Last 6 Months</option>
                  <option value="last_year">Last Year</option>
                  <option value="custom">Custom Range</option>
                </select>
              </div>

              {/* Clear Filters */}
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setSearch("")
                    setDateFilter("all")
                    setCustomDateRange({ start: "", end: "" })
                  }}
                  className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  style={{ fontFamily: "Montserrat, sans-serif" }}
                >
                  Clear All
                </button>
              </div>
            </div>

            {/* Custom Date Range */}
            {dateFilter === "custom" && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ fontFamily: "Montserrat, sans-serif", color: "#5A0117" }}>
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={customDateRange.start}
                    onChange={(e) => setCustomDateRange(prev => ({ ...prev, start: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
                    style={{ fontFamily: "Montserrat, sans-serif", focusRingColor: "#5A0117" }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ fontFamily: "Montserrat, sans-serif", color: "#5A0117" }}>
                    End Date
                  </label>
                  <input
                    type="date"
                    value={customDateRange.end}
                    onChange={(e) => setCustomDateRange(prev => ({ ...prev, end: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
                    style={{ fontFamily: "Montserrat, sans-serif", focusRingColor: "#5A0117" }}
                  />
                </div>
              </div>
            )}

            {/* Filter Summary */}
            <div className="mt-4 flex flex-wrap gap-2">
              {search.trim() && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800" style={{ fontFamily: "Montserrat, sans-serif" }}>
                  Search: {search}
                </span>
              )}
              {dateFilter !== "all" && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800" style={{ fontFamily: "Montserrat, sans-serif" }}>
                  Date: {dateFilter === "custom" ? "Custom Range" : dateFilter.replace('_', ' ')}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold" style={{ fontFamily: "Sugar, serif", color: "#5A0117" }}>
                  Users ({users.length})
                </h2>
                {(search.trim() || dateFilter !== "all") && (
                  <p className="text-sm mt-1" style={{ fontFamily: "Montserrat, sans-serif", color: "#8C6141" }}>
                    Showing filtered results
                  </p>
                )}
              </div>
              
              {users.length > 0 && (
                <div className="text-sm" style={{ fontFamily: "Montserrat, sans-serif", color: "#8C6141" }}>
                  <div className="flex items-center space-x-4">
                    <span>Total Users: <strong style={{ color: "#5A0117" }}>{users.length}</strong></span>
                    <span>Verified: <strong style={{ color: "#5A0117" }}>
                      {users.filter(user => user.emailVerified).length}
                    </strong></span>
                    <span>Admins: <strong style={{ color: "#5A0117" }}>
                      {users.filter(user => user.role === 'admin').length}
                    </strong></span>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {loading ? (
            <div className="p-6">
              <div className="space-y-4">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="bg-gray-200 rounded h-16 animate-pulse"></div>
                ))}
              </div>
            </div>
          ) : users.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ fontFamily: "Montserrat, sans-serif" }}>
                      User ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ fontFamily: "Montserrat, sans-serif" }}>
                      Name & Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ fontFamily: "Montserrat, sans-serif" }}>
                      Phone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ fontFamily: "Montserrat, sans-serif" }}>
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ fontFamily: "Montserrat, sans-serif" }}>
                      Verification
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ fontFamily: "Montserrat, sans-serif" }}>
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ fontFamily: "Montserrat, sans-serif" }}>
                      Registered
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ fontFamily: "Montserrat, sans-serif" }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user, index) => (
                    <tr key={user._id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium" style={{ fontFamily: "Sugar, serif", color: "#5A0117" }}>
                          {getUserId(user._id)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <AiOutlineUser className="h-6 w-6 text-gray-500" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium" style={{ fontFamily: "Montserrat, sans-serif", color: "#5A0117" }}>
                              {user.name}
                            </div>
                            <div className="text-sm text-gray-500 flex items-center">
                              <AiOutlineMail className="w-3 h-3 mr-1" />
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm" style={{ fontFamily: "Montserrat, sans-serif", color: "#8C6141" }}>
                          {user.phone ? (
                            <div className="flex items-center">
                              <AiOutlinePhone className="w-4 h-4 mr-1" />
                              {user.phone}
                            </div>
                          ) : (
                            <span className="text-gray-400">Not provided</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getRoleBadge(user.role)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getVerificationBadge(user.emailVerified)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {blockedStatusLoading ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600" style={{ fontFamily: "Montserrat, sans-serif" }}>
                            <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mr-1"></div>
                            Loading...
                          </span>
                        ) : (
                          getStatusBadge(user._id, user.name)
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm" style={{ fontFamily: "Montserrat, sans-serif", color: "#8C6141" }}>
                          <div className="flex items-center">
                            <AiOutlineCalendar className="w-4 h-4 mr-1" />
                            {formatDate(user.createdAt)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleViewUser(user)}
                            className="text-indigo-600 hover:text-indigo-900 p-1 rounded transition-colors"
                            title="View User Details"
                          >
                            <AiOutlineEye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEditUser(user)}
                            className="text-green-600 hover:text-green-900 p-1 rounded transition-colors"
                            title="Edit User"
                          >
                            <AiOutlineEdit className="w-4 h-4" />
                          </button>
                          
                          {/* Block/Unblock buttons (only for non-admin users) */}
                          {user.role !== 'admin' && (
                            <>
                              {blockedUsers.has(user._id) ? (
                                <button
                                  onClick={() => handleUnblockUser(user._id, user.name)}
                                  disabled={blockingUsers.has(user._id)}
                                  className="text-green-600 hover:text-green-900 p-1 rounded transition-colors disabled:opacity-50"
                                  title="Unblock User"
                                >
                                  {blockingUsers.has(user._id) ? (
                                    <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                                  ) : (
                                    <AiOutlineUnlock className="w-4 h-4" />
                                  )}
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleBlockUser(user._id, user.name)}
                                  disabled={blockingUsers.has(user._id)}
                                  className="text-orange-600 hover:text-orange-900 p-1 rounded transition-colors disabled:opacity-50"
                                  title="Block User"
                                >
                                  {blockingUsers.has(user._id) ? (
                                    <div className="w-4 h-4 border-2 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
                                  ) : (
                                    <AiOutlineLock className="w-4 h-4" />
                                  )}
                                </button>
                              )}
                              
                              <button
                                onClick={() => handleDeleteUser(user._id, user.name)}
                                className="text-red-600 hover:text-red-900 p-1 rounded transition-colors"
                                title="Delete User"
                              >
                                <AiOutlineDelete className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <AiOutlineUser className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900" style={{ fontFamily: "Montserrat, sans-serif" }}>
                No users found
              </h3>
              <p className="mt-1 text-sm text-gray-500" style={{ fontFamily: "Montserrat, sans-serif" }}>
                {search.trim() || dateFilter !== "all" ? "No users found for the selected filter." : "Get started by creating a new user."}
              </p>
            </div>
          )}
        </div>

        {/* View User Modal */}
        {showModal && selectedUser && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
                <div>
                  <h3 className="text-2xl font-bold" style={{ fontFamily: "Sugar, serif", color: "#5A0117" }}>
                    User Details
                  </h3>
                  <p className="text-sm mt-1" style={{ fontFamily: "Montserrat, sans-serif", color: "#8C6141" }}>
                    {getUserId(selectedUser._id)}
                  </p>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-200 transition-colors"
                >
                  <AiOutlineClose className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* User Information */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold" style={{ fontFamily: "Sugar, serif", color: "#5A0117" }}>
                      Personal Information
                    </h4>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      <div className="flex items-center">
                        <AiOutlineUser className="w-5 h-5 mr-3 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-600">Name</p>
                          <p className="font-medium" style={{ fontFamily: "Montserrat, sans-serif", color: "#5A0117" }}>
                            {selectedUser.name}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <AiOutlineMail className="w-5 h-5 mr-3 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-600">Email</p>
                          <p className="font-medium" style={{ fontFamily: "Montserrat, sans-serif", color: "#5A0117" }}>
                            {selectedUser.email}
                          </p>
                        </div>
                      </div>
                      {selectedUser.phone && (
                        <div className="flex items-center">
                          <AiOutlinePhone className="w-5 h-5 mr-3 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-600">Phone</p>
                            <p className="font-medium" style={{ fontFamily: "Montserrat, sans-serif", color: "#5A0117" }}>
                              {selectedUser.phone}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Account Details */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold" style={{ fontFamily: "Sugar, serif", color: "#5A0117" }}>
                      Account Details
                    </h4>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Role</p>
                        <div className="mt-1">{getRoleBadge(selectedUser.role)}</div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Email Verification</p>
                        <div className="mt-1">{getVerificationBadge(selectedUser.emailVerified)}</div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Registration Date</p>
                        <p className="font-medium" style={{ fontFamily: "Montserrat, sans-serif", color: "#5A0117" }}>
                          {formatDate(selectedUser.createdAt)}
                        </p>
                      </div>
                      {selectedUser.updatedAt && selectedUser.updatedAt !== selectedUser.createdAt && (
                        <div>
                          <p className="text-sm font-medium text-gray-600">Last Updated</p>
                          <p className="font-medium" style={{ fontFamily: "Montserrat, sans-serif", color: "#5A0117" }}>
                            {formatDate(selectedUser.updatedAt)}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* OAuth Information */}
                    {(selectedUser.googleId || selectedUser.facebookId) && (
                      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                        <p className="text-sm font-medium text-blue-800 mb-2">OAuth Accounts</p>
                        <div className="space-y-1">
                          {selectedUser.googleId && (
                            <p className="text-xs text-blue-600">• Google ID: {selectedUser.googleId}</p>
                          )}
                          {selectedUser.facebookId && (
                            <p className="text-xs text-blue-600">• Facebook ID: {selectedUser.facebookId}</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-between">
                <button
                  onClick={() => {
                    handleCloseModal()
                    handleEditUser(selectedUser)
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  style={{ fontFamily: "Montserrat, sans-serif" }}
                >
                  Edit User
                </button>
                <button
                  onClick={handleCloseModal}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                  style={{ fontFamily: "Montserrat, sans-serif" }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit User Modal */}
        {showEditModal && selectedUser && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
                <div>
                  <h3 className="text-2xl font-bold" style={{ fontFamily: "Sugar, serif", color: "#5A0117" }}>
                    Edit User
                  </h3>
                  <p className="text-sm mt-1" style={{ fontFamily: "Montserrat, sans-serif", color: "#8C6141" }}>
                    {getUserId(selectedUser._id)} - {selectedUser.name}
                  </p>
                </div>
                <button
                  onClick={handleCloseEditModal}
                  className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-200 transition-colors"
                >
                  <AiOutlineClose className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Content */}
              <form onSubmit={handleUpdateUser} className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ fontFamily: "Montserrat, sans-serif", color: "#5A0117" }}>
                      Name *
                    </label>
                    <input
                      type="text"
                      value={editFormData.name}
                      onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
                      style={{ fontFamily: "Montserrat, sans-serif", focusRingColor: "#5A0117" }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ fontFamily: "Montserrat, sans-serif", color: "#5A0117" }}>
                      Email *
                    </label>
                    <input
                      type="email"
                      value={editFormData.email}
                      onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
                      style={{ fontFamily: "Montserrat, sans-serif", focusRingColor: "#5A0117" }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ fontFamily: "Montserrat, sans-serif", color: "#5A0117" }}>
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={editFormData.phone}
                      onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
                      style={{ fontFamily: "Montserrat, sans-serif", focusRingColor: "#5A0117" }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ fontFamily: "Montserrat, sans-serif", color: "#5A0117" }}>
                      Role
                    </label>
                    <select
                      value={editFormData.role}
                      onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
                      style={{ fontFamily: "Montserrat, sans-serif", focusRingColor: "#5A0117" }}
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2" style={{ fontFamily: "Montserrat, sans-serif", color: "#5A0117" }}>
                      New Password (leave empty to keep current)
                    </label>
                    <input
                      type="password"
                      value={editFormData.password}
                      onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
                      style={{ fontFamily: "Montserrat, sans-serif", focusRingColor: "#5A0117" }}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={editFormData.emailVerified}
                        onChange={(e) => setEditFormData({ ...editFormData, emailVerified: e.target.checked })}
                        className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                      />
                      <span className="ml-2 text-sm" style={{ fontFamily: "Montserrat, sans-serif", color: "#5A0117" }}>
                        Email is verified
                      </span>
                    </label>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="flex justify-between pt-6 border-t">
                  <button
                    type="button"
                    onClick={handleCloseEditModal}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                    style={{ fontFamily: "Montserrat, sans-serif" }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updating}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    style={{ fontFamily: "Montserrat, sans-serif" }}
                  >
                    {updating ? 'Updating...' : 'Update User'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Create User Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
                <div>
                  <h3 className="text-2xl font-bold" style={{ fontFamily: "Sugar, serif", color: "#5A0117" }}>
                    Create New User
                  </h3>
                  <p className="text-sm mt-1" style={{ fontFamily: "Montserrat, sans-serif", color: "#8C6141" }}>
                    Add a new user to the system
                  </p>
                </div>
                <button
                  onClick={handleCloseCreateModal}
                  className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-200 transition-colors"
                >
                  <AiOutlineClose className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Content */}
              <form onSubmit={handleCreateNewUser} className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ fontFamily: "Montserrat, sans-serif", color: "#5A0117" }}>
                      Name *
                    </label>
                    <input
                      type="text"
                      value={editFormData.name}
                      onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
                      style={{ fontFamily: "Montserrat, sans-serif", focusRingColor: "#5A0117" }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ fontFamily: "Montserrat, sans-serif", color: "#5A0117" }}>
                      Email *
                    </label>
                    <input
                      type="email"
                      value={editFormData.email}
                      onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
                      style={{ fontFamily: "Montserrat, sans-serif", focusRingColor: "#5A0117" }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ fontFamily: "Montserrat, sans-serif", color: "#5A0117" }}>
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={editFormData.phone}
                      onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
                      style={{ fontFamily: "Montserrat, sans-serif", focusRingColor: "#5A0117" }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ fontFamily: "Montserrat, sans-serif", color: "#5A0117" }}>
                      Role
                    </label>
                    <select
                      value={editFormData.role}
                      onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
                      style={{ fontFamily: "Montserrat, sans-serif", focusRingColor: "#5A0117" }}
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2" style={{ fontFamily: "Montserrat, sans-serif", color: "#5A0117" }}>
                      Password
                    </label>
                    <input
                      type="password"
                      value={editFormData.password}
                      onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
                      style={{ fontFamily: "Montserrat, sans-serif", focusRingColor: "#5A0117" }}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={editFormData.emailVerified}
                        onChange={(e) => setEditFormData({ ...editFormData, emailVerified: e.target.checked })}
                        className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                      />
                      <span className="ml-2 text-sm" style={{ fontFamily: "Montserrat, sans-serif", color: "#5A0117" }}>
                        Email is verified
                      </span>
                    </label>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="flex justify-between pt-6 border-t">
                  <button
                    type="button"
                    onClick={handleCloseCreateModal}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                    style={{ fontFamily: "Montserrat, sans-serif" }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                    style={{ fontFamily: "Montserrat, sans-serif" }}
                  >
                    {creating ? 'Creating...' : 'Create User'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
