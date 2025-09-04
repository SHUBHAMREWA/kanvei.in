"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Header from "../../components/shared/Header"
import Footer from "../../components/shared/Footer"
import { useAuth } from "../../contexts/AuthContext"
import { useSession } from "next-auth/react"
import { useToast } from "../../contexts/ToastContext"
import Link from "next/link"
import { AiOutlineUser, AiOutlineEdit, AiOutlineSave, AiOutlineClose, AiOutlinePlus, AiOutlineDelete, AiOutlineHome, AiOutlineMail, AiOutlinePhone } from "react-icons/ai"
import { MdLocationOn, MdVerifiedUser, MdSecurity, MdHome } from "react-icons/md"

export default function ProfilePage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const { user: authUser, isAuthenticated: customAuth, token: authToken } = useAuth()
  const { showSuccess, showError, showInfo } = useToast()
  
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [editAddressMode, setEditAddressMode] = useState(false)
  const [showAddAddress, setShowAddAddress] = useState(false)
  
  // Determine current user from either session or custom auth
  const currentUser = session?.user || authUser
  const isUserAuthenticated = (status === "authenticated") || customAuth
  
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    phone: ""
  })
  
  const [addresses, setAddresses] = useState([])
  const [addressCount, setAddressCount] = useState(0)
  const [maxAddresses, setMaxAddresses] = useState(3)
  
  const [tempProfileData, setTempProfileData] = useState({})
  const [tempAddressData, setTempAddressData] = useState({
    street: "",
    city: "",
    state: "",
    pinCode: "",
    isHomeAddress: false
  })
  const [editingAddressId, setEditingAddressId] = useState(null)

  // Check authentication and redirect if not logged in
  useEffect(() => {
    if (status === "loading") return // Still loading

    if (!isUserAuthenticated) {
      router.push('/login')
      return
    }

    // Redirect admin to dashboard
    if (currentUser?.role === "admin") {
      router.push('/admindashboard')
      return
    }

    setLoading(false)
  }, [status, isUserAuthenticated, currentUser, router])

  // Fetch user profile and addresses
  useEffect(() => {
    if (!currentUser?._id && !currentUser?.id) return

    const fetchProfile = async () => {
      try {
        const headers = { 'Content-Type': 'application/json' }
        if (authToken && authToken !== 'nextauth_session') {
          headers.Authorization = `Bearer ${authToken}`
        }

        const response = await fetch('/api/user/profile', { headers })
        const data = await response.json()

        if (data.success) {
          setProfileData({
            name: data.user.name || "",
            email: data.user.email || "",
            phone: data.user.phone || ""
          })
        }
      } catch (error) {
        console.error('Error fetching profile:', error)
        showError('Failed to load profile data')
      }
    }

    const fetchAddresses = async () => {
      try {
        const headers = { 'Content-Type': 'application/json' }
        if (authToken && authToken !== 'nextauth_session') {
          headers.Authorization = `Bearer ${authToken}`
        }

        const response = await fetch('/api/user/addresses', { headers })
        const data = await response.json()

        if (data.success) {
          setAddresses(data.addresses || [])
          setAddressCount(data.count || 0)
          setMaxAddresses(data.maxAddresses || 3)
        }
      } catch (error) {
        console.error('Error fetching addresses:', error)
        showError('Failed to load addresses')
      }
    }

    if (isUserAuthenticated && !loading) {
      fetchProfile()
      fetchAddresses()
    }
  }, [currentUser, isUserAuthenticated, loading, authToken, showError])

  // Profile handlers
  const handleEditProfile = () => {
    setTempProfileData({
      name: profileData.name,
      phone: profileData.phone
    })
    setEditMode(true)
  }

  const handleSaveProfile = async () => {
    if (!tempProfileData.name.trim()) {
      showError('Name is required')
      return
    }

    setUpdating(true)
    try {
      const headers = { 'Content-Type': 'application/json' }
      if (authToken && authToken !== 'nextauth_session') {
        headers.Authorization = `Bearer ${authToken}`
      }

      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          name: tempProfileData.name,
          phone: tempProfileData.phone
        })
      })

      const data = await response.json()
      if (data.success) {
        setProfileData(prev => ({
          ...prev,
          name: tempProfileData.name,
          phone: tempProfileData.phone
        }))
        setEditMode(false)
        showSuccess('Profile updated successfully!')
      } else {
        showError(data.error || 'Failed to update profile')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      showError('Failed to update profile')
    } finally {
      setUpdating(false)
    }
  }

  // Address handlers
  const handleAddAddress = () => {
    if (addressCount >= maxAddresses) {
      showError(`Maximum ${maxAddresses} addresses allowed`)
      return
    }
    
    setTempAddressData({
      street: "",
      city: "",
      state: "",
      pinCode: "",
      isHomeAddress: false
    })
    setEditingAddressId(null)
    setShowAddAddress(true)
    setEditAddressMode(false)
  }

  const handleEditAddress = (address) => {
    setTempAddressData({
      street: address.street || "",
      city: address.city || "",
      state: address.state || "",
      pinCode: address.pinCode || "",
      isHomeAddress: address.isHomeAddress || false
    })
    setEditingAddressId(address._id)
    setEditAddressMode(true)
    setShowAddAddress(false)
  }

  const handleSaveAddress = async () => {
    if (!tempAddressData.city.trim()) {
      showError('City is required')
      return
    }

    setUpdating(true)
    try {
      const headers = { 'Content-Type': 'application/json' }
      if (authToken && authToken !== 'nextauth_session') {
        headers.Authorization = `Bearer ${authToken}`
      }

      const url = editingAddressId ? '/api/user/addresses' : '/api/user/addresses'
      const method = editingAddressId ? 'PUT' : 'POST'
      const body = editingAddressId 
        ? { ...tempAddressData, addressId: editingAddressId }
        : tempAddressData

      const response = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(body)
      })

      const data = await response.json()
      if (data.success) {
        setAddresses(data.addresses || [])
        setAddressCount(data.count || 0)
        setEditAddressMode(false)
        setShowAddAddress(false)
        setEditingAddressId(null)
        showSuccess(data.message || 'Address saved successfully!')
      } else {
        showError(data.error || 'Failed to save address')
      }
    } catch (error) {
      console.error('Error saving address:', error)
      showError('Failed to save address')
    } finally {
      setUpdating(false)
    }
  }

  const handleDeleteAddress = async (addressId) => {
    if (!confirm('Are you sure you want to delete this address?')) return

    setUpdating(true)
    try {
      const headers = { 'Content-Type': 'application/json' }
      if (authToken && authToken !== 'nextauth_session') {
        headers.Authorization = `Bearer ${authToken}`
      }

      const response = await fetch(`/api/user/addresses?id=${addressId}`, {
        method: 'DELETE',
        headers
      })

      const data = await response.json()
      if (data.success) {
        setAddresses(data.addresses || [])
        setAddressCount(data.count || 0)
        showSuccess('Address deleted successfully!')
      } else {
        showError(data.error || 'Failed to delete address')
      }
    } catch (error) {
      console.error('Error deleting address:', error)
      showError('Failed to delete address')
    } finally {
      setUpdating(false)
    }
  }

  const cancelEdit = () => {
    setEditMode(false)
    setEditAddressMode(false)
    setShowAddAddress(false)
    setEditingAddressId(null)
    setTempProfileData({})
    setTempAddressData({
      street: "",
      city: "",
      state: "",
      pinCode: "",
      isHomeAddress: false
    })
  }

  // Loading state
  if (loading || status === "loading") {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: "#5A0117" }}></div>
            <p style={{ fontFamily: "Montserrat, sans-serif", color: "#8C6141" }}>Loading profile...</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  // Not authenticated
  if (!isUserAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto p-8">
            <div className="mb-8">
              <MdSecurity className="mx-auto h-24 w-24 opacity-50" style={{ color: "#8C6141" }} />
            </div>
            <h1 className="text-2xl font-bold mb-4" style={{ fontFamily: "Sugar, serif", color: "#5A0117" }}>
              Access Restricted
            </h1>
            <p className="text-lg mb-6" style={{ fontFamily: "Montserrat, sans-serif", color: "#8C6141" }}>
              Please login to access your profile.
            </p>
            <Link
              href="/login"
              className="inline-block px-6 py-3 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity"
              style={{ backgroundColor: "#5A0117", fontFamily: "Montserrat, sans-serif" }}
            >
              Login Now
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold flex items-center gap-3" style={{ fontFamily: "Sugar, serif", color: "#5A0117" }}>
              <AiOutlineUser className="w-8 h-8" />
              My Profile
            </h1>
            <p className="mt-2" style={{ fontFamily: "Montserrat, sans-serif", color: "#8C6141" }}>
              Manage your account information and preferences
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Information */}
            <div className="lg:col-span-2">
              {/* Personal Information */}
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold" style={{ fontFamily: "Sugar, serif", color: "#5A0117" }}>
                    Personal Information
                  </h2>
                  {!editMode ? (
                    <button
                      onClick={handleEditProfile}
                      className="flex items-center gap-2 px-4 py-2 border-2 rounded-lg hover:bg-gray-50 transition-colors"
                      style={{ borderColor: "#8C6141", color: "#8C6141", fontFamily: "Montserrat, sans-serif" }}
                    >
                      <AiOutlineEdit className="w-4 h-4" />
                      Edit
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveProfile}
                        disabled={updating}
                        className="flex items-center gap-2 px-4 py-2 text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                        style={{ backgroundColor: "#5A0117", fontFamily: "Montserrat, sans-serif" }}
                      >
                        <AiOutlineSave className="w-4 h-4" />
                        {updating ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="flex items-center gap-2 px-4 py-2 border-2 rounded-lg hover:bg-gray-50 transition-colors"
                        style={{ borderColor: "#8C6141", color: "#8C6141", fontFamily: "Montserrat, sans-serif" }}
                      >
                        <AiOutlineClose className="w-4 h-4" />
                        Cancel
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: "#5A0117" }}>
                      Full Name
                    </label>
                    {editMode ? (
                      <input
                        type="text"
                        value={tempProfileData.name || ""}
                        onChange={(e) => setTempProfileData(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
                        style={{ focusRingColor: "#5A0117" }}
                        placeholder="Enter your full name"
                      />
                    ) : (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <AiOutlineUser className="w-5 h-5" style={{ color: "#8C6141" }} />
                        <span style={{ fontFamily: "Montserrat, sans-serif", color: "#5A0117" }}>
                          {profileData.name || "Not provided"}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: "#5A0117" }}>
                      Email Address
                    </label>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <AiOutlineMail className="w-5 h-5" style={{ color: "#8C6141" }} />
                      <span style={{ fontFamily: "Montserrat, sans-serif", color: "#5A0117" }}>
                        {profileData.email}
                      </span>
                      {currentUser?.emailVerified && (
                        <MdVerifiedUser className="w-5 h-5 text-green-600" title="Verified" />
                      )}
                    </div>
                    <p className="text-xs mt-1 text-gray-500">Email cannot be changed</p>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: "#5A0117" }}>
                      Phone Number
                    </label>
                    {editMode ? (
                      <input
                        type="tel"
                        value={tempProfileData.phone || ""}
                        onChange={(e) => setTempProfileData(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
                        style={{ focusRingColor: "#5A0117" }}
                        placeholder="Enter your phone number"
                      />
                    ) : (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <AiOutlinePhone className="w-5 h-5" style={{ color: "#8C6141" }} />
                        <span style={{ fontFamily: "Montserrat, sans-serif", color: "#5A0117" }}>
                          {profileData.phone || "Not provided"}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Account Type */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: "#5A0117" }}>
                      Account Type
                    </label>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <MdVerifiedUser className="w-5 h-5" style={{ color: "#8C6141" }} />
                      <span style={{ fontFamily: "Montserrat, sans-serif", color: "#5A0117" }}>
                        {currentUser?.googleId ? 'Google Account' : currentUser?.facebookId ? 'Facebook Account' : 'Regular Account'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Address Section */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold flex items-center gap-2" style={{ fontFamily: "Sugar, serif", color: "#5A0117" }}>
                    <MdLocationOn className="w-6 h-6" />
                    My Addresses ({addressCount}/{maxAddresses})
                  </h2>
                  {!editAddressMode && !showAddAddress && (
                    <button
                      onClick={handleAddAddress}
                      disabled={addressCount >= maxAddresses}
                      className="flex items-center gap-2 px-4 py-2 text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ backgroundColor: "#5A0117", fontFamily: "Montserrat, sans-serif" }}
                    >
                      <AiOutlinePlus className="w-4 h-4" />
                      Add Address {addressCount >= maxAddresses ? '(Max Reached)' : ''}
                    </button>
                  )}
                </div>

                {/* Address Form */}
                {(editAddressMode || showAddAddress) && (
                  <div className="mb-6 p-4 border rounded-lg" style={{ backgroundColor: "#f8f9fa" }}>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold" style={{ color: "#5A0117" }}>
                        {editingAddressId ? 'Edit Address' : 'Add New Address'}
                      </h3>
                      <div className="flex gap-2">
                        <button
                          onClick={handleSaveAddress}
                          disabled={updating}
                          className="flex items-center gap-2 px-4 py-2 text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                          style={{ backgroundColor: "#5A0117", fontFamily: "Montserrat, sans-serif" }}
                        >
                          <AiOutlineSave className="w-4 h-4" />
                          {updating ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="flex items-center gap-2 px-4 py-2 border-2 rounded-lg hover:bg-gray-50 transition-colors"
                          style={{ borderColor: "#8C6141", color: "#8C6141", fontFamily: "Montserrat, sans-serif" }}
                        >
                          <AiOutlineClose className="w-4 h-4" />
                          Cancel
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-2" style={{ color: "#5A0117" }}>
                          Street Address
                        </label>
                        <textarea
                          value={tempAddressData.street}
                          onChange={(e) => setTempAddressData(prev => ({ ...prev, street: e.target.value }))}
                          rows="2"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
                          style={{ focusRingColor: "#5A0117" }}
                          placeholder="Enter your street address"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: "#5A0117" }}>
                          City *
                        </label>
                        <input
                          type="text"
                          value={tempAddressData.city}
                          onChange={(e) => setTempAddressData(prev => ({ ...prev, city: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
                          style={{ focusRingColor: "#5A0117" }}
                          placeholder="Enter city"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: "#5A0117" }}>
                          State
                        </label>
                        <input
                          type="text"
                          value={tempAddressData.state}
                          onChange={(e) => setTempAddressData(prev => ({ ...prev, state: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
                          style={{ focusRingColor: "#5A0117" }}
                          placeholder="Enter state"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-2" style={{ color: "#5A0117" }}>
                          PIN Code
                        </label>
                        <input
                          type="text"
                          value={tempAddressData.pinCode}
                          onChange={(e) => setTempAddressData(prev => ({ ...prev, pinCode: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
                          style={{ focusRingColor: "#5A0117" }}
                          placeholder="Enter PIN code"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={tempAddressData.isHomeAddress}
                            onChange={(e) => setTempAddressData(prev => ({ ...prev, isHomeAddress: e.target.checked }))}
                            className="rounded border-gray-300"
                          />
                          <span className="text-sm font-medium" style={{ color: "#5A0117" }}>
                            Mark as Home Address
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {/* Address List */}
                {addresses.length === 0 && !editAddressMode && !showAddAddress ? (
                  <div className="text-center py-8">
                    <AiOutlineHome className="mx-auto w-16 h-16 mb-4 opacity-30" style={{ color: "#8C6141" }} />
                    <p className="text-lg mb-2" style={{ fontFamily: "Montserrat, sans-serif", color: "#8C6141" }}>
                      No addresses added yet
                    </p>
                    <p className="text-sm text-gray-500">Add your first address for faster checkout</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {addresses.map((address) => (
                      <div key={address._id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            <div className="flex items-center gap-2">
                              <AiOutlineHome className="w-5 h-5 mt-1" style={{ color: "#8C6141" }} />
                              {address.isHomeAddress && (
                                <MdHome className="w-4 h-4 text-green-600" title="Home Address" />
                              )}
                            </div>
                            <div style={{ fontFamily: "Montserrat, sans-serif", color: "#5A0117" }}>
                              {address.street && <p className="font-medium">{address.street}</p>}
                              <p>
                                {address.city}
                                {address.state && `, ${address.state}`}
                                {address.pinCode && ` - ${address.pinCode}`}
                              </p>
                              {address.isHomeAddress && (
                                <span className="inline-block mt-1 px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                                  Home Address
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <button
                              onClick={() => handleEditAddress(address)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit Address"
                            >
                              <AiOutlineEdit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteAddress(address._id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete Address"
                            >
                              <AiOutlineDelete className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-6 sticky top-8">
                <h3 className="text-lg font-bold mb-4" style={{ fontFamily: "Sugar, serif", color: "#5A0117" }}>
                  Quick Actions
                </h3>
                <div className="space-y-3">
                  <Link
                    href="/orders"
                    className="block w-full px-4 py-3 text-center border-2 rounded-lg hover:bg-gray-50 transition-colors"
                    style={{ borderColor: "#8C6141", color: "#8C6141", fontFamily: "Montserrat, sans-serif" }}
                  >
                    My Orders
                  </Link>
                  <Link
                    href="/wishlist"
                    className="block w-full px-4 py-3 text-center border-2 rounded-lg hover:bg-gray-50 transition-colors"
                    style={{ borderColor: "#8C6141", color: "#8C6141", fontFamily: "Montserrat, sans-serif" }}
                  >
                    My Wishlist
                  </Link>
                  <Link
                    href="/cart"
                    className="block w-full px-4 py-3 text-center text-white rounded-lg hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: "#5A0117", fontFamily: "Montserrat, sans-serif" }}
                  >
                    My Cart
                  </Link>
                </div>

                {/* Address Summary */}
                <div className="mt-6 pt-6 border-t">
                  <h4 className="text-md font-semibold mb-3" style={{ color: "#5A0117" }}>
                    Address Summary
                  </h4>
                  <div className="text-sm space-y-2" style={{ fontFamily: "Montserrat, sans-serif", color: "#8C6141" }}>
                    <div className="flex justify-between">
                      <span>Total Addresses:</span>
                      <span className="font-medium">{addressCount}/{maxAddresses}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Home Address:</span>
                      <span className={addresses.some(addr => addr.isHomeAddress) ? "text-green-600" : "text-orange-600"}>
                        {addresses.some(addr => addr.isHomeAddress) ? "Set" : "Not Set"}
                      </span>
                    </div>
                    {addressCount < maxAddresses && (
                      <div className="flex justify-between">
                        <span>Remaining:</span>
                        <span className="text-blue-600 font-medium">{maxAddresses - addressCount}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Account Stats */}
                <div className="mt-6 pt-6 border-t">
                  <h4 className="text-md font-semibold mb-3" style={{ color: "#5A0117" }}>
                    Account Overview
                  </h4>
                  <div className="text-sm space-y-2" style={{ fontFamily: "Montserrat, sans-serif", color: "#8C6141" }}>
                    <div className="flex justify-between">
                      <span>Member since:</span>
                      <span>{new Date(currentUser?.createdAt || Date.now()).getFullYear()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Account status:</span>
                      <span className="text-green-600 font-medium">Active</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Email verified:</span>
                      <span className={currentUser?.emailVerified ? "text-green-600" : "text-orange-600"}>
                        {currentUser?.emailVerified ? "Yes" : "No"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
