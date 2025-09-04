// Utility functions to extract client information

export const getClientIP = (request) => {
  // Try to get real IP from various headers (for proxy/load balancer scenarios)
  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const clientIP = request.headers.get('x-client-ip')
  
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, get the first one
    return forwardedFor.split(',')[0].trim()
  }
  
  if (realIP) {
    return realIP
  }
  
  if (clientIP) {
    return clientIP
  }
  
  // Fallback to connection remote address (may not work in all environments)
  return 'Unknown'
}

export const getUserAgent = (request) => {
  return request.headers.get('user-agent') || 'Unknown'
}

// Get formatted browser/device info from user agent
export const getDeviceInfo = (userAgent) => {
  if (!userAgent || userAgent === 'Unknown') {
    return 'Unknown Device'
  }
  
  // Simple device detection
  if (userAgent.includes('Mobile')) {
    if (userAgent.includes('iPhone')) return 'iPhone'
    if (userAgent.includes('Android')) return 'Android Mobile'
    return 'Mobile Device'
  }
  
  if (userAgent.includes('iPad')) return 'iPad'
  if (userAgent.includes('Tablet')) return 'Tablet'
  
  // Browser detection
  if (userAgent.includes('Chrome')) return 'Chrome Browser'
  if (userAgent.includes('Firefox')) return 'Firefox Browser'
  if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'Safari Browser'
  if (userAgent.includes('Edge')) return 'Edge Browser'
  
  return 'Desktop Browser'
}
