// Test script for login notifications
// Run this with: node src/test-notifications.js

import { sendLoginNotificationEmail, sendAdminLoginNotificationEmail } from './lib/email.js'

// Test regular user login notification
async function testUserLogin() {
  console.log('🧪 Testing user login notification...')
  try {
    const result = await sendLoginNotificationEmail(
      'test@example.com', // Replace with your email for testing
      'Test User',
      'Regular',
      new Date(),
      '192.168.1.1',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    )
    console.log('✅ User login notification result:', result)
  } catch (error) {
    console.error('❌ User login notification failed:', error)
  }
}

// Test social login notification
async function testSocialLogin() {
  console.log('🧪 Testing social login notification...')
  try {
    const result = await sendLoginNotificationEmail(
      'test@example.com', // Replace with your email for testing
      'Test User',
      'Google',
      new Date(),
      '192.168.1.1',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    )
    console.log('✅ Social login notification result:', result)
  } catch (error) {
    console.error('❌ Social login notification failed:', error)
  }
}

// Test admin login notification
async function testAdminLogin() {
  console.log('🧪 Testing admin login notification...')
  try {
    const result = await sendAdminLoginNotificationEmail(
      'admin@example.com', // Replace with your email for testing
      'Test Admin',
      new Date(),
      '192.168.1.1',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    )
    console.log('✅ Admin login notification result:', result)
  } catch (error) {
    console.error('❌ Admin login notification failed:', error)
  }
}

// Run all tests
async function runTests() {
  console.log('🚀 Starting login notification tests...\n')
  
  await testUserLogin()
  console.log()
  
  await testSocialLogin()
  console.log()
  
  await testAdminLogin()
  
  console.log('\n✨ All tests completed!')
}

// Check if running directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests()
}

export { testUserLogin, testSocialLogin, testAdminLogin }
