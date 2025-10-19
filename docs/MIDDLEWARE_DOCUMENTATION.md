# 🔒 Middleware & Route Protection Documentation

## Overview
Sistem proteksi route menggunakan Next.js Middleware untuk memblokir akses unauthorized ke halaman-halaman terproteksi.

## How It Works

### 1. **Middleware** (`middleware.ts`)
Middleware berjalan di **edge** (server-side) sebelum request mencapai page component. Ini memastikan proteksi yang lebih kuat karena:
- Berjalan di server, bukan client
- Tidak bisa di-bypass dengan JavaScript
- Lebih cepat karena redirect sebelum page load

### 2. **Protected Routes**
Routes yang **memerlukan login**:
- `/dashboard` - Dashboard utama
- `/dashboard/*` - Semua sub-routes dashboard

### 3. **Auth Routes (Guest Only)**
Routes yang **hanya untuk yang belum login**:
- `/login` - Login page
- `/register` - Registration page
- `/forgot-password` - Password reset page

Jika user sudah login dan mengakses auth routes, akan di-redirect ke `/dashboard`.

## Implementation Details

### Token Storage
Token disimpan di **2 tempat**:

#### 1. **localStorage** (Client-side)
```typescript
localStorage.setItem('auth_token', token)
```
- Digunakan oleh React components
- Accessible dari browser
- Untuk AuthContext state management

#### 2. **HTTP Cookie** (Server-side accessible)
```typescript
document.cookie = `auth_token=${token}; path=/; max-age=604800; SameSite=Lax`
```
- Digunakan oleh middleware
- Accessible dari server
- Expires in 7 days
- `SameSite=Lax` untuk security

### Middleware Logic Flow

```
User Request
    ↓
Middleware checks cookie
    ↓
┌─────────────────────┐
│ Is Protected Route? │
└─────────────────────┘
    ↓
    YES → Has token?
           ↓
           NO → Redirect to /login?redirect=/dashboard
           YES → Allow access
    ↓
    NO → Is Auth Route?
           ↓
           YES → Has token?
                  ↓
                  YES → Redirect to /dashboard
                  NO → Allow access
           ↓
           NO → Allow access
```

## Code Examples

### Middleware Configuration

```typescript
// middleware.ts
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|public|images|logos|.*\\..*$).*)',
  ],
}
```

**Matcher Pattern Explanation:**
- `api` - Exclude API routes
- `_next/static` - Exclude static files
- `_next/image` - Exclude image optimization
- `favicon.ico` - Exclude favicon
- `public|images|logos` - Exclude public assets
- `.*\\..*$` - Exclude files with extensions (e.g., .png, .jpg)

### Adding New Protected Routes

Edit `middleware.ts`:

```typescript
const protectedRoutes = [
  '/dashboard',
  '/profile',      // Add new protected route
  '/settings',     // Add another
]
```

### Adding New Auth Routes

```typescript
const authRoutes = [
  '/login',
  '/register',
  '/forgot-password',
  '/verify-email',  // Add new auth route
]
```

## Security Features

### 1. **Server-side Protection**
- Middleware runs on server
- Cannot be bypassed by disabling JavaScript
- Redirect happens before page renders

### 2. **Cookie Security**
```typescript
SameSite=Lax  // Prevent CSRF attacks
path=/         // Cookie available for all paths
max-age=604800 // 7 days expiration
```

### 3. **Redirect with Return URL**
```typescript
const loginUrl = new URL('/login', request.url)
loginUrl.searchParams.set('redirect', pathname)
```

User dapat kembali ke halaman yang dituju setelah login.

### 4. **Automatic Token Cleanup**
Saat logout, token dihapus dari:
- localStorage
- Cookie
- Memory (AuthContext)

## Testing

### Test 1: Access Protected Route Without Login
```bash
# Expected: Redirect to /login?redirect=/dashboard
1. Open browser in incognito/private mode
2. Navigate to http://localhost:3000/dashboard
3. Should redirect to /login
4. URL should show: /login?redirect=/dashboard
```

### Test 2: Access Auth Route While Logged In
```bash
# Expected: Redirect to /dashboard
1. Login to application
2. Try to access /login or /register
3. Should redirect to /dashboard
```

### Test 3: Token Persistence
```bash
# Expected: Stay logged in after refresh
1. Login to application
2. Refresh page (F5)
3. Should stay logged in
4. Check cookie in DevTools
```

### Test 4: Token Expiration
```bash
# Expected: Redirect to login after token expires
1. Login to application
2. Wait 7 days (or manually delete cookie)
3. Refresh or navigate
4. Should redirect to login
```

### Test 5: Logout Flow
```bash
# Expected: Clear all tokens and redirect
1. Login to application
2. Click logout button
3. Check localStorage (should be empty)
4. Check cookies (auth_token should be deleted)
5. Try to access /dashboard (should redirect)
```

## Debugging

### Check Cookie in Browser
1. Open DevTools (F12)
2. Go to "Application" tab
3. Click "Cookies" → "http://localhost:3000"
4. Look for `auth_token` cookie

### Check localStorage
```javascript
// In browser console
localStorage.getItem('auth_token')
```

### Check Middleware Execution
Add console.log in `middleware.ts`:
```typescript
export function middleware(request: NextRequest) {
  console.log('Middleware:', request.nextUrl.pathname)
  console.log('Has token:', !!request.cookies.get('auth_token'))
  // ... rest of code
}
```

## Common Issues & Solutions

### Issue 1: "Still can access dashboard without login"
**Cause:** Cookie not set properly or middleware not running

**Solution:**
1. Check if cookie is set after login (DevTools → Application → Cookies)
2. Clear all cookies and localStorage
3. Login again
4. Restart dev server: `pnpm dev`

### Issue 2: "Infinite redirect loop"
**Cause:** Middleware redirecting to itself

**Solution:**
1. Check matcher configuration
2. Ensure auth routes are excluded from protection
3. Check if middleware is running on static assets

### Issue 3: "Token in cookie but still redirected"
**Cause:** Token exists but is invalid/expired

**Solution:**
1. Clear cookies and localStorage
2. Login again with fresh token
3. Check token expiration time

### Issue 4: "Middleware not running"
**Cause:** File location or configuration wrong

**Solution:**
1. Ensure `middleware.ts` is in root directory (same level as `app/`)
2. Restart Next.js dev server
3. Check Next.js version (middleware requires Next.js 12+)

## File Structure

```
super-apps-dashboard/
├── middleware.ts                    ← Middleware (server-side)
├── lib/
│   ├── api/
│   │   └── auth.ts                  ← Cookie management
│   └── context/
│       └── AuthContext.tsx          ← Client-side protection
├── app/
│   ├── dashboard/                   ← Protected route
│   ├── login/                       ← Auth route
│   ├── register/                    ← Auth route
│   └── forgot-password/             ← Auth route
```

## Best Practices

### 1. **Double Protection**
- Middleware (server-side) - Primary protection
- AuthContext (client-side) - Secondary + UX

### 2. **Secure Cookie Settings**
```typescript
SameSite=Lax    // Prevent CSRF
HttpOnly=false  // Allow JavaScript access (needed for logout)
Secure=false    // Use true in production (HTTPS only)
```

### 3. **Token Refresh**
Consider implementing token refresh:
```typescript
// Check token validity
const response = await authService.getUserInfo(token)
if (!response.success) {
  // Token invalid, logout
  logout()
}
```

### 4. **Environment-specific Configuration**
```typescript
// In production, use secure cookies
const isProduction = process.env.NODE_ENV === 'production'
document.cookie = `auth_token=${token}; path=/; ${isProduction ? 'Secure;' : ''} SameSite=Lax`
```

## API Integration

### Backend Should:
1. Return JWT token on successful login
2. Validate token on protected endpoints
3. Return 401 on invalid/expired token
4. Support token refresh (optional)

### Frontend Should:
1. Store token securely (cookie + localStorage)
2. Send token in Authorization header
3. Handle 401 responses (logout)
4. Clear token on logout

## Future Enhancements

1. **Role-based Access Control (RBAC)**
```typescript
const adminRoutes = ['/admin']
if (adminRoutes.some(route => pathname.startsWith(route))) {
  // Check user role
  const userRole = getUserRole(token)
  if (userRole !== 'admin') {
    return NextResponse.redirect('/unauthorized')
  }
}
```

2. **Token Refresh**
Implement automatic token refresh before expiration

3. **Session Timeout Warning**
Show warning before session expires

4. **Multiple Device Detection**
Track active sessions

5. **Activity Logging**
Log authentication attempts and accesses

---

**Protection Level: 🔒 MAXIMUM**

The combination of:
- Server-side middleware
- Client-side AuthContext
- Cookie + localStorage
- Token validation

Provides robust security for your application! 🛡️
