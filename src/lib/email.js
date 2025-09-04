import nodemailer from "nodemailer"

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
})

export const sendEmail = async (to, subject, html) => {
  try {
    const mailOptions = {
      from: `"Kanvei" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    }

    const result = await transporter.sendMail(mailOptions)
    return { success: true, messageId: result.messageId }
  } catch (error) {
    console.error("Email sending error:", error)
    return { success: false, error: error.message }
  }
}

export const sendOrderConfirmationEmail = async (order, customerEmail) => {
  const orderId = order.orderId || order._id.toString().slice(-8).toUpperCase()
  const subject = `Order Confirmation - #${orderId}`

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #5A0117; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .order-details { background-color: white; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
        .total { font-weight: bold; font-size: 18px; color: #5A0117; }
        .footer { text-align: center; padding: 20px; color: #8C6141; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0; font-family: 'Sugar', serif;">Kanvei</h1>
          <p style="margin: 10px 0 0 0;">Thank you for your order!</p>
        </div>
        
        <div class="content">
          <h2 style="color: #5A0117;">Order Confirmation</h2>
          <p>Dear ${order.shippingAddress?.name || "Customer"},</p>
          <p>Thank you for your order! We're excited to confirm that we've received your order and it's being processed.</p>
          
          <div class="order-details">
            <h3 style="color: #5A0117; margin-top: 0;">Order Details</h3>
            <p><strong>Order Number:</strong> #${orderId}</p>
            <p><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
            <p><strong>Payment Method:</strong> ${order.paymentMethod.toUpperCase()}</p>
            
            <h4 style="color: #5A0117;">Items Ordered:</h4>
            ${
              order.items
                ?.map(
                  (item) => `
              <div class="item">
                <span>${item.name} x ${item.quantity}</span>
                <span>₹${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            `,
                )
                .join("") || ""
            }
            
            <div class="item total">
              <span>Total Amount</span>
              <span>₹${order.totalAmount.toFixed(2)}</span>
            </div>
          </div>
          
          <div class="order-details">
            <h4 style="color: #5A0117; margin-top: 0;">Shipping Address</h4>
            <p>
              ${order.shippingAddress?.name}<br>
              ${order.shippingAddress?.address}<br>
              ${order.shippingAddress?.city}, ${order.shippingAddress?.state} ${order.shippingAddress?.pincode}<br>
              Phone: ${order.shippingAddress?.phone}
            </p>
          </div>
          
          <p>We'll send you another email with tracking information once your order ships.</p>
          <p>If you have any questions about your order, please contact us at kanvei.in@gmail.com or +91 7488425690.</p>
        </div>
        
        <div class="footer">
          <p>Thank you for choosing Kanvei!</p>
          <p style="font-size: 12px;">This is an automated email. Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `

  return await sendEmail(customerEmail, subject, html)
}

export const sendContactEmail = async (name, email, subject, message) => {
  const emailSubject = `Contact Form: ${subject}`

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #5A0117; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .message-box { background-color: white; padding: 20px; margin: 20px 0; border-radius: 8px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0; font-family: 'Sugar', serif;">Kanvei</h1>
          <p style="margin: 10px 0 0 0;">New Contact Form Submission</p>
        </div>
        
        <div class="content">
          <div class="message-box">
            <h3 style="color: #5A0117; margin-top: 0;">Contact Details</h3>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Subject:</strong> ${subject}</p>
            
            <h4 style="color: #5A0117;">Message:</h4>
            <p style="background-color: #f9f9f9; padding: 15px; border-radius: 5px;">${message}</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `

  return await sendEmail(process.env.EMAIL_USER, emailSubject, html)
}

// Send login notification email
export const sendLoginNotificationEmail = async (userEmail, userName, loginType = 'Regular', loginTime, ipAddress = 'Unknown', userAgent = 'Unknown') => {
  const subject = `🔒 Login Notification - ${loginType} Login Detected`
  
  const formattedTime = new Date(loginTime).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  })

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #5A0117 0%, #8C1538 100%); color: white; padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
        .content { padding: 30px; background-color: #fafafa; border-radius: 0 0 12px 12px; }
        .login-details { background-color: white; padding: 25px; margin: 20px 0; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .success-badge { background-color: #22c55e; color: white; padding: 8px 16px; border-radius: 20px; font-weight: bold; display: inline-block; margin-bottom: 15px; }
        .detail-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #f0f0f0; }
        .detail-label { font-weight: bold; color: #5A0117; }
        .detail-value { color: #666; }
        .security-info { background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0; }
        .footer { text-align: center; padding: 25px; color: #8C6141; }
        .brand-title { margin: 0; font-family: 'Sugar', serif; font-size: 32px; }
        .brand-subtitle { margin: 10px 0 0 0; opacity: 0.9; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 class="brand-title">Kanvei</h1>
          <p class="brand-subtitle">Security Alert - Login Notification</p>
        </div>
        
        <div class="content">
          <div class="success-badge">✅ Successful Login</div>
          
          <h2 style="color: #5A0117; margin-bottom: 10px;">Hello ${userName}!</h2>
          <p style="font-size: 16px; margin-bottom: 25px;">We detected a successful login to your Kanvei account. Here are the details:</p>
          
          <div class="login-details">
            <h3 style="color: #5A0117; margin-top: 0; margin-bottom: 20px;">Login Information</h3>
            
            <div class="detail-row">
              <span class="detail-label">Login Type:</span>
              <span class="detail-value">${loginType}</span>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">Date & Time:</span>
              <span class="detail-value">${formattedTime} (IST)</span>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">Email:</span>
              <span class="detail-value">${userEmail}</span>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">IP Address:</span>
              <span class="detail-value">${ipAddress}</span>
            </div>
            
            <div class="detail-row" style="border-bottom: none;">
              <span class="detail-label">Device/Browser:</span>
              <span class="detail-value">${userAgent.length > 50 ? userAgent.substring(0, 50) + '...' : userAgent}</span>
            </div>
          </div>
          
          <div class="security-info">
            <h4 style="margin-top: 0; color: #1e40af;">🛡️ Security Information</h4>
            <p style="margin: 0; font-size: 14px;">If this login was made by you, no action is required. If you didn't authorize this login, please contact our support team immediately at <strong>kanvei.in@gmail.com</strong> or call <strong>+91 7488425690</strong>.</p>
          </div>
          
          <p style="margin-top: 25px; font-size: 14px; color: #666;">Thank you for using Kanvei! We're committed to keeping your account secure.</p>
        </div>
        
        <div class="footer">
          <p style="margin: 0; font-weight: bold;">Team Kanvei</p>
          <p style="font-size: 12px; margin: 10px 0 0 0;">This is an automated security notification. Please do not reply to this email.</p>
          <p style="font-size: 12px; margin: 5px 0 0 0;">© ${new Date().getFullYear()} Kanvei. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `

  return await sendEmail(userEmail, subject, html)
}

// Send admin login notification email
export const sendAdminLoginNotificationEmail = async (adminEmail, adminName, loginTime, ipAddress = 'Unknown', userAgent = 'Unknown') => {
  const subject = `🔐 Admin Login Alert - Account Access Detected`
  
  const formattedTime = new Date(loginTime).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  })

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #dc2626 0%, #5A0117 100%); color: white; padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
        .content { padding: 30px; background-color: #fafafa; border-radius: 0 0 12px 12px; }
        .admin-badge { background-color: #dc2626; color: white; padding: 10px 20px; border-radius: 25px; font-weight: bold; display: inline-block; margin-bottom: 20px; }
        .login-details { background-color: white; padding: 25px; margin: 20px 0; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); border-left: 5px solid #dc2626; }
        .detail-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #f0f0f0; }
        .detail-label { font-weight: bold; color: #dc2626; }
        .detail-value { color: #666; }
        .security-warning { background-color: #fef2f2; border: 2px solid #fecaca; padding: 20px; margin: 20px 0; border-radius: 10px; }
        .footer { text-align: center; padding: 25px; color: #8C6141; }
        .brand-title { margin: 0; font-family: 'Sugar', serif; font-size: 32px; }
        .brand-subtitle { margin: 10px 0 0 0; opacity: 0.9; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 class="brand-title">Kanvei</h1>
          <p class="brand-subtitle">🚨 Administrative Access Alert</p>
        </div>
        
        <div class="content">
          <div class="admin-badge">👑 ADMIN ACCESS</div>
          
          <h2 style="color: #dc2626; margin-bottom: 10px;">Admin Login Detected!</h2>
          <p style="font-size: 16px; margin-bottom: 25px;">Dear <strong>${adminName}</strong>, we detected an administrative login to your Kanvei admin account:</p>
          
          <div class="login-details">
            <h3 style="color: #dc2626; margin-top: 0; margin-bottom: 20px;">🔍 Login Details</h3>
            
            <div class="detail-row">
              <span class="detail-label">Admin Account:</span>
              <span class="detail-value">${adminEmail}</span>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">Login Time:</span>
              <span class="detail-value">${formattedTime} (IST)</span>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">Access Level:</span>
              <span class="detail-value">Administrator</span>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">IP Address:</span>
              <span class="detail-value">${ipAddress}</span>
            </div>
            
            <div class="detail-row" style="border-bottom: none;">
              <span class="detail-label">Device/Browser:</span>
              <span class="detail-value">${userAgent.length > 50 ? userAgent.substring(0, 50) + '...' : userAgent}</span>
            </div>
          </div>
          
          <div class="security-warning">
            <h4 style="margin-top: 0; color: #dc2626;">🛡️ Security Notice</h4>
            <p style="margin: 0; font-size: 14px; color: #991b1b;"><strong>Important:</strong> This is a high-privilege account access notification. If this login was not authorized by you, please secure your account immediately and contact our security team at <strong>kanvei.in@gmail.com</strong> or call <strong>+91 7488425690</strong>.</p>
          </div>
          
          <p style="margin-top: 25px; font-size: 14px; color: #666;">This notification is sent for all admin account logins as part of our security monitoring system.</p>
        </div>
        
        <div class="footer">
          <p style="margin: 0; font-weight: bold; color: #dc2626;">Kanvei Security Team</p>
          <p style="font-size: 12px; margin: 10px 0 0 0;">This is an automated security alert. Please do not reply to this email.</p>
          <p style="font-size: 12px; margin: 5px 0 0 0;">© ${new Date().getFullYear()} Kanvei. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `

  return await sendEmail(adminEmail, subject, html)
}
