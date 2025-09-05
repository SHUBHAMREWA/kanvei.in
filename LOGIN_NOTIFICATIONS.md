# 🔐 Login Notification System

यह feature सभी successful logins के लिए email notifications भेजता है - चाहे वे social login (Google/Facebook) से हों या normal email/password से।

## 📧 Features

- **Email/Password Login**: Regular credentials से login करने पर email notification
- **Google Login**: Google OAuth से login करने पर email notification  
- **Facebook Login**: Facebook OAuth से login करने पर email notification
- **First-Time Social Login**: पहली बार social login करने पर welcome email
- **New User Registration**: Regular registration करने पर welcome email
- **Admin Login**: Admin users को special admin login notifications
- **Beautiful Email Templates**: Welcome vs Security notification के लिए अलग designs

## 🔧 Implementation Details

### Files Modified:
1. `src/app/api/auth/[...nextauth]/route.js` - NextAuth configuration में notification logic
2. `src/lib/email.js` - Email templates और sending functions
3. `src/lib/clientInfo.js` - IP और User Agent detection
4. `src/app/api/auth/login/route.js` - Regular login API में notifications

### How it Works:

1. **NextAuth Login Flow**: 
   - `signIn` callback में सभी login types handle होते हैं
   - Database में user check करते हैं (new vs existing)
   - Existing users को notification भेजते हैं

2. **Regular API Login**:
   - `/api/auth/login` route में भी notification logic है
   - IP address और User Agent capture करते हैं
   - Admin vs regular user के लिए अलग templates

3. **Email Templates**:
   - Beautiful HTML templates with Kanvei branding
   - Login type, time, IP address, device info include करते हैं
   - Security warnings included

## 📋 Email Content

### Regular User Notification:
```
Subject: 🔒 Login Notification - [Login Type] Login Detected

Content includes:
- Login type (Google/Facebook/Email/Password)
- Date and time (IST)
- Email address
- IP address  
- Device/Browser info
- Security instructions
```

### Admin Login Notification:
```
Subject: 🔐 Admin Login Alert - Account Access Detected

Content includes:
- Enhanced security styling
- Admin privileges warning
- All regular login details
- High priority security notice
```

### Welcome Email (New Users):
```
Subject: 🎉 Welcome to Kanvei! Your [Login Type] Account is Ready

Content includes:
- Welcome message and branding
- Account creation details
- "What's Next" section with helpful tips
- Browse collection, wishlist, payment options info
- All login details for security
```

## 🛠️ Environment Variables Required

Make sure these are set in your `.env.local`:

```env
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=your-app-password
NEXTAUTH_SECRET=your-nextauth-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret
```

## 🧪 Testing

Test script available: `test-login-notification.js`

```bash
# Add TEST_EMAIL to your .env file first
TEST_EMAIL=your-test-email@gmail.com

# Run the test
node test-login-notification.js
```

## ✅ What Will Trigger Notifications

- **All successful logins** (existing users get security alerts)
- **First-time social logins** (new users get welcome emails)
- **Regular registrations** (new users get welcome emails)
- **Admin logins** (enhanced security notifications)

## 😅 What Won't Trigger Notifications

- Failed login attempts  
- Password resets
- Email verification
- OTP requests

## 💡 Security Features

- IP address logging
- Device/Browser detection
- Time stamps in IST
- Clear security warnings
- Contact information for suspicious activity
- Different styling for admin vs user notifications

## 📊 Logging

All notification attempts are logged to console:
- `📧 Sending login notification...`
- `✅ Login notification sent successfully`
- `❌ Failed to send login notification` (doesn't block login)

## 🔄 Future Enhancements

Possible improvements:
- SMS notifications
- Email rate limiting
- Geographic location detection
- Suspicious login detection
- Login history dashboard
- User preference settings (enable/disable notifications)

---

**Note**: Email sending failures won't block the login process. Notifications are sent asynchronously and any errors are logged but don't affect user experience.
