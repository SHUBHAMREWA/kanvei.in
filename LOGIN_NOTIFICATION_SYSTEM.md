# 🔔 Login Notification System for Kanvei

## Overview
A comprehensive login notification system that sends email alerts to users whenever they successfully log in to their Kanvei account. This system covers all login methods including social login (Google/Facebook), regular email/password login, OTP login, and admin login.

## Features

### 🎯 What's Implemented

1. **Email Notifications for All Login Types:**
   - Regular email/password login
   - Social login (Google & Facebook)
   - OTP-based login
   - Admin login (special template)

2. **Professional Email Templates:**
   - Beautiful, branded email templates with Kanvei design
   - Time stamps in Indian Standard Time (IST)
   - Security information and contact details
   - Different templates for regular users vs admin users

3. **Security Information Included:**
   - Login timestamp (IST timezone)
   - IP address (where available)
   - Device/browser information
   - Login type (Regular, Google, Facebook, OTP, Admin)

4. **Enhanced Toast Notifications:**
   - Time-stamped success messages
   - Different messages for different login types
   - Improved user experience with emojis and timestamps

## Implementation Details

### 📁 Files Modified/Created

#### New Files:
- `src/lib/email.js` - Enhanced with login notification functions
- `src/lib/clientInfo.js` - Utility functions for extracting client information
- `src/test-notifications.js` - Test script for email notifications

#### Modified Files:
- `src/app/api/auth/[...nextauth]/route.js` - Added social login notifications
- `src/app/api/auth/login/route.js` - Added regular login notifications
- `src/app/api/auth/verify-otp/route.js` - Added OTP login notifications
- `src/contexts/AuthContext.js` - Enhanced toast notifications with timestamps

### 🔧 Email Functions

#### `sendLoginNotificationEmail(userEmail, userName, loginType, loginTime, ipAddress, userAgent)`
Sends login notification for regular users.

**Parameters:**
- `userEmail`: User's email address
- `userName`: User's name
- `loginType`: Type of login ('Regular', 'Google', 'Facebook', 'OTP Login')
- `loginTime`: Date/time of login
- `ipAddress`: Client IP address
- `userAgent`: Browser user agent string

#### `sendAdminLoginNotificationEmail(adminEmail, adminName, loginTime, ipAddress, userAgent)`
Sends special admin login notification with enhanced security warnings.

**Parameters:**
- `adminEmail`: Admin's email address
- `adminName`: Admin's name
- `loginTime`: Date/time of login
- `ipAddress`: Client IP address
- `userAgent`: Browser user agent string

### 🎨 Email Templates

Both templates feature:
- Modern, responsive design
- Kanvei branding with gradient headers
- Detailed login information table
- Security warnings and contact information
- Professional footer with copyright

**Admin Template Differences:**
- Red/warning color scheme
- Additional security warnings
- Special "ADMIN ACCESS" badge
- More prominent security notices

### 🚀 When Notifications Are Sent

1. **Regular Login (`/api/auth/login`):**
   - User login: Regular template
   - Admin login: Admin template

2. **Social Login (NextAuth callback):**
   - Google/Facebook login: Social login template
   - Only for existing users (not new registrations)

3. **OTP Login (`/api/auth/verify-otp`):**
   - User OTP login: OTP template
   - Admin OTP login: Admin template
   - Only for login type, not registration type

### 📱 Toast Notifications Enhanced

All login methods now show improved toast notifications with:
- Current time in IST
- Success emojis
- Personalized welcome messages
- Different styling for different login types

## Configuration Required

### Environment Variables
Ensure these are set in your `.env.local`:

```env
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=your-app-password
```

**Note:** Use Gmail App Passwords for EMAIL_PASS, not your regular Gmail password.

### Email Service Setup
The system uses Gmail SMTP. Make sure:
1. 2FA is enabled on your Gmail account
2. Generate an App Password for the application
3. Use the App Password as EMAIL_PASS

## Testing

### Manual Testing
1. Start your development server: `npm run dev`
2. Test different login methods:
   - Regular email/password login
   - Google OAuth login
   - Facebook OAuth login
   - OTP-based login
   - Admin login

### Automated Testing
Run the test script (after updating email addresses):
```bash
node src/test-notifications.js
```

## Security Features

### 🛡️ Security Information Included
- **IP Address Tracking**: Shows where the login came from
- **Device Information**: Browser/device details from user agent
- **Time Stamps**: Precise login time in IST
- **Login Method**: Clear identification of how user logged in

### 🚨 Security Warnings
- Instructions for users if login wasn't authorized
- Contact information for security issues
- Special warnings for admin logins

## Troubleshooting

### Common Issues

1. **Emails Not Sending:**
   - Check EMAIL_USER and EMAIL_PASS environment variables
   - Verify Gmail App Password is correct
   - Check console for error messages

2. **Social Login Notifications Not Working:**
   - Verify NextAuth is properly configured
   - Check if Google/Facebook OAuth is working
   - Look for console logs in the signIn callback

3. **Toast Notifications Not Showing:**
   - Check if toast component is properly configured
   - Verify AuthContext is wrapping your app
   - Look for console errors

### Debug Mode
Check browser console and server logs for detailed information about email sending and notification triggers.

## Future Enhancements

### Possible Improvements
1. **SMS Notifications**: Add SMS alerts for critical logins
2. **Email Templates**: More customizable email templates
3. **Login Analytics**: Track and analyze login patterns
4. **Suspicious Activity Detection**: Flag unusual login patterns
5. **User Preferences**: Allow users to control notification settings

## Usage Examples

### Backend (Automatic)
The system automatically sends notifications when:
```javascript
// This happens automatically in the login APIs
await sendLoginNotificationEmail(
  user.email,
  user.name,
  'Regular',
  new Date(),
  getClientIP(request),
  getUserAgent(request)
)
```

### Frontend Toast (Automatic)
Enhanced toast notifications appear automatically:
```javascript
toast({
  variant: "success",
  title: "Login Successful! ✅",
  description: `Welcome back, ${user.name}! Logged in at ${currentTime}`,
})
```

## Summary

This comprehensive login notification system provides:
- ✅ Professional email alerts for all login types
- ✅ Enhanced security with detailed login information
- ✅ Beautiful, branded email templates
- ✅ Improved user experience with timestamped notifications
- ✅ Special handling for admin logins
- ✅ Robust error handling and logging

The system is production-ready and will help users stay informed about account access while maintaining the security and branding standards of Kanvei.

---

**Team Kanvei** - Keeping your account secure! 🔐
