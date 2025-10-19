# Authentication Pages Documentation

## Overview
Sistem autentikasi lengkap untuk aplikasi dengan fitur:
- ✅ Registration dengan verifikasi email (OTP)
- ✅ Login dengan JWT authentication
- ✅ Forgot Password dengan OTP verification
- ✅ Protected routes (Dashboard)
- ✅ Logout functionality
- ✅ Auto token verification

## Pages Created

### 1. `/register` - Registration Page
**File:** `app/register/page.tsx`

**Features:**
- Form registrasi dengan validasi
- Password visibility toggle
- Two-step process:
  1. Register form (username, email, password, confirm password)
  2. OTP verification (6-digit code)
- Resend OTP functionality
- Redirect to login after successful verification
- Real-time error handling
- Modern gradient design

**Flow:**
```
User fills form → Submit → API sends OTP to email →
User enters OTP → Verify → Account created → Redirect to login
```

**API Endpoints Used:**
- `POST /api/v1/auth/register` - Initiate registration
- `POST /api/v1/auth/verify-registration` - Complete registration with OTP
- `POST /api/v1/auth/resend-registration-otp` - Resend OTP code

---

### 2. `/login` - Login Page
**File:** `app/login/page.tsx`

**Features:**
- Email and password form
- Password visibility toggle
- Remember user session with JWT token
- Auto-save token and user data to localStorage
- Redirect to dashboard after successful login
- Link to forgot password
- Link to register page
- Modern gradient design with animations

**Flow:**
```
User enters credentials → Submit → API validates →
Token & user data saved → Redirect to dashboard
```

**API Endpoints Used:**
- `POST /api/v1/auth/login` - Authenticate user

---

### 3. `/forgot-password` - Password Reset
**File:** `app/forgot-password/page.tsx`

**Features:**
- Two-step password reset:
  1. Email input to request reset code
  2. Enter OTP and new password
- Resend OTP functionality
- Password validation (min 8 characters)
- Redirect to login after successful reset
- Back to login links
- Modern gradient design

**Flow:**
```
User enters email → API sends OTP → User enters OTP & new password →
Password reset → Redirect to login
```

**API Endpoints Used:**
- `POST /api/v1/auth/forget-password` - Request password reset
- `POST /api/v1/auth/reset-password` - Reset password with OTP

---

## Authentication System

### Auth Service
**File:** `lib/api/auth.ts`

Provides centralized API communication with all endpoints:
- `authService.register()` - User registration
- `authService.verifyRegistration()` - Verify OTP for registration
- `authService.resendRegistrationOTP()` - Resend registration OTP
- `authService.login()` - User login
- `authService.logout()` - User logout
- `authService.forgetPassword()` - Request password reset
- `authService.resetPassword()` - Reset password
- `authService.getUserInfo()` - Get user information
- `authService.verifyEmail()` - Verify email (for existing users)
- `authService.resendVerification()` - Resend verification

**Token & User Management:**
- `tokenService.setToken()` - Save JWT token
- `tokenService.getToken()` - Get JWT token
- `tokenService.removeToken()` - Remove JWT token
- `userService.setUser()` - Save user data
- `userService.getUser()` - Get user data
- `userService.clearAll()` - Clear all auth data

---

### Auth Context
**File:** `lib/context/AuthContext.tsx`

Global authentication state management using React Context:

**Features:**
- Centralized auth state (user, token, loading)
- Auto-load auth data from localStorage
- Token verification on app load
- Login/logout methods
- User refresh functionality
- `isAuthenticated` boolean flag

**Usage:**
```tsx
import { useAuth } from "@/lib/context/AuthContext";

function MyComponent() {
  const { user, isAuthenticated, login, logout } = useAuth();

  if (!isAuthenticated) {
    return <div>Please login</div>
  }

  return <div>Welcome {user?.username}</div>
}
```

**HOC for Protected Routes:**
```tsx
import { withAuth } from "@/lib/context/AuthContext";

function DashboardPage() {
  return <div>Protected Content</div>
}

export default withAuth(DashboardPage);
```

---

## Protected Routes

### Dashboard
**File:** `app/dashboard/DashboardContent.tsx`

Protected dashboard page that:
- Checks authentication status
- Redirects to `/login` if not authenticated
- Shows loading state while checking auth
- Displays user information from context
- Shows welcome message with username

**Protection Flow:**
```
User accesses /dashboard → Check auth status →
If authenticated: Show dashboard
If not: Redirect to /login
```

---

## UI Components

### Alert Component
**File:** `components/ui/alert.tsx`

Reusable alert component for displaying:
- Success messages
- Error messages
- Info messages
- Warning messages

**Variants:**
- `default` - Standard alert
- `destructive` - Error/danger alert

---

## Design Features

### Modern Gradient Design
All authentication pages feature:
- **Background:** Gradient from blue to purple with blur effect
- **Cards:** Glass morphism effect (backdrop-blur)
- **Buttons:** Gradient hover effects
- **Icons:** Colorful gradient icon containers
- **Animations:** Smooth slide-in effects for alerts
- **Responsive:** Mobile-first design
- **Dark Mode:** Full dark mode support

### Color Schemes:
- **Register:** Blue to Purple gradient
- **Login:** Blue to Purple gradient
- **Verify Email:** Green to Emerald gradient
- **Forgot Password:** Orange to Red gradient
- **Reset Password:** Green to Emerald gradient

---

## Environment Variables

Create `.env.local` file:
```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

See `.env.example` for reference.

---

## Setup Instructions

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Configure Environment
```bash
cp .env.example .env.local
# Edit .env.local with your API URL
```

### 3. Run Development Server
```bash
pnpm dev
```

### 4. Access Pages
- Registration: `http://localhost:3000/register`
- Login: `http://localhost:3000/login`
- Forgot Password: `http://localhost:3000/forgot-password`
- Dashboard: `http://localhost:3000/dashboard` (protected)

---

## API Integration

All pages are fully integrated with the Go backend API as documented in `API_DOCUMENTATION.md`.

### Authentication Flow:

#### Registration:
1. User submits registration form
2. Backend stores temporary registration and sends OTP
3. User verifies OTP within 15 minutes
4. Account created and email verified
5. User can now login

#### Login:
1. User enters credentials
2. Backend validates and returns JWT token + user data
3. Token saved to localStorage
4. User redirected to dashboard
5. Token auto-validated on subsequent visits

#### Password Reset:
1. User requests reset with email
2. Backend sends OTP to email
3. User enters OTP and new password
4. Password updated
5. User can login with new password

---

## Security Features

✅ **JWT Token Authentication**
- Secure token storage in localStorage
- Auto token verification on app load
- Token included in all protected API requests

✅ **Password Security**
- Minimum 8 characters required
- Password confirmation validation
- Show/hide password toggle

✅ **OTP Verification**
- 6-digit codes
- 15-minute expiration
- One-time use only
- Resend functionality

✅ **Protected Routes**
- Auto-redirect to login if not authenticated
- Loading states during auth check
- User data persistence

✅ **Input Validation**
- Email format validation
- Password strength validation
- Username length validation
- Real-time error feedback

---

## User Experience

### Loading States
- Spinner animations during API calls
- Disabled inputs while loading
- Loading text on buttons

### Error Handling
- Clear error messages
- Animated error alerts
- Field-specific validation errors

### Success Feedback
- Success alerts with checkmark icons
- Auto-redirect after success
- Countdown timers

### Accessibility
- Proper form labels
- ARIA attributes
- Keyboard navigation support
- Screen reader friendly

---

## Testing Checklist

- [ ] Register new account
- [ ] Verify email with OTP
- [ ] Resend OTP if not received
- [ ] Login with credentials
- [ ] Navigate to protected dashboard
- [ ] Logout from dashboard
- [ ] Request password reset
- [ ] Reset password with OTP
- [ ] Login with new password
- [ ] Verify token persistence on page reload
- [ ] Test expired token handling
- [ ] Test invalid credentials
- [ ] Test form validations
- [ ] Test responsive design (mobile/tablet/desktop)
- [ ] Test dark mode

---

## Troubleshooting

### Issue: "Network error"
**Solution:** Check if API backend is running on `http://localhost:8080`

### Issue: OTP not received
**Solution:** Check email spam folder, or use resend OTP button

### Issue: Token expired
**Solution:** User will be auto-redirected to login page

### Issue: Cannot access dashboard
**Solution:** Ensure user is logged in and token is valid

---

## Next Steps

Potential enhancements:
- [ ] Add profile edit page
- [ ] Add account deletion flow
- [ ] Add email change with verification
- [ ] Add password change (authenticated)
- [ ] Add "Remember Me" checkbox
- [ ] Add social login (Google, GitHub)
- [ ] Add two-factor authentication (2FA)
- [ ] Add session management
- [ ] Add password strength meter
- [ ] Add rate limiting UI feedback

---

## File Structure

```
app/
  ├── login/
  │   └── page.tsx                    # Login page
  ├── register/
  │   └── page.tsx                    # Registration + OTP verification
  ├── forgot-password/
  │   └── page.tsx                    # Password reset flow
  ├── dashboard/
  │   ├── page.tsx                    # Dashboard wrapper
  │   └── DashboardContent.tsx        # Protected dashboard content
  └── layout.tsx                      # Root layout with AuthProvider

lib/
  ├── api/
  │   └── auth.ts                     # API service & token management
  └── context/
      └── AuthContext.tsx             # Auth context & protected route HOC

components/
  ├── ui/
  │   └── alert.tsx                   # Alert component
  └── Navigation/
      └── NavUser.tsx                 # User menu with logout

.env.example                          # Environment variables template
```

---

## Support

For API documentation, see `API_DOCUMENTATION.md`
For issues, contact the development team.
