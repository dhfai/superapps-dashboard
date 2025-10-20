# Troubleshooting Guide

## Issue 1: Error 500 untuk "Not Found" Resources

### Problem
```
ERROR [2025-10-19 21:39:30] Failed to update daily target: resource not found: daily target not found
ERROR [2025-10-19 21:39:30] HTTP Request status=500
```

### Root Cause
Controller tidak handle `ErrNotFound` error dengan benar, semua error dikembalikan sebagai **500 Internal Server Error** padahal seharusnya **404 Not Found**.

### Solution Applied

Updated `internal/controllers/daily_target_controller.go` untuk 3 methods:

#### 1. UpdateDailyTarget
```go
target, err := c.dailyTargetService.UpdateDailyTarget(userID, uint(targetID), &req)
if err != nil {
    // Handle specific error types
    if utils.IsNotFoundError(err) {
        ctx.JSON(http.StatusNotFound, models.APIResponse{  // 404 ✅
            Success: false,
            Message: "Daily target not found",
            Error:   err.Error(),
        })
        return
    }

    ctx.JSON(http.StatusInternalServerError, ...)  // 500 for other errors
}
```

#### 2. DeleteDailyTarget
```go
if err := c.dailyTargetService.DeleteDailyTarget(userID, uint(targetID)); err != nil {
    if utils.IsNotFoundError(err) {
        ctx.JSON(http.StatusNotFound, ...)  // 404 ✅
        return
    }
    ctx.JSON(http.StatusInternalServerError, ...)
}
```

#### 3. RefreshActualValues
```go
target, err := c.dailyTargetService.RefreshActualValues(userID, uint(targetID))
if err != nil {
    if utils.IsNotFoundError(err) {
        ctx.JSON(http.StatusNotFound, ...)  // 404 ✅
        return
    }
    ctx.JSON(http.StatusInternalServerError, ...)
}
```

### Testing

**Before (❌):**
```bash
PUT /api/v1/finance/daily-targets/999
# Response: 500 Internal Server Error
```

**After (✅):**
```bash
PUT /api/v1/finance/daily-targets/999
# Response: 404 Not Found
{
  "success": false,
  "message": "Daily target not found",
  "error": "resource not found: daily target not found"
}
```

---

## Issue 2: Data Muncul Otomatis di Database

### Problem
User belum create data tapi sudah ada row di tabel `daily_targets` (ID 7).

### Possible Causes

1. **Previous Test Data**
   - Data dari testing API sebelumnya
   - POST request yang sudah dikirim sebelumnya

2. **Browser/Frontend Auto-Request**
   - Frontend melakukan request otomatis
   - Browser refresh dengan previous request

3. **Duplicate Request**
   - Double click pada submit button
   - Multiple POST requests

### How to Check

#### 1. Check Database Directly
```sql
SELECT * FROM daily_targets
ORDER BY created_at DESC;
```

#### 2. Check Application Logs
```bash
# Cari POST request ke daily-targets
grep "POST.*daily-targets" logs.txt
```

#### 3. Check Browser Network Tab
- Open DevTools → Network
- Filter: `/daily-targets`
- Check semua POST requests

### Solutions

#### Option 1: Delete Test Data via SQL
```sql
-- Delete all financial test data
DELETE FROM trading_activities;
DELETE FROM daily_targets;
DELETE FROM transactions;
DELETE FROM financial_goals;
DELETE FROM backtest_strategies;
DELETE FROM budgets;

-- Verify
SELECT COUNT(*) FROM daily_targets;
```

#### Option 2: Use Cleanup Script
```bash
# Make script executable
chmod +x scripts/cleanup-financial-data.sh

# Set database credentials
export DB_HOST=localhost
export DB_PORT=5432
export DB_USER=postgres
export DB_PASSWORD=your_password
export DB_NAME=filestore

# Run cleanup
./scripts/cleanup-financial-data.sh
```

#### Option 3: Delete via API
```bash
# Get all daily targets
GET /api/v1/finance/daily-targets

# Delete each one
DELETE /api/v1/finance/daily-targets/7
```

### Prevention

#### 1. Add Confirmation in Frontend
```javascript
// Before creating daily target
if (confirm('Create daily target?')) {
  createDailyTarget(data);
}
```

#### 2. Disable Submit Button After Click
```javascript
const handleSubmit = async () => {
  setLoading(true);
  try {
    await createDailyTarget(data);
  } finally {
    setLoading(false);
  }
}
```

#### 3. Check for Existing Target
```javascript
// Before creating, check if target exists for date
const existingTarget = await getDailyTarget(date);
if (existingTarget) {
  alert('Target already exists for this date!');
  return;
}
```

### Debugging Steps

1. **Check Created Date**
   ```sql
   SELECT id, date, created_at
   FROM daily_targets
   WHERE id = 7;
   ```

2. **Check Application Logs**
   ```bash
   # Find when ID 7 was created
   grep "Daily target created successfully" logs.txt | grep "id.*7"
   ```

3. **Check User ID**
   ```sql
   SELECT id, user_id, date
   FROM daily_targets;
   ```
   Verify it's your user_id.

---

## Common HTTP Status Codes Reference

| Status | When to Use |
|--------|-------------|
| **200 OK** | Successful GET, PUT, PATCH |
| **201 Created** | Successful POST (resource created) |
| **204 No Content** | Successful DELETE |
| **400 Bad Request** | Invalid input, validation error |
| **401 Unauthorized** | Missing/invalid authentication |
| **403 Forbidden** | Authenticated but no permission |
| **404 Not Found** | Resource doesn't exist ✅ |
| **409 Conflict** | Resource already exists ✅ |
| **422 Unprocessable Entity** | Validation error (alternative to 400) |
| **500 Internal Server Error** | Unexpected server error only |

---

## Frontend Improvements Applied

Based on the backend fixes, the following improvements have been implemented in the frontend:

### ✅ 1. Duplicate Target Prevention

**Implementation:**
```typescript
// Check if target already exists for selected date before creating
const selectedDate = format(new Date(formData.date), "yyyy-MM-dd");
const existingTarget = targets.find(t => {
  const targetDate = format(new Date(t.date), "yyyy-MM-dd");
  return targetDate === selectedDate;
});

if (existingTarget) {
  toast.error(`Target already exists for ${format(new Date(formData.date), "dd MMM yyyy")}. Please edit the existing target or choose a different date.`);
  return;
}
```

**Benefits:**
- Prevents duplicate targets before making API call
- Shows user-friendly error message with date
- Reduces unnecessary API requests
- Better UX - immediate feedback

### ✅ 2. Double Submission Prevention

**Implementation:**
```typescript
const [submitting, setSubmitting] = useState(false);

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  // Prevent double submission
  if (submitting) return;

  try {
    setSubmitting(true);
    // ... API call
  } finally {
    setSubmitting(false);
  }
};
```

**UI Updates:**
```typescript
<Button type="submit" disabled={submitting}>
  {submitting ? (
    <>
      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
      {editingTarget ? "Updating..." : "Creating..."}
    </>
  ) : (
    editingTarget ? "Update" : "Create"
  )}
</Button>
```

**Benefits:**
- Prevents multiple simultaneous requests
- Visual feedback (spinner + text)
- Disabled buttons during submission
- Professional loading state

### ✅ 3. Enhanced Error Handling

**Implementation:**
```typescript
catch (error: any) {
  console.error("Error saving target:", error);

  // Handle specific error types
  if (error.message?.includes("already exists") || error.message?.includes("duplicate")) {
    toast.error("A target already exists for this date. Please choose a different date.");
  } else if (error.message?.includes("not found")) {
    toast.error("Target not found. It may have been deleted.");
  } else if (error.message?.includes("unauthorized") || error.message?.includes("forbidden")) {
    toast.error("You don't have permission to perform this action.");
  } else {
    toast.error(error.message || "Failed to save target. Please try again.");
  }
}
```

**Error Types Handled:**
| Error Type | HTTP Status | User Message |
|------------|-------------|--------------|
| Already exists | 409 Conflict | "A target already exists for this date..." |
| Not found | 404 Not Found | "Target not found. It may have been deleted." |
| Unauthorized | 401/403 | "You don't have permission..." |
| Other errors | 500 | "Failed to save target. Please try again." |

**Benefits:**
- Clear, actionable error messages
- Differentiate between error types
- Better debugging with console.error
- User knows exactly what went wrong

### ✅ 4. Contextual Confirmation Dialogs

**Target Deletion:**
```typescript
const handleDelete = async (id: number, targetDate: string) => {
  const formattedDate = format(new Date(targetDate), "dd MMM yyyy");

  if (!confirm(`Are you sure you want to delete the trading target for ${formattedDate}?\n\nThis will also delete all trades recorded for this target. This action cannot be undone.`)) {
    return;
  }

  // ... delete logic with optimistic update
  setTargets(prev => prev.filter(t => t.id !== id));
  if (todayTarget?.id === id) {
    setTodayTarget(null);
    setTradingActivities([]);
  }
};
```

**Trade Deletion:**
```typescript
const handleDeleteTrade = async (tradeId: number, tradeInfo: any) => {
  const tradeType = tradeInfo.trade_type === "win" ? "Winning" : "Losing";
  const amount = formatCurrency(tradeInfo.amount);
  const symbol = tradeInfo.symbol ? ` (${tradeInfo.symbol})` : "";

  if (!confirm(`Delete this ${tradeType.toLowerCase()} trade?\n\nAmount: ${amount}${symbol}\n\nThis will recalculate your trading statistics. This action cannot be undone.`)) {
    return;
  }

  // ... delete logic with optimistic update
  setTradingActivities(prev => prev.filter(t => t.id !== tradeId));
};
```

**Benefits:**
- Shows exactly what will be deleted
- Displays important context (date, amount, type)
- Warns about consequences
- Optimistic UI updates for better UX

### ✅ 5. Success Messages Enhancement

**Before:**
```typescript
toast.success("Trade recorded successfully");
```

**After:**
```typescript
toast.success(`${tradeFormData.trade_type === "win" ? "Winning" : "Losing"} trade recorded successfully`);
toast.success(`Target for ${formattedDate} deleted successfully`);
```

**Benefits:**
- More specific feedback
- Confirms what action was taken
- Better user confidence

---

## Testing Checklist

### Duplicate Prevention
- [x] Try to create target for same date twice
- [x] Error message shows correct date
- [x] Can edit existing target instead
- [x] Can create target for different date

### Double Submission
- [x] Button shows loading state
- [x] Button is disabled during submission
- [x] Spinner animation works
- [x] Text changes to "Creating..." / "Updating..."
- [x] Cancel button also disabled during submission

### Error Handling
- [x] 404 errors show "not found" message
- [x] 409 errors show "already exists" message
- [x] 401/403 errors show "permission" message
- [x] 500 errors show "try again" message
- [x] All errors logged to console for debugging

### Confirmations
- [x] Target deletion shows date in confirm dialog
- [x] Target deletion warns about trade deletion
- [x] Trade deletion shows type, amount, symbol
- [x] Trade deletion warns about stat recalculation
- [x] Both confirmations show "cannot be undone" warning

### UI/UX
- [x] Optimistic updates work correctly
- [x] Local state syncs after delete
- [x] Page refreshes when needed (404 errors)
- [x] Success messages are specific
- [x] Loading states are smooth

---

## Summary

### Fixed:
✅ UpdateDailyTarget returns **404** when target not found (Backend)
✅ DeleteDailyTarget returns **404** when target not found (Backend)
✅ RefreshActualValues returns **404** when target not found (Backend)
✅ Created cleanup script for test data (Backend)
✅ **Duplicate target prevention with date validation (Frontend)**
✅ **Double submission prevention with loading states (Frontend)**
✅ **Enhanced error handling with specific messages (Frontend)**
✅ **Contextual confirmation dialogs with details (Frontend)**
✅ **Optimistic UI updates for better UX (Frontend)**

### To Clean Database:
```bash
# Option 1: SQL
DELETE FROM trading_activities;
DELETE FROM daily_targets;

# Option 2: Script
./scripts/cleanup-financial-data.sh

# Option 3: API
DELETE /api/v1/finance/daily-targets/7
```

### Prevention:
- ✅ Add frontend confirmation (Implemented)
- ✅ Disable button after click (Implemented)
- ✅ Check existing data before create (Implemented)
- ✅ Monitor application logs (Recommended)
- ✅ Optimistic UI updates (Implemented)
- ✅ Better error messages (Implemented)
