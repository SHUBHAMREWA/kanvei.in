"use client" 

import { createContext, useContext, useReducer, useEffect } from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { toast } from "../hooks/use-toast"

const AuthContext = createContext()

const authReducer = (state, action) => {

  switch (action.type) {
    case "LOGIN":
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        loading: false,
      }
    case "LOGOUT":
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
      }
    case "SET_LOADING":
      return {
        ...state,
        loading: action.payload,
      }
    case "LOAD_USER":
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        loading: false,
      }
    default:
      return state
  }
}

export function AuthProvider({ children }) {
  
  const router = useRouter()
  const { data: session, status } = useSession()
  const [state, dispatch] = useReducer(authReducer, {
    user: null,
    token: null,
    isAuthenticated: false,
    loading: true,
  })

  // Immediate check for localStorage auth on component mount (before NextAuth loads)
  useEffect(() => {
    // Only run once on mount
    const token = localStorage.getItem("kanvei-token")
    const user = localStorage.getItem("kanvei-user")
    
    if (token && user) {
      try {
        const parsedUser = JSON.parse(user)
        console.log("⚡ Immediate localStorage load:", parsedUser.email)
        dispatch({
          type: "LOAD_USER",
          payload: {
            token,
            user: parsedUser,
          },
        })
      } catch (error) {
        console.error("❌ Invalid localStorage data on mount, clearing:", error)
        localStorage.removeItem("kanvei-token")
        localStorage.removeItem("kanvei-user")
      }
    }
  }, []) // Run only once on mount

  // Load user from localStorage or NextAuth session when status changes
  useEffect(() => {
    console.log("🔄 Auth status changed:", { status, hasSession: !!session })
    
    // Check NextAuth session first
    if (status === 'loading') {
      dispatch({ type: "SET_LOADING", payload: true })
      return
    }
    
    if (status === 'authenticated' && session?.user) {
      console.log("✅ NextAuth session found:", session.user.email)
      
      // Clear any custom auth localStorage when using NextAuth
      localStorage.removeItem("kanvei-token")
      localStorage.removeItem("kanvei-user")
      
      // Check if this is a new login (not just a page refresh)
      const wasAuthenticated = state.isAuthenticated
      
      // User is authenticated via NextAuth
      dispatch({
        type: "LOGIN",
        payload: {
          user: {
            _id: session.user.id,
            name: session.user.name,
            email: session.user.email,
            role: session.user.role || 'user',
            phone: session.user.phone
          },
          token: 'nextauth_session' // Placeholder token for NextAuth sessions
        },
      })
      
      // Show notification only for new social logins (not on page refresh)
      const isPendingSocialLogin = typeof window !== 'undefined' && 
        sessionStorage.getItem('social-login-pending') === 'true'
      
      // Only show notification if there was a pending social login
      if (!wasAuthenticated && session.user.name && isPendingSocialLogin) {
        console.log('🔔 Showing social login success notification for:', session.user.name)
        const currentTime = new Date().toLocaleString('en-IN', {
          timeZone: 'Asia/Kolkata',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        })
        toast({
          variant: "success",
          title: "Social Login Successful! 🎉",
          description: `Welcome, ${session.user.name}! Logged in at ${currentTime}`,
        })
        
        // Clear the pending flag after showing notification
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('social-login-pending')
        }
      }
      
      return
    }

    // Always check localStorage for custom auth (don't depend only on NextAuth status)
    const token = localStorage.getItem("kanvei-token")
    const user = localStorage.getItem("kanvei-user")
    
    console.log("🔍 Checking localStorage:", { hasToken: !!token, hasUser: !!user })

    if (token && user) {
      try {
        const parsedUser = JSON.parse(user)
        console.log("✅ Loading user from localStorage:", parsedUser.email)
        dispatch({
          type: "LOAD_USER",
          payload: {
            token,
            user: parsedUser,
          },
        })
      } catch (error) {
        console.error("❌ Invalid localStorage data, clearing:", error)
        // Clear invalid localStorage data
        localStorage.removeItem("kanvei-token")
        localStorage.removeItem("kanvei-user")
        dispatch({ type: "SET_LOADING", payload: false })
      }
    } else {
      console.log("ℹ️ No localStorage auth found, user not authenticated")
      dispatch({ type: "SET_LOADING", payload: false })
    }
  }, [session, status])

  // Save to localStorage whenever auth state changes
  useEffect(() => {
    if (state.isAuthenticated && state.token && state.user) {
      // Don't save NextAuth sessions to localStorage
      if (state.token !== 'nextauth_session') {
        localStorage.setItem("kanvei-token", state.token)
        localStorage.setItem("kanvei-user", JSON.stringify(state.user))
      }
    } else {
      localStorage.removeItem("kanvei-token")
      localStorage.removeItem("kanvei-user")
    }
  }, [state.isAuthenticated, state.token, state.user])

  const login = async (email, password) => {
    try {
      dispatch({ type: "SET_LOADING", payload: true })

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (data.success) {
        dispatch({
          type: "LOGIN",
          payload: {
            user: data.user,
            token: data.token,
          },
        })
        
        // Show success notification
        console.log('🔔 Showing login success notification')
        const currentTime = new Date().toLocaleString('en-IN', {
          timeZone: 'Asia/Kolkata',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        })
        toast({
          variant: "success",
          title: "Login Successful! ✅",
          description: `Welcome back, ${data.user.name}! Logged in at ${currentTime}`,
        })
        console.log('🔔 Login notification triggered')
        
        return { success: true, user: data.user, token: data.token }
      } else {
        dispatch({ type: "SET_LOADING", payload: false })
        return { success: false, error: data.error }
      }
    } catch (error) {
      dispatch({ type: "SET_LOADING", payload: false })
      return { success: false, error: "Network error" }
    }
  }

  const loginWithOTP = async (email, otp) => {
    try {
      dispatch({ type: "SET_LOADING", payload: true })

      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, otp, type: "login" }),
      })

      const data = await response.json()

      if (data.success) {
        dispatch({
          type: "LOGIN",
          payload: {
            user: data.user,
            token: data.token,
          },
        })
        
        // Show success notification
        const currentTime = new Date().toLocaleString('en-IN', {
          timeZone: 'Asia/Kolkata',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        })
        toast({
          variant: "success",
          title: "OTP Verification Successful! ✅",
          description: `Welcome back, ${data.user.name}! Logged in at ${currentTime}`,
        })
        
        return { success: true }
      } else {
        dispatch({ type: "SET_LOADING", payload: false })
        return { success: false, error: data.error }
      }
    } catch (error) {
      dispatch({ type: "SET_LOADING", payload: false })
      return { success: false, error: "Network error" }
    }
  }

  const loginWithGoogle = async (googleToken) => {
    try {
      dispatch({ type: "SET_LOADING", payload: true })

      const response = await fetch("/api/auth/google", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ googleToken }),
      })

      const data = await response.json()

      if (data.success) {
        dispatch({
          type: "LOGIN",
          payload: {
            user: data.user,
            token: data.token,
          },
        })
        
        // Show success notification for Google login
        toast({
          variant: "success",
          title: "Google Login Successful!",
          description: `Welcome, ${data.user.name}!`,
        })
        
        return { success: true }
      } else {
        dispatch({ type: "SET_LOADING", payload: false })
        return { success: false, error: data.error }
      }
    } catch (error) {
      dispatch({ type: "SET_LOADING", payload: false })
      return { success: false, error: "Network error" }
    }
  }

  const loginWithFacebook = async (facebookToken) => {
    try {
      dispatch({ type: "SET_LOADING", payload: true })

      const response = await fetch("/api/auth/facebook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ facebookToken }),
      })

      const data = await response.json()

      if (data.success) {
        dispatch({
          type: "LOGIN",
          payload: {
            user: data.user,
            token: data.token,
          },
        })
        
        // Show success notification for Facebook login
        toast({
          variant: "success",
          title: "Facebook Login Successful!",
          description: `Welcome, ${data.user.name}!`,
        })
        
        return { success: true }
      } else {
        dispatch({ type: "SET_LOADING", payload: false })
        return { success: false, error: data.error }
      }
    } catch (error) {
      dispatch({ type: "SET_LOADING", payload: false })
      return { success: false, error: "Network error" }
    }
  }

  const sendOTP = async (email, type) => {
    try {
      const response = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, type }),
      })

      const data = await response.json()
      return data
    } catch (error) {
      return { success: false, error: "Network error" }
    }
  }

  const register = async (name, email, password) => {
    try {
      dispatch({ type: "SET_LOADING", payload: true })

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
      })

      const data = await response.json()

      if (data.success) {
        dispatch({
          type: "LOGIN",
          payload: {
            user: data.user,
            token: data.token,
          },
        })
        
        // Show success notification for registration
        toast({
          variant: "success",
          title: "Registration Successful!",
          description: `Your account has been created, ${data.user.name}!`,
        })
        
        return { success: true }
      } else {
        dispatch({ type: "SET_LOADING", payload: false })
        return { success: false, error: data.error }
      }
    } catch (error) {
      dispatch({ type: "SET_LOADING", payload: false })
      return { success: false, error: "Network error" }
    }
  }

  const registerWithOTP = async (name, email, password, otp) => {
    try {
      dispatch({ type: "SET_LOADING", payload: true })

      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          otp,
          type: "register",
          userData: { name, password },
        }),
      })

      const data = await response.json()

      if (data.success) {
        dispatch({
          type: "LOGIN",
          payload: {
            user: data.user,
            token: data.token,
          },
        })
        
        // Show success notification for OTP registration
        toast({
          variant: "success",
          title: "OTP Registration Successful!",
          description: `Your account has been created, ${data.user.name}!`,
        })
        
        return { success: true }
      } else {
        dispatch({ type: "SET_LOADING", payload: false })
        return { success: false, error: data.error }
      }
    } catch (error) {
      dispatch({ type: "SET_LOADING", payload: false })
      return { success: false, error: "Network error" }
    }
  }

  const logout = async () => {
    // Get current user name before logout for notification
    const userName = state.user?.name || "User"
    
    // Sign out from NextAuth if session exists
    if (status === 'authenticated') {
      await signOut({ redirect: false })
    }
    dispatch({ type: "LOGOUT" })
    
    // Show logout notification
    toast({
      variant: "info",
      title: "Logout Successful!",
      description: `Thank you, ${userName}! You have been logged out successfully.`,
    })
    
    // Redirect to home page immediately
    router.push('/')
  }

  return (
    <AuthContext.Provider
      value={{
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        loading: state.loading,
        login,
        loginWithOTP,
        loginWithGoogle,
        loginWithFacebook,
        sendOTP,
        register,
        registerWithOTP,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {

  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
