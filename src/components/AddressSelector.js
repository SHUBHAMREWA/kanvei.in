"use client"
import { useState, useEffect } from "react"
import { useAuth } from "../contexts/AuthContext"
import { useSession } from "next-auth/react"
import { useToast } from "../contexts/ToastContext"
import { AiOutlineHome, AiOutlinePlus, AiOutlineEdit, AiOutlineSave, AiOutlineClose } from "react-icons/ai"
import { MdLocationOn, MdHome } from "react-icons/md"

export default function AddressSelector({ 
  selectedAddress, 
  onAddressSelect, 
  onManualAddress,
  showManualForm = false,
  manualFormData = {},
  onManualFormChange
}) {
  const { data: session } = useSession()
  const { user: authUser, isAuthenticated: customAuth, token: authToken } = useAuth()
  const { showSuccess, showError } = useToast()
  
  const [addresses, setAddresses] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newAddress, setNewAddress] = useState({
    street: "",
    city: "",
    state: "",
    pinCode: "",
    isHomeAddress: false
  })
  const [saving, setSaving] = useState(false)

  const currentUser = session?.user || authUser
  const isUserAuthenticated = (session?.status === "authenticated") || customAuth

  // Fetch user addresses
  useEffect(() => {
    if (!isUserAuthenticated || !currentUser) {
      setLoading(false)
      return
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
          // Auto-select home address if available
          const homeAddress = data.addresses?.find(addr => addr.isHomeAddress)
          if (homeAddress && !selectedAddress) {
            onAddressSelect(homeAddress)
          }
        } else {
          console.error('Error fetching addresses:', data.error)
        }
      } catch (error) {
        console.error('Error fetching addresses:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAddresses()
  }, [isUserAuthenticated, currentUser, authToken])

  const handleAddAddress = async () => {
    if (!newAddress.city.trim()) {
      showError('City is required')
      return
    }

    setSaving(true)
    try {
      const headers = { 'Content-Type': 'application/json' }
      if (authToken && authToken !== 'nextauth_session') {
        headers.Authorization = `Bearer ${authToken}`
      }

      const response = await fetch('/api/user/addresses', {
        method: 'POST',
        headers,
        body: JSON.stringify(newAddress)
      })

      const data = await response.json()
      if (data.success) {
        setAddresses(data.addresses || [])
        setShowAddForm(false)
        setNewAddress({
          street: "",
          city: "",
          state: "",
          pinCode: "",
          isHomeAddress: false
        })
        showSuccess('Address added successfully!')
        
        // Auto-select the new address
        const newAddr = data.addresses?.find(addr => 
          addr.street === newAddress.street && 
          addr.city === newAddress.city && 
          addr.pinCode === newAddress.pinCode
        )
        if (newAddr) {
          onAddressSelect(newAddr)
        }
      } else {
        showError(data.error || 'Failed to add address')
      }
    } catch (error) {
      console.error('Error adding address:', error)
      showError('Failed to add address')
    } finally {
      setSaving(false)
    }
  }

  const formatAddress = (address) => {
    const parts = []
    if (address.street) parts.push(address.street)
    parts.push(address.city)
    if (address.state) parts.push(address.state)
    if (address.pinCode) parts.push(address.pinCode)
    return parts.join(', ')
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold flex items-center gap-2" style={{ fontFamily: "Sugar, serif", color: "#5A0117" }}>
          <MdLocationOn className="w-6 h-6" />
          Delivery Address
        </h2>
        {isUserAuthenticated && addresses.length < 3 && (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 px-3 py-1 text-sm border-2 rounded-lg hover:bg-gray-50 transition-colors"
            style={{ borderColor: "#8C6141", color: "#8C6141", fontFamily: "Montserrat, sans-serif" }}
          >
            <AiOutlinePlus className="w-4 h-4" />
            Add New
          </button>
        )}
      </div>

      {/* Add New Address Form */}
      {showAddForm && (
        <div className="mb-6 p-4 border rounded-lg" style={{ backgroundColor: "#f8f9fa" }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold" style={{ color: "#5A0117" }}>
              Add New Address
            </h3>
            <div className="flex gap-2">
              <button
                onClick={handleAddAddress}
                disabled={saving}
                className="flex items-center gap-2 px-3 py-1 text-sm text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                style={{ backgroundColor: "#5A0117", fontFamily: "Montserrat, sans-serif" }}
              >
                <AiOutlineSave className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="flex items-center gap-2 px-3 py-1 text-sm border rounded-lg hover:bg-gray-50 transition-colors"
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
                value={newAddress.street}
                onChange={(e) => setNewAddress(prev => ({ ...prev, street: e.target.value }))}
                rows="2"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
                style={{ focusRingColor: "#5A0117" }}
                placeholder="Enter street address"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: "#5A0117" }}>
                City *
              </label>
              <input
                type="text"
                value={newAddress.city}
                onChange={(e) => setNewAddress(prev => ({ ...prev, city: e.target.value }))}
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
                value={newAddress.state}
                onChange={(e) => setNewAddress(prev => ({ ...prev, state: e.target.value }))}
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
                value={newAddress.pinCode}
                onChange={(e) => setNewAddress(prev => ({ ...prev, pinCode: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
                style={{ focusRingColor: "#5A0117" }}
                placeholder="Enter PIN code"
              />
            </div>
            <div className="md:col-span-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={newAddress.isHomeAddress}
                  onChange={(e) => setNewAddress(prev => ({ ...prev, isHomeAddress: e.target.checked }))}
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

      {/* Saved Addresses */}
      {isUserAuthenticated && addresses.length > 0 && (
        <div className="space-y-3 mb-6">
          <h3 className="text-sm font-medium" style={{ color: "#5A0117" }}>
            Select from saved addresses:
          </h3>
          {addresses.map((address) => (
            <label key={address._id} className="block">
              <div className={`p-4 border rounded-lg cursor-pointer transition-all ${
                selectedAddress?._id === address._id 
                  ? 'border-red-500 bg-red-50' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}>
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="selectedAddress"
                    value={address._id}
                    checked={selectedAddress?._id === address._id}
                    onChange={() => onAddressSelect(address)}
                    className="mt-1"
                    style={{ accentColor: "#5A0117" }}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <AiOutlineHome className="w-4 h-4" style={{ color: "#8C6141" }} />
                      {address.isHomeAddress && (
                        <MdHome className="w-4 h-4 text-green-600" title="Home Address" />
                      )}
                      {address.isHomeAddress && (
                        <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                          Home
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-medium" style={{ fontFamily: "Montserrat, sans-serif", color: "#5A0117" }}>
                      {formatAddress(address)}
                    </p>
                  </div>
                </div>
              </div>
            </label>
          ))}
        </div>
      )}

      {/* Manual Address Option */}
      {(!isUserAuthenticated || addresses.length === 0) && (
        <div className="mb-4">
          <button
            onClick={() => onManualAddress(!showManualForm)}
            className="flex items-center gap-2 text-sm font-medium"
            style={{ color: "#5A0117", fontFamily: "Montserrat, sans-serif" }}
          >
            <AiOutlineEdit className="w-4 h-4" />
            {showManualForm ? 'Hide Manual Entry' : 'Enter Address Manually'}
          </button>
        </div>
      )}

      {/* Manual Address Form */}
      {showManualForm && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold" style={{ color: "#5A0117" }}>
            Enter Delivery Address
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold mb-2" style={{ color: "#5A0117" }}>
                Full Address *
              </label>
              <textarea
                name="address"
                value={manualFormData.address || ""}
                onChange={onManualFormChange}
                required
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
                style={{ focusRingColor: "#5A0117" }}
                placeholder="Enter complete address"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: "#5A0117" }}>
                City *
              </label>
              <input
                type="text"
                name="city"
                value={manualFormData.city || ""}
                onChange={onManualFormChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
                style={{ focusRingColor: "#5A0117" }}
                placeholder="Enter city"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: "#5A0117" }}>
                State *
              </label>
              <input
                type="text"
                name="state"
                value={manualFormData.state || ""}
                onChange={onManualFormChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
                style={{ focusRingColor: "#5A0117" }}
                placeholder="Enter state"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: "#5A0117" }}>
                PIN Code *
              </label>
              <input
                type="text"
                name="pincode"
                value={manualFormData.pincode || ""}
                onChange={onManualFormChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
                style={{ focusRingColor: "#5A0117" }}
                placeholder="Enter PIN code"
              />
            </div>
          </div>
        </div>
      )}

      {!isUserAuthenticated && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm" style={{ color: "#2563eb", fontFamily: "Montserrat, sans-serif" }}>
            💡 <strong>Tip:</strong> Login to save addresses for faster checkout in future orders.
          </p>
        </div>
      )}
    </div>
  )
}
