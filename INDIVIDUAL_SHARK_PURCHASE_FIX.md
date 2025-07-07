# Individual Shark Purchase Fix

## Problem Summary
After purchasing one shark in Level 1 (e.g., Shark A), all sharks in the same level (including Shark B) were showing as purchased. This was incorrect behavior - each shark should be tracked individually.

## Root Cause Analysis

### Issue 1: Level-Based Purchase Blocking
**Location**: `/server/routes/shark.ts` - Purchase logic (lines 27-37)

**Problem**: The system was checking if ANY shark in a level was purchased, and blocking further purchases in that level.

```javascript
// INCORRECT: Blocked entire level after any purchase
const existingPurchase = await SharkInvestment.findOne({ 
  phone, 
  level: Number(level)  // ❌ Only checked level, not specific shark
});

if (existingPurchase) {
  return res.status(400).json({ 
    error: `You have already purchased a shark at Level ${level}. Each level can only be purchased once.` 
  });
}
```

### Issue 2: Level-Based Purchase Status Display
**Location**: `/server/routes/shark.ts` - Levels endpoint (lines 380, 387)

**Problem**: The display logic marked ALL sharks in a level as purchased if ANY shark was purchased.

```javascript
// INCORRECT: Marked entire level as purchased
isPurchased: purchasedLevels.has(level) // ❌ Applied to all sharks in level
```

## Solution Implemented

### Fix 1: Individual Shark Purchase Tracking
**Changed purchase validation to check specific shark names instead of levels:**

```javascript
// CORRECT: Check for specific shark purchase
const existingPurchase = await SharkInvestment.findOne({ 
  phone, 
  shark: shark, // ✅ Check specific shark name
  level: Number(level)
});

if (existingPurchase) {
  return res.status(400).json({ 
    error: `You have already purchased ${shark}. Each shark can only be purchased once.` 
  });
}
```

### Fix 2: Individual Shark Status Display
**Changed display logic to track individual shark purchases:**

```javascript
// CORRECT: Track individual sharks
const userPurchases = await SharkInvestment.find({ 
  phone: userPhone
}).select('shark level');

// Create set of purchased shark names
const purchasedSharks = new Set(userPurchases.map(p => p.shark));

// Mark only purchased sharks
isPurchased: purchasedSharks.has(shark.title) // ✅ Individual shark check
```

### Fix 3: Level Completion Logic
**Added proper level completion tracking:**

```javascript
// A level is only "completed" if ALL sharks are purchased
const allSharksPurchased = sharks.every(shark => shark.isPurchased);

return {
  level: levelNumber,
  sharks: sharks,
  isPurchased: allSharksPurchased // ✅ Level completed only when ALL sharks purchased
};
```

## Behavioral Changes

### Before Fix ❌
1. Purchase Shark A in Level 1 → ✅ Success
2. Try to purchase Shark B in Level 1 → ❌ "You have already purchased a shark at Level 1"
3. Shark A shows: ✅ PURCHASED
4. Shark B shows: ✅ PURCHASED (incorrectly)

### After Fix ✅
1. Purchase Shark A in Level 1 → ✅ Success
2. Try to purchase Shark B in Level 1 → ✅ Success (different shark)
3. Shark A shows: ✅ PURCHASED
4. Shark B shows: ✅ PURCHASED (correctly, after individual purchase)
5. Try to purchase Shark A again → ❌ "You have already purchased Shark A"

## Database Schema Impact
**No database changes required** - the fix works with existing data structure:
- `SharkInvestment` model already stores individual shark names
- The issue was only in the API logic, not data storage

## Testing
Created comprehensive test script: `test_individual_shark_purchases.js`

**Test Coverage:**
1. ✅ Purchase first shark in a level
2. ✅ Verify only that shark shows as purchased
3. ✅ Prevent duplicate purchase of same shark
4. ✅ Allow purchase of different shark in same level
5. ✅ Verify both sharks show as individually purchased
6. ✅ Check purchased sharks endpoint accuracy

## Benefits

### ✅ Correct Individual Tracking
- Each shark is tracked independently
- Purchase status accurately reflects individual ownership
- No false "purchased" status for unowned sharks

### ✅ Flexible Purchase Model
- Users can buy multiple sharks within the same level
- Each shark purchase is validated individually
- Prevents duplicate purchases of specific sharks

### ✅ Better User Experience
- Clear indication of which specific sharks are owned
- Allows strategic purchasing within levels
- Accurate purchase history and status display

## Files Modified
1. **`/server/routes/shark.ts`**
   - Updated purchase validation logic (lines 27-37)
   - Fixed levels endpoint purchase status (lines 350-396)
   - Improved error messages for clarity

## Verification
Run the test script to verify the fix:
```bash
node test_individual_shark_purchases.js
```

The test will verify that:
- Individual sharks can be purchased independently
- Purchase status is tracked correctly per shark
- Duplicate prevention works for specific sharks
- Multiple sharks can be owned within the same level
