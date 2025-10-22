# Profile Page Documentation

## Overview
Halaman profile user yang lengkap dengan semua fitur dari backend API, termasuk view profile, edit profile, dan delete account dengan verifikasi OTP.

## Route
`/dashboard/profile`

## Features

### 1. **View Profile Information**
Menampilkan informasi lengkap user:
- ✅ **User Info**:
  - Username
  - Email
  - Account Status (Active/Inactive)
  - Email Verification Status
  - Email Verified Date

- ✅ **Profile Details**:
  - Full Name
  - Phone Number
  - Country
  - Address
  - Profile Created Date
  - Last Updated Date

### 2. **Edit Profile**
Update profile information dengan API endpoint `/api/v1/profile`:
- ✅ Inline editing mode
- ✅ Form validation
- ✅ Loading states
- ✅ Success/error feedback
- ✅ Cancel button to revert changes
- ✅ Real-time profile refresh after update

**Fields yang bisa diedit:**
- Full Name (max 100 characters)
- Phone Number (max 20 characters)
- Country (max 50 characters)
- Address (text)

### 3. **Delete Account (2-Step Process)**

#### Step 1: Request Delete
- User memasukkan password
- API endpoint: `POST /api/v1/auth/request-delete-account`
- OTP dikirim ke email user

#### Step 2: Confirm Delete
- User memasukkan 6-digit OTP dari email
- API endpoint: `POST /api/v1/auth/delete-account`
- Account dihapus permanen
- Auto logout dan redirect ke homepage

**Security Features:**
- ⚠️ Password verification required
- 📧 OTP sent to email
- 🔒 2-step confirmation process
- ⏰ OTP has expiration time
- 🚫 Irreversible action warning

## UI/UX Features

### Design Elements
1. **Profile Card (Left Side)**:
   - Large avatar with initials
   - Username and email display
   - Status badges (Active, Verified)
   - Account information summary

2. **Profile Information Card (Right Side)**:
   - Edit/Save/Cancel buttons
   - Organized form fields with icons
   - Read-only vs Edit mode states
   - Last updated timestamp

3. **Danger Zone**:
   - Clear visual warning (red border)
   - Delete account button with confirmation
   - Warning messages about irreversibility

### Visual Improvements
- 🎨 **Gradient Text**: Header dengan gradient primary
- 🎯 **Icons**: Tabler icons untuk setiap field
- 💎 **Badges**: Status indicators dengan colors
- 📦 **Card Layout**: Clean 2-column responsive grid
- ✨ **Hover Effects**: Smooth transitions
- 🎪 **Loading States**: Spinners dan disabled states
- 🔔 **Alerts**: Success (green) dan Error (red)

### Responsive Design
- ✅ Mobile-friendly layout
- ✅ Grid adapts: 1 column (mobile) → 3 columns (desktop)
- ✅ Touch-friendly button sizes
- ✅ Readable typography

## API Integration

### Endpoints Used

1. **GET /api/v1/user/info**
   - Fetch complete user information
   - Called on page load
   - Returns user + profile data

2. **PUT /api/v1/profile**
   - Update profile information
   - Partial updates supported
   - Returns updated profile data

3. **POST /api/v1/auth/request-delete-account**
   - Request account deletion
   - Requires password
   - Sends OTP to email

4. **POST /api/v1/auth/delete-account**
   - Confirm account deletion
   - Requires OTP code
   - Permanently deletes account

### Authentication
- All requests include JWT token in Authorization header
- Auto-redirect to login if token missing/invalid
- Token refreshed after profile updates

## State Management

### Local States
```typescript
- userInfo: UserInfo | null
- loading: boolean
- isEditing: boolean
- saving: boolean
- error: string
- success: string
- showDeleteDialog: boolean
- deleteStep: 'password' | 'otp'
- deletePassword: string
- deleteOtp: string
- deletingAccount: boolean
- formData: { full_name, address, phone_number, country }
```

### Context Used
```typescript
- useAuth(): { user, refreshUser, logout }
```

## User Flow

### Edit Profile Flow
```
1. Click "Edit Profile" button
   ↓
2. Form fields become editable
   ↓
3. Modify profile information
   ↓
4. Click "Save" button
   ↓
5. API call to PUT /api/v1/profile
   ↓
6. Success: Show success message → Refresh data → Exit edit mode
7. Error: Show error message → Stay in edit mode
```

### Delete Account Flow
```
1. Click "Delete Account" button
   ↓
2. Dialog opens → Enter password
   ↓
3. Click "Send OTP"
   ↓
4. API call to POST /api/v1/auth/request-delete-account
   ↓
5. Success: OTP sent to email → Show OTP input
   ↓
6. Enter 6-digit OTP from email
   ↓
7. Click "Confirm Delete"
   ↓
8. API call to POST /api/v1/auth/delete-account
   ↓
9. Success: Account deleted → Logout → Redirect to homepage
```

## Security Considerations

1. **Password Protection**: Delete account requires password verification
2. **OTP Verification**: 6-digit code sent to email
3. **JWT Authentication**: All API calls require valid token
4. **Auto Logout**: After account deletion
5. **Session Cleanup**: Clear localStorage and cookies
6. **Warning Messages**: Multiple confirmations before deletion

## Error Handling

### Common Errors
- ❌ Failed to load user info → Show error alert
- ❌ Network error → Display error message
- ❌ Invalid password → Show validation error
- ❌ Expired OTP → Request new OTP
- ❌ Invalid OTP → Show error message
- ❌ Unauthorized → Redirect to login

### Error Display
- Alert component with destructive variant
- Icon + message for better visibility
- Auto-clear on successful action

## Navigation

### Access Points
1. **Sidebar**: Click "Account" in user dropdown menu
2. **Direct URL**: `/dashboard/profile`

### Protection
- Route protected by AuthContext
- Middleware checks authentication
- Auto-redirect to login if not authenticated

## Dependencies

### UI Components
```typescript
- @/components/ui/button
- @/components/ui/input
- @/components/ui/label
- @/components/ui/card
- @/components/ui/alert
- @/components/ui/separator
- @/components/ui/dialog
- @/components/ui/badge
- @/components/ui/avatar
```

### Icons
```typescript
- @tabler/icons-react: 15+ icons used
```

### Libraries
```typescript
- date-fns: Date formatting
- next/navigation: Router
- react: Hooks (useState, useEffect)
```

### Context
```typescript
- @/lib/context/AuthContext: Authentication state
```

## Testing Checklist

- [ ] Load profile data successfully
- [ ] Display user information correctly
- [ ] Edit mode toggle works
- [ ] Update profile successfully
- [ ] Cancel edit reverts changes
- [ ] Form validation works
- [ ] Delete account password step
- [ ] Delete account OTP step
- [ ] OTP format validation (6 digits)
- [ ] Account deletion completes
- [ ] Auto logout after deletion
- [ ] Redirect to homepage
- [ ] Error handling for all failures
- [ ] Success messages display
- [ ] Loading states show correctly
- [ ] Responsive on mobile
- [ ] Navigation from sidebar works

## Future Enhancements

### Potential Features
1. **Profile Picture Upload**: Add image upload for avatar
2. **Email Change**: Add email update with verification
3. **Password Change**: Implement password reset
4. **2FA Settings**: Two-factor authentication setup
5. **Privacy Settings**: Control visibility of profile data
6. **Activity Log**: Show login history and activities
7. **Connected Accounts**: Link social media accounts
8. **Export Data**: Download personal data
9. **Theme Preferences**: Save UI preferences
10. **Notification Settings**: Email/push notification preferences

### Improvements
- Add profile completeness indicator
- Show password strength meter
- Add profile preview before save
- Implement auto-save drafts
- Add keyboard shortcuts
- Improve accessibility (ARIA labels)
- Add confirmation modal for large changes

## Related Files

- Page: `/app/dashboard/profile/page.tsx`
- Navigation: `/components/Navigation/NavUser.tsx`
- Auth Context: `/lib/context/AuthContext.tsx`
- API Documentation: `/docs/API_DOCUMENTATION.md`

## Support

Untuk pertanyaan atau issues terkait halaman profile, silakan hubungi tim development atau buat issue di repository.
