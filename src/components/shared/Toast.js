"use client"
import { useState, useEffect } from 'react'
import { AiOutlineCheck, AiOutlineClose, AiOutlineInfo, AiOutlineWarning } from 'react-icons/ai'

const Toast = ({ message, type = 'success', isVisible, onClose, duration = 3000 }) => {
  const [shouldRender, setShouldRender] = useState(false)
  const [animationClass, setAnimationClass] = useState('')

  useEffect(() => {
    if (isVisible) {
      setShouldRender(true)
      // Small delay to trigger enter animation
      setTimeout(() => {
        setAnimationClass('animate-slide-in-right')
      }, 10)

      // Auto close after duration
      const timer = setTimeout(() => {
        handleClose()
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [isVisible, duration])

  const handleClose = () => {
    setAnimationClass('animate-slide-out-right')
    // Wait for animation to complete before hiding
    setTimeout(() => {
      setShouldRender(false)
      setAnimationClass('')
      onClose()
    }, 300)
  }

  if (!shouldRender) return null

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <AiOutlineCheck className="w-5 h-5 text-green-600" />
      case 'error':
        return <AiOutlineClose className="w-5 h-5 text-red-600" />
      case 'warning':
        return <AiOutlineWarning className="w-5 h-5 text-orange-600" />
      case 'info':
        return <AiOutlineInfo className="w-5 h-5 text-blue-600" />
      default:
        return <AiOutlineCheck className="w-5 h-5 text-green-600" />
    }
  }

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200'
      case 'error':
        return 'bg-red-50 border-red-200'
      case 'warning':
        return 'bg-orange-50 border-orange-200'
      case 'info':
        return 'bg-blue-50 border-blue-200'
      default:
        return 'bg-green-50 border-green-200'
    }
  }

  const getTextColor = () => {
    switch (type) {
      case 'success':
        return 'text-green-800'
      case 'error':
        return 'text-red-800'
      case 'warning':
        return 'text-orange-800'
      case 'info':
        return 'text-blue-800'
      default:
        return 'text-green-800'
    }
  }

  return (
    <div className={`fixed top-20 right-4 z-50 transform transition-all duration-300 ease-out ${animationClass}`}>
      <div className={`
        flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border-2 min-w-[300px] max-w-[400px]
        ${getBackgroundColor()}
      `}>
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        <div className={`flex-1 text-sm font-medium ${getTextColor()}`}>
          {message}
        </div>
        <button
          onClick={handleClose}
          className={`flex-shrink-0 p-1 rounded-full hover:bg-gray-200 transition-colors ${getTextColor()}`}
        >
          <AiOutlineClose className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

export default Toast
