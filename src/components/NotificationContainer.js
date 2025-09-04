"use client"
import React, { useState, useEffect } from "react"
import { useNotification } from "../contexts/NotificationContext"
import { X, CheckCircle, XCircle, Info, AlertTriangle } from "lucide-react"

// Single notification component with enhanced animations
const NotificationItem = ({ notification, onRemove }) => {
  const [isVisible, setIsVisible] = useState(false)
  const [isRemoving, setIsRemoving] = useState(false)

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setIsVisible(true), 10)
    return () => clearTimeout(timer)
  }, [])

  const handleRemove = () => {
    setIsRemoving(true)
    setTimeout(() => onRemove(notification.id), 300) // Wait for exit animation
  }

  const getIcon = (type) => {
    const iconClass = "w-5 h-5 animate-pulse"
    switch (type) {
      case "success":
        return <CheckCircle className={`${iconClass} text-green-500`} />
      case "error":
        return <XCircle className={`${iconClass} text-red-500`} />
      case "warning":
        return <AlertTriangle className={`${iconClass} text-yellow-500`} />
      default:
        return <Info className={`${iconClass} text-blue-500`} />
    }
  }

  const getStyles = (type) => {
    switch (type) {
      case "success":
        return {
          bg: "bg-gradient-to-r from-green-50 to-green-100",
          border: "border-green-300",
          text: "text-green-900",
          shadow: "shadow-green-200/50"
        }
      case "error":
        return {
          bg: "bg-gradient-to-r from-red-50 to-red-100",
          border: "border-red-300",
          text: "text-red-900",
          shadow: "shadow-red-200/50"
        }
      case "warning":
        return {
          bg: "bg-gradient-to-r from-yellow-50 to-yellow-100",
          border: "border-yellow-300",
          text: "text-yellow-900",
          shadow: "shadow-yellow-200/50"
        }
      default:
        return {
          bg: "bg-gradient-to-r from-blue-50 to-blue-100",
          border: "border-blue-300",
          text: "text-blue-900",
          shadow: "shadow-blue-200/50"
        }
    }
  }

  const styles = getStyles(notification.type)
  
  return (
    <div
      className={`
        relative overflow-hidden
        transform transition-all duration-500 ease-out
        ${isVisible && !isRemoving ? 'translate-x-0 opacity-100 scale-100' : 'translate-x-full opacity-0 scale-95'}
        ${isRemoving ? 'translate-x-full opacity-0 scale-95' : ''}
      `}
    >
      <div
        className={`
          flex items-center gap-3 p-4 rounded-xl border-2 
          min-w-[320px] max-w-[420px] backdrop-blur-sm
          hover:scale-105 hover:shadow-2xl
          transition-all duration-300 ease-out cursor-default
          ${styles.bg} ${styles.border} ${styles.shadow}
          shadow-xl hover:shadow-2xl
        `}
      >
        {/* Icon with bounce animation */}
        <div className="animate-bounce">
          {getIcon(notification.type)}
        </div>
        
        {/* Message content */}
        <div className={`flex-1 ${styles.text}`}>
          <p className="text-sm font-semibold tracking-wide animate-fade-in">
            {notification.message}
          </p>
        </div>
        
        {/* Close button with hover effects */}
        <button
          onClick={handleRemove}
          className={`
            p-2 rounded-full transition-all duration-200
            hover:bg-white/30 hover:rotate-90 hover:scale-110
            active:scale-95 ${styles.text}
          `}
          aria-label="Close notification"
        >
          <X className="w-4 h-4" />
        </button>
        
        {/* Progress bar for auto-dismiss */}
        {notification.duration > 0 && (
          <div className="absolute bottom-0 left-0 h-1 bg-white/30 rounded-full overflow-hidden">
            <div 
              className="h-full bg-white/60 animate-shrink-width" 
              style={{
                animation: `shrink-width ${notification.duration}ms linear forwards`
              }}
            />
          </div>
        )}
      </div>
    </div>
  )
}

const NotificationContainer = () => {
  const { notifications, removeNotification } = useNotification()

  if (notifications.length === 0) return null

  return (
    <>
      {/* Custom CSS for animations */}
      <style jsx global>{`
        @keyframes shrink-width {
          from { width: 100%; }
          to { width: 0%; }
        }
        
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-shrink-width {
          animation: shrink-width var(--duration, 3000ms) linear forwards;
        }
        
        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }
      `}</style>
      
      {/* Notification container with stacked animations */}
      <div className="fixed top-6 right-6 z-[9999] space-y-3 pointer-events-none">
        <div className="space-y-3 pointer-events-auto">
          {notifications.map((notification, index) => (
            <div
              key={notification.id}
              style={{
                animationDelay: `${index * 100}ms`,
                zIndex: 9999 - index
              }}
            >
              <NotificationItem
                notification={notification}
                onRemove={removeNotification}
              />
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

export default NotificationContainer
