// Test script to verify login notification email functionality
// Run this with: node test-login-notification.js

import dotenv from 'dotenv'
import { sendLoginNotificationEmail, sendAdminLoginNotificationEmail } from './src/lib/email.js'

// Load environment variables
dotenv.config()

async function testLoginNotifications() {
  console.log('🧪 Testing Login Notification Emails...\n')
  
  try {
    // Test new user welcome email (social login)
    console.log('📧 Testing new user welcome email (social login)...')
    const welcomeSocialResult = await sendLoginNotificationEmail(
      process.env.TEST_EMAIL || 'newuser@example.com',
      'Jane Smith',
      'Google',
      new Date(),
      '203.0.113.1',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      true // isNewUser = true
    )
    console.log('Welcome (social) result:', welcomeSocialResult)
    
    // Wait a bit before next test
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Test new user welcome email (regular registration)
    console.log('\n📧 Testing new user welcome email (registration)...')
    const welcomeRegularResult = await sendLoginNotificationEmail(
      process.env.TEST_EMAIL || 'newuser2@example.com',
      'John Smith',
      'Email/Password',
      new Date(),
      '203.0.113.1',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      true // isNewUser = true
    )
    console.log('Welcome (registration) result:', welcomeRegularResult)
    
    // Wait a bit before next test
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Test regular user login notification (existing user)
    console.log('\n📧 Testing regular user login notification (existing user)...')
    const regularEmailResult = await sendLoginNotificationEmail(
      process.env.TEST_EMAIL || 'test@example.com',
      'John Doe',
      'Google',
      new Date(),
      '203.0.113.1',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      false // isNewUser = false
    )
    console.log('Regular user notification result:', regularEmailResult)
    
    // Wait a bit before next test
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Test admin login notification
    console.log('\n📧 Testing admin login notification...')
    const adminEmailResult = await sendAdminLoginNotificationEmail(
      process.env.TEST_EMAIL || 'admin@example.com',
      'Admin User',
      new Date(),
      '203.0.113.1',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    )
    console.log('Admin notification result:', adminEmailResult)
    
    console.log('\n✅ All tests completed!')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

// Run the test
testLoginNotifications()
