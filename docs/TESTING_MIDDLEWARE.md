# 🧪 Testing Middleware Protection

## Quick Test Steps

### ✅ Test 1: Access Dashboard Without Login

**Expected Result:** Should redirect to login page

```bash
1. Open browser in Incognito/Private mode (to ensure no existing session)
2. Navigate to: http://localhost:3000/dashboard
3. ✓ Should automatically redirect to: http://localhost:3000/login?redirect=/dashboard
4. ✓ Dashboard content should NOT be visible
```

**How to verify:**
- Look at URL bar - should show `/login?redirect=/dashboard`
- Page should show login form, not dashboard
- Open DevTools Console - no errors about unauthorized access

---

### ✅ Test 2: Login and Auto-redirect

**Expected Result:** After login, return to intended page

```bash
1. Try to access: http://localhost:3000/dashboard (while not logged in)
2. Get redirected to: /login?redirect=/dashboard
3. Login with valid credentials
4. ✓ Should redirect back to: /dashboard
5. ✓ Dashboard content now visible
```

---

### ✅ Test 3: Access Auth Pages While Logged In

**Expected Result:** Should redirect to dashboard

```bash
1. Login to application
2. Try to access: http://localhost:3000/login
3. ✓ Should automatically redirect to: /dashboard
4. Try to access: http://localhost:3000/register
5. ✓ Should automatically redirect to: /dashboard
6. Try to access: http://localhost:3000/forgot-password
7. ✓ Should automatically redirect to: /dashboard
```

**Reason:** User sudah login, tidak perlu akses halaman login lagi

---

### ✅ Test 4: Token Persistence After Refresh

**Expected Result:** Stay logged in after page refresh

```bash
1. Login to application
2. Navigate to: /dashboard
3. Press F5 (Refresh page)
4. ✓ Should stay on dashboard (not redirect to login)
5. ✓ User data still displayed

Check DevTools:
- Application → Cookies → auth_token (should exist)
- Console → localStorage.getItem('auth_token') (should return token)
```

---

### ✅ Test 5: Logout Flow

**Expected Result:** Clear session and block dashboard access

```bash
1. Login to application
2. Navigate to: /dashboard
3. Click user menu (sidebar)
4. Click "Log out"
5. ✓ Should redirect to: /login
6. Try to access: /dashboard again
7. ✓ Should redirect to: /login?redirect=/dashboard

Check DevTools:
- Application → Cookies → auth_token (should be DELETED)
- Console → localStorage.getItem('auth_token') (should return null)
```

---

### ✅ Test 6: Cookie Inspection

**How to check cookie:**

```bash
1. Login to application
2. Open DevTools (F12)
3. Go to "Application" tab
4. Sidebar: "Cookies" → "http://localhost:3000"
5. Look for "auth_token" cookie

Expected cookie properties:
- Name: auth_token
- Value: (JWT token string)
- Path: /
- Max-Age: 604800 (7 days)
- SameSite: Lax
```

---

### ✅ Test 7: Direct URL Access (No JS)

**Test dengan JavaScript disabled:**

```bash
1. Logout (or use incognito)
2. Disable JavaScript in browser:
   - Chrome: DevTools → Settings → Debugger → Disable JavaScript
   - Firefox: about:config → javascript.enabled = false
3. Try to access: http://localhost:3000/dashboard
4. ✓ Should STILL redirect to login (proves server-side protection works!)
```

**This is important!** Membuktikan middleware bekerja di server, bukan client.

---

### ✅ Test 8: Multiple Tabs

**Expected Result:** Logout in one tab affects all tabs

```bash
1. Login to application
2. Open dashboard in TWO tabs:
   - Tab A: http://localhost:3000/dashboard
   - Tab B: http://localhost:3000/dashboard
3. In Tab A: Logout
4. In Tab B: Refresh or navigate
5. ✓ Tab B should redirect to login (token deleted)
```

---

### ✅ Test 9: Invalid/Expired Token

**Simulate expired token:**

```bash
1. Login to application
2. Open DevTools Console
3. Run: document.cookie = "auth_token=invalid_token; path=/"
4. Refresh page
5. ✓ Should stay logged in (because localStorage still has valid token)
6. Close and reopen browser
7. ✓ Should be logged out (token validation will fail)
```

---

## Debugging Commands

### Check Token in Console

```javascript
// Check localStorage
localStorage.getItem('auth_token')

// Check cookie
document.cookie.split(';').find(c => c.includes('auth_token'))

// Check user data
JSON.parse(localStorage.getItem('user_data'))
```

### Clear All Auth Data

```javascript
// Clear localStorage
localStorage.clear()

// Clear cookies
document.cookie.split(";").forEach(c => {
  document.cookie = c.replace(/^ +/, "")
    .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
});

// Reload page
location.reload()
```

### Check Middleware Logs

Add to `middleware.ts`:

```typescript
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('auth_token')?.value

  console.log('🔍 Middleware Check:', {
    path: pathname,
    hasToken: !!token,
    isProtected: protectedRoutes.some(r => pathname.startsWith(r)),
    isAuthRoute: authRoutes.some(r => pathname.startsWith(r))
  })

  // ... rest of code
}
```

Then check terminal running `pnpm dev` for logs.

---

## Common Issues & Fixes

### ❌ Issue: Still can access dashboard without login

**Check:**
1. Is middleware file in correct location? (root directory)
2. Is cookie set after login? (DevTools → Application → Cookies)
3. Restart dev server: `Ctrl+C` then `pnpm dev`

**Fix:**
```bash
# Clear everything and restart
rm -rf .next
pnpm dev
```

---

### ❌ Issue: Infinite redirect loop

**Symptoms:** Browser shows "Too many redirects" error

**Possible causes:**
- Middleware redirecting to itself
- Auth route included in protected routes

**Fix:** Check `middleware.ts` configuration:
```typescript
// Make sure these don't overlap!
const protectedRoutes = ['/dashboard']
const authRoutes = ['/login', '/register', '/forgot-password']
```

---

### ❌ Issue: Middleware not running

**Check:**
1. File location: Should be `middleware.ts` in root (same level as `app/`)
2. File name: Must be exactly `middleware.ts` (not `middleware.tsx`)
3. Restart dev server

**Test middleware is running:**
Add console.log and check terminal output.

---

### ❌ Issue: Cookie not set after login

**Check:**
1. Look in DevTools → Application → Cookies
2. Check browser console for errors
3. Verify `tokenService.setToken()` is called

**Manual test:**
```javascript
// In browser console after login
document.cookie.includes('auth_token') // Should return true
```

---

## Test Checklist

Copy this checklist and test each item:

- [ ] Cannot access `/dashboard` without login
- [ ] Redirects to `/login?redirect=/dashboard`
- [ ] After login, redirects back to intended page
- [ ] Cannot access `/login` while logged in (redirects to dashboard)
- [ ] Cannot access `/register` while logged in
- [ ] Token persists after page refresh
- [ ] Logout clears cookie and localStorage
- [ ] After logout, cannot access `/dashboard`
- [ ] Cookie exists in DevTools after login
- [ ] Cookie deleted in DevTools after logout
- [ ] Protection works with JavaScript disabled
- [ ] Multiple tabs sync logout status

---

## Success Criteria

✅ **Middleware is working correctly if:**

1. **Dashboard is completely blocked** without login
2. **Automatic redirects** work properly
3. **Cookie is set and deleted** correctly
4. **Token persists** across page refreshes
5. **Logout clears everything** properly
6. **No console errors** in browser
7. **Works without JavaScript** (server-side protection)

---

## Performance Check

Middleware should be **fast**:

```bash
# Check middleware performance
# In middleware.ts, add timing:

export function middleware(request: NextRequest) {
  const start = Date.now()

  // ... middleware logic ...

  const duration = Date.now() - start
  console.log(`⚡ Middleware: ${duration}ms`)

  return NextResponse.next()
}
```

**Expected:** < 10ms per request

---

## Final Verification

```bash
# Complete test sequence:

1. Logout (if logged in)
2. Clear cookies and localStorage
3. Try to access /dashboard
   ✓ Redirected to /login

4. Login with valid credentials
   ✓ Redirected to /dashboard
   ✓ Cookie set
   ✓ Dashboard visible

5. Refresh page
   ✓ Still on dashboard
   ✓ Still logged in

6. Try to access /login
   ✓ Redirected to /dashboard

7. Logout
   ✓ Redirected to /login
   ✓ Cookie deleted

8. Try to access /dashboard
   ✓ Redirected to /login

ALL TESTS PASSED! 🎉
```

---

**Ready to test?** Follow the steps above in order! 🚀
