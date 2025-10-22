# Hydration Error Prevention Guide

## Overview

Hydration errors occur when the server-rendered HTML doesn't match the client-rendered HTML. This document explains common causes and solutions in our application.

## Common Causes

### 1. Browser Extensions
**Symptom:** Elements like `<div id="extwaiokist">` appear in error messages
**Cause:** Browser extensions (ad blockers, security tools, etc.) inject elements into the DOM
**Solution:** Add `suppressHydrationWarning` to root elements

### 2. Date/Time Functions
**Symptom:** Different timestamps between server and client
**Cause:** `new Date()` or `Date.now()` called during render
**Solution:** Use client-side initialization with `useEffect`

### 3. Theme Switching
**Symptom:** Class attribute mismatch on `<html>` element
**Cause:** Theme stored in localStorage not available during SSR
**Solution:** `suppressHydrationWarning` on html element + proper ThemeProvider setup

### 4. Random Values
**Symptom:** Different IDs or keys between renders
**Cause:** `Math.random()` or similar functions during render
**Solution:** Generate IDs in `useEffect` or use stable IDs

## Our Solutions

### Root Layout (`app/layout.tsx`)

```tsx
<html lang="en" suppressHydrationWarning>
  <body suppressHydrationWarning>
    <ThemeProvider>
      {children}
    </ThemeProvider>
  </body>
</html>
```

**Why:**
- `html`: Suppresses theme class mismatch
- `body`: Suppresses browser extension injection warnings

### Dashboard Layout (`app/dashboard/layout.tsx`)

```tsx
<SidebarProvider suppressHydrationWarning>
  <SidebarInset suppressHydrationWarning>
    {children}
  </SidebarInset>
</SidebarProvider>
```

**Why:** Complex UI components that might have client-side state

### DateTime Utilities (`lib/utils/datetime.ts`)

All datetime functions check for SSR environment:

```typescript
export function getUserTimezone(): string {
  if (typeof window === 'undefined') {
    return 'UTC'; // Default for SSR
  }
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}
```

**Pattern:**
1. Check `typeof window === 'undefined'`
2. Return safe default for SSR
3. Return actual value on client

### Client-Side Initialization Pattern

```typescript
// ❌ BAD - Causes hydration error
const [formData, setFormData] = useState({
  date: getCurrentDate(), // Different on server vs client
});

// ✅ GOOD - Prevents hydration error
const [formData, setFormData] = useState({
  date: "", // Empty on SSR
});

useEffect(() => {
  // Set actual value on client only
  setFormData(prev => ({
    ...prev,
    date: prev.date || getCurrentDate(),
  }));
}, []);
```

## Best Practices

### DO ✅

1. **Use `useEffect` for client-only code**
   ```typescript
   useEffect(() => {
     // This only runs on client
     const timezone = getUserTimezone();
   }, []);
   ```

2. **Check window before using browser APIs**
   ```typescript
   if (typeof window !== 'undefined') {
     localStorage.getItem('theme');
   }
   ```

3. **Provide SSR-safe defaults**
   ```typescript
   const timezone = typeof window !== 'undefined'
     ? getUserTimezone()
     : 'UTC';
   ```

4. **Use suppressHydrationWarning strategically**
   - Root elements (html, body)
   - Elements with dynamic content
   - Layout components

### DON'T ❌

1. **Don't call time functions during render**
   ```typescript
   // ❌ BAD
   return <div>{new Date().toISOString()}</div>;

   // ✅ GOOD
   const [time, setTime] = useState('');
   useEffect(() => {
     setTime(new Date().toISOString());
   }, []);
   return <div>{time}</div>;
   ```

2. **Don't use random values during render**
   ```typescript
   // ❌ BAD
   const id = Math.random();

   // ✅ GOOD
   const id = useId(); // React built-in hook
   ```

3. **Don't rely on localStorage during initial render**
   ```typescript
   // ❌ BAD
   const [theme, setTheme] = useState(
     localStorage.getItem('theme')
   );

   // ✅ GOOD
   const [theme, setTheme] = useState('system');
   useEffect(() => {
     setTheme(localStorage.getItem('theme') || 'system');
   }, []);
   ```

## Testing for Hydration Issues

### 1. Development Mode
Hydration warnings appear in console during development:
```
Warning: Text content did not match. Server: "..." Client: "..."
```

### 2. Disable Browser Extensions
Test with extensions disabled to isolate extension-related issues

### 3. Check Network Tab
Compare initial HTML from server vs DOM after hydration

### 4. Use React DevTools
Enable "Highlight updates" to see re-renders

## When to Use suppressHydrationWarning

### Safe to Use ✅
- Root `<html>` and `<body>` elements
- Theme-switching components
- Layout components with complex state
- Components that handle external content

### Use with Caution ⚠️
- Form components (might hide real issues)
- Data display components
- Components with user input

### Never Use ❌
- As a quick fix without understanding the issue
- On every component
- To hide actual bugs in your code

## Debugging Checklist

When you see a hydration error:

1. ☐ Check if it's from a browser extension (look for random IDs in error)
2. ☐ Look for `new Date()`, `Date.now()`, or `Math.random()` in render
3. ☐ Check for localStorage/sessionStorage usage
4. ☐ Verify all API calls are in useEffect
5. ☐ Check for window/document usage outside useEffect
6. ☐ Verify theme provider setup
7. ☐ Look for conditional rendering based on client-only values

## Resources

- [React Hydration Documentation](https://react.dev/reference/react-dom/client/hydrateRoot)
- [Next.js Hydration Guide](https://nextjs.org/docs/messages/react-hydration-error)
- [Common Hydration Pitfalls](https://react.dev/link/hydration-mismatch)

## Our Current Status

✅ **Implemented:**
- SSR-safe datetime utilities
- Client-side date initialization
- Root-level hydration warning suppression
- Theme provider with proper hydration handling

✅ **Safe from:**
- Browser extension injections
- Theme switching mismatches
- Timezone detection differences
- Date/time rendering differences

⚠️ **Known Issues:**
- Browser extensions may still show warnings (expected, can be ignored)

## Support

If you encounter hydration errors:
1. Check this guide first
2. Verify the error is not from a browser extension
3. Use the debugging checklist
4. Follow the patterns documented here
