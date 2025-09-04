"use client"
import { createContext, useContext, useState, useCallback } from 'react'
import Toast from '../components/shared/Toast'

const ToastContext = createContext()

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([])

  const showToast = useCallback((message, type = 'success', duration = 3000) => {
    const id = Date.now() + Math.random() // Simple unique ID
    const newToast = {
      id,
      message,
      type,
      duration,
      isVisible: true
    }

    setToasts(prev => [...prev, newToast])
  }, [])

  const hideToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  // Convenience methods
  const showSuccess = useCallback((message, duration) => {
    showToast(message, 'success', duration)
  }, [showToast])

  const showError = useCallback((message, duration) => {
    showToast(message, 'error', duration)
  }, [showToast])

  const showWarning = useCallback((message, duration) => {
    showToast(message, 'warning', duration)
  }, [showToast])

  const showInfo = useCallback((message, duration) => {
    showToast(message, 'info', duration)
  }, [showToast])

  const value = {
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      
      {/* Render all active toasts */}
      <div className="toast-container">
        {toasts.map((toast, index) => (
          <div 
            key={toast.id} 
            className="relative"
            style={{ 
              zIndex: 1000 + index,
              marginTop: index > 0 ? `${index * 80}px` : '0'
            }}
          >
            <Toast
              message={toast.message}
              type={toast.type}
              isVisible={toast.isVisible}
              duration={toast.duration}
              onClose={() => hideToast(toast.id)}
            />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
