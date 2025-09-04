"use client"
import React, { createContext, useContext, useState, useCallback } from "react"

const NotificationContext = createContext()

export const useNotification = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error("useNotification must be used within a NotificationProvider")
  }
  return context
}

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([])

  const showNotification = useCallback((message, type = "info", duration = 3000) => {
    const id = Date.now() + Math.random()
    const notification = {
      id,
      message,
      type, // success, error, info, warning
      duration
    }

    setNotifications(prev => [...prev, notification])

    // Auto remove notification
    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id)
      }, duration)
    }

    return id
  }, [])

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id))
  }, [])

  const showSuccess = useCallback((message, duration) => {
    return showNotification(message, "success", duration)
  }, [showNotification])

  const showError = useCallback((message, duration) => {
    return showNotification(message, "error", duration)
  }, [showNotification])

  const showInfo = useCallback((message, duration) => {
    return showNotification(message, "info", duration)
  }, [showNotification])

  const showWarning = useCallback((message, duration) => {
    return showNotification(message, "warning", duration)
  }, [showNotification])

  const value = {
    notifications,
    showNotification,
    removeNotification,
    showSuccess,
    showError,
    showInfo,
    showWarning
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}
