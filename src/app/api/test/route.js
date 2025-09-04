import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Server is working perfectly!',
    timestamp: new Date().toISOString(),
    routes: {
      'GET /api/coupons/admin': 'Get all coupons (admin bypass)',
      'POST /api/coupons/admin': 'Create coupon (admin bypass)',
      'GET /api/users/list': 'List all users',
      'GET /api/admin/check?email=EMAIL': 'Check if user is admin',
      'POST /api/admin/check': 'Make user admin'
    }
  })
}
