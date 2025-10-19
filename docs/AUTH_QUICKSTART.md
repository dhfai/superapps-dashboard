# 🚀 Quick Start Guide - Authentication Pages

## Overview
Sistem autentikasi lengkap dengan desain modern yang terintegrasi dengan Go Backend API.

## ✨ Features
- ✅ **Registration** dengan Email Verification (OTP)
- ✅ **Login** dengan JWT Authentication
- ✅ **Forgot Password** dengan OTP Reset
- ✅ **Protected Routes** (Dashboard)
- ✅ **Auto Token Verification**
- ✅ **Logout Functionality**
- ✅ **Modern Gradient Design**
- ✅ **Dark Mode Support**
- ✅ **Fully Responsive**

## 📁 Files Created

### Core Files:
```
lib/api/auth.ts                      # API service & authentication logic
lib/context/AuthContext.tsx          # Global auth state management
app/register/page.tsx                # Registration + OTP verification
app/login/page.tsx                   # Login page
app/forgot-password/page.tsx         # Password reset flow
app/dashboard/DashboardContent.tsx   # Protected dashboard
components/ui/alert.tsx              # Alert component
.env.example                         # Environment variables template
AUTH_PAGES_DOCUMENTATION.md          # Complete documentation
```

## 🎯 Quick Setup

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Configure Environment
```bash
# Copy environment template
cp .env.example .env.local

# Edit .env.local
NEXT_PUBLIC_API_URL=http://localhost:8080
```

### 3. Run Development Server
```bash
pnpm dev
```

### 4. Access Pages
- **Home**: http://localhost:3000
- **Register**: http://localhost:3000/register
- **Login**: http://localhost:3000/login
- **Forgot Password**: http://localhost:3000/forgot-password
- **Dashboard**: http://localhost:3000/dashboard (protected)

## 🎨 Design Preview

### Color Schemes:
- **Register/Login**: Blue → Purple gradient
- **Email Verification**: Green → Emerald gradient
- **Password Reset**: Orange → Red gradient

### Features:
- Glass morphism cards with backdrop blur
- Smooth animations and transitions
- Icon-enhanced forms
- Gradient buttons with hover effects
- Responsive design (mobile, tablet, desktop)

## 🔐 API Integration

### All Endpoints Implemented:
```
✅ POST /api/v1/auth/register              # Start registration
✅ POST /api/v1/auth/verify-registration   # Complete registration
✅ POST /api/v1/auth/resend-registration-otp # Resend OTP
✅ POST /api/v1/auth/login                 # User login
✅ POST /api/v1/auth/logout                # User logout
✅ POST /api/v1/auth/forget-password       # Request reset
✅ POST /api/v1/auth/reset-password        # Reset password
✅ GET  /api/v1/user/info                  # Get user info
```

## 🚦 User Flows

### Registration Flow:
```
1. User fills registration form
   └─> Username, Email, Password, Confirm Password

2. System sends OTP to email (valid 15 min)
   └─> OTP code stored temporarily

3. User enters 6-digit OTP code
   └─> Can resend if not received

4. Account created & email verified
   └─> Redirect to login page
```

### Login Flow:
```
1. User enters email & password
   └─> Form validation

2. API returns JWT token & user data
   └─> Saved to localStorage

3. Redirect to dashboard
   └─> Protected route with auth check
```

### Password Reset Flow:
```
1. User enters email
   └─> System sends OTP

2. User enters OTP & new password
   └─> Password must be 8+ characters

3. Password updated
   └─> Redirect to login
```

## 🛡️ Security Features

- JWT token authentication
- Secure password validation (min 8 chars)
- OTP verification (6 digits, 15 min expiry)
- Protected routes with auto-redirect
- Token persistence & validation
- Logout clears all auth data

## 📱 Responsive Design

Works perfectly on:
- 📱 Mobile (320px+)
- 📱 Tablet (768px+)
- 💻 Desktop (1024px+)
- 🖥️ Large screens (1440px+)

## 🎭 Usage Examples

### Using Auth Context:
```tsx
import { useAuth } from "@/lib/context/AuthContext";

function MyComponent() {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <div>
      {isAuthenticated ? (
        <>
          <p>Welcome {user?.username}!</p>
          <button onClick={logout}>Logout</button>
        </>
      ) : (
        <p>Please login</p>
      )}
    </div>
  );
}
```

### Protected Component:
```tsx
import { withAuth } from "@/lib/context/AuthContext";

function ProtectedPage() {
  return <div>Secret Content</div>;
}

export default withAuth(ProtectedPage);
```

### API Calls:
```tsx
import { authService } from "@/lib/api/auth";

// Login
const response = await authService.login({
  email: "user@example.com",
  password: "password123"
});

// Register
const response = await authService.register({
  username: "johndoe",
  email: "john@example.com",
  password: "SecurePass123!",
  retype_password: "SecurePass123!"
});
```

## 🧪 Testing Guide

### Test Registration:
1. Navigate to `/register`
2. Fill form with valid data
3. Check email for OTP code
4. Enter OTP code
5. Should redirect to `/login`

### Test Login:
1. Navigate to `/login`
2. Enter registered credentials
3. Should redirect to `/dashboard`
4. Check if username displays

### Test Protected Route:
1. Open `/dashboard` without login
2. Should auto-redirect to `/login`
3. Login first, then access dashboard
4. Should display dashboard content

### Test Logout:
1. Login to dashboard
2. Click user menu (sidebar)
3. Click "Log out"
4. Should clear session & redirect to login

### Test Password Reset:
1. Navigate to `/forgot-password`
2. Enter registered email
3. Check email for OTP
4. Enter OTP and new password
5. Try login with new password

## 📚 Documentation

For detailed documentation, see:
- **AUTH_PAGES_DOCUMENTATION.md** - Complete authentication guide
- **API_DOCUMENTATION.md** - Backend API reference

## 🐛 Troubleshooting

### Issue: "Network error"
**Fix:** Ensure backend is running on http://localhost:8080

### Issue: OTP not received
**Fix:**
- Check spam folder
- Use "Resend OTP" button
- Verify email is correct

### Issue: Token expired
**Fix:** User will auto-redirect to login

### Issue: Cannot access dashboard
**Fix:** Login first, token is required

## 🎁 What's Included

### Components:
- ✅ Modern login form
- ✅ Registration with validation
- ✅ OTP verification screens
- ✅ Password reset flow
- ✅ Protected dashboard
- ✅ User menu with logout
- ✅ Loading states
- ✅ Error handling
- ✅ Success messages

### Services:
- ✅ Complete API integration
- ✅ Token management
- ✅ User data persistence
- ✅ Auth state management
- ✅ Route protection

### Design:
- ✅ Beautiful gradients
- ✅ Glass morphism
- ✅ Smooth animations
- ✅ Dark mode support
- ✅ Mobile responsive
- ✅ Accessible (ARIA)

## 🚀 Next Steps

You can now:
1. ✅ Register new users
2. ✅ Login existing users
3. ✅ Reset forgotten passwords
4. ✅ Access protected dashboard
5. ✅ Logout users

### Potential Enhancements:
- Add profile edit page
- Add account deletion with OTP
- Add email change verification
- Add password change (authenticated)
- Add "Remember Me" feature
- Add social login (Google, GitHub)
- Add two-factor authentication
- Add session timeout warning

## 📞 Support

Need help? Check:
1. AUTH_PAGES_DOCUMENTATION.md
2. API_DOCUMENTATION.md
3. Contact development team

---

**Happy coding! 🎉**
