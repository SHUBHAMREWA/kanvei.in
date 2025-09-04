// Quick test to verify Razorpay environment variables
console.log('🔍 Checking Razorpay Environment Variables:')
console.log('RAZORPAY_KEY_ID:', process.env.RAZORPAY_KEY_ID ? '✅ Set' : '❌ Missing')
console.log('RAZORPAY_KEY_SECRET:', process.env.RAZORPAY_KEY_SECRET ? '✅ Set' : '❌ Missing')
console.log('NEXT_PUBLIC_RAZORPAY_KEY_ID:', process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ? '✅ Set' : '❌ Missing')

// Show actual values (for debugging - remove in production)
console.log('\n📋 Values:')
console.log('RAZORPAY_KEY_ID:', process.env.RAZORPAY_KEY_ID)
console.log('NEXT_PUBLIC_RAZORPAY_KEY_ID:', process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID)
console.log('SECRET (hidden for security):', process.env.RAZORPAY_KEY_SECRET ? '[HIDDEN]' : 'NOT SET')
