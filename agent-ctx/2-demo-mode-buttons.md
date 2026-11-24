# Task 2: Hide Destructive Buttons in Demo Mode

**Agent:** Code (View Components Editor)
**Date:** Auto-generated
**Status:** Completed

## Summary

Hid destructive buttons (delete, edit, add) in 5 view components when in demo mode by using the `useIsDemo()` hook from `@/hooks/use-data` and wrapping destructive JSX with `{!isDemo && (...)}`.

## Files Modified

### 1. `src/components/views/customers-view.tsx`
- Added `useIsDemo` to the import from `@/hooks/use-data`.
- Added `const isDemo = useIsDemo();` right after `const { t } = useI18n();`.
- Wrapped 3 destructive buttons with `{!isDemo && (...)}`:
  - "New Customer" button (Plus icon) in the header
  - Edit button (Pencil icon) on each customer card
  - Delete button (Trash2 icon) on each customer card
- Left untouched: Export (Download icon) button.

### 2. `src/components/views/sounds-view.tsx`
- Added `useIsDemo` to the import from `@/hooks/use-data`.
- Added `const isDemo = useIsDemo();` right after `const { t } = useI18n();`.
- Wrapped 3 destructive buttons with `{!isDemo && (...)}`:
  - "New Sound" button (Plus icon) in the header
  - Edit button (Pencil icon) in each table row's action column
  - Delete button (Trash2 icon) in each table row's action column
- Left untouched: Export (Download icon) button.

### 3. `src/components/views/money-view.tsx`
- Added `useIsDemo` to the import from `@/hooks/use-data`.
- Added `const isDemo = useIsDemo();` right after `const { t } = useI18n();`.
- Wrapped 1 destructive button with `{!isDemo && (...)}`:
  - Delete button (Trash2 icon) in each payment table row
- No Plus or Pencil icon buttons in this view.
- Left untouched: Export (Download icon) button.

### 4. `src/components/views/notes-view.tsx`
- File did NOT already import from `@/hooks/use-data`, so added a new import: `import { useIsDemo } from "@/hooks/use-data";`.
- Added `const isDemo = useIsDemo();` right after `const { t } = useI18n();`.
- Wrapped 2 destructive buttons with `{!isDemo && (...)}`:
  - "New Note" button (Plus icon) in the header
  - Delete button (Trash2 icon) on each note card
- Left untouched: Pin/Unpin buttons (Pin/PinOff icons) — those are not edit/delete/add operations.

### 5. `src/components/views/promo-detail-view.tsx`
- Added `useIsDemo` to the existing import `import { usePromos, useDeletePromo } from "@/hooks/use-data";`.
- Added `const isDemo = useIsDemo();` right after `const { t } = useI18n();`.
- Wrapped 5 destructive / sharing / approval buttons with `{!isDemo && (...)}`:
  - Share toggle buttons (Lock/Unlock — "Stop Share" / "Share with Customer") in the header
  - Edit button (Pencil icon) in the header
  - "Notify" button (Bell icon) in the header
  - Delete button (Trash2 icon, rose-styled) in the header
  - "Request Approval" button (Bell icon) on each payment row
- Left untouched:
  - Copy Link button (Share2 icon) — used to copy an existing share link
  - Visible-to Select dropdown (not a button, but a dropdown selector)
  - Back button (ArrowLeft icon) — read-only navigation
  - Approval status badges (read-only indicators)

## Verification

- Ran `cd /home/z/my-project && bun run lint` -> exit code 0, no errors.
- Verified dev server compiled the changed files without errors (dev.log shows successful compilations).

## Pattern Used

```tsx
// Before
<Button variant="ghost" size="icon" onClick={...}>
  <Trash2 className="h-4 w-4" />
</Button>

// After
{!isDemo && (
  <Button variant="ghost" size="icon" onClick={...}>
    <Trash2 className="h-4 w-4" />
  </Button>
)}
```

For conditional share toggle (Lock vs Unlock):
```tsx
{!isDemo && (
  promo.shareEnabled ? (
    <Button ...><Lock .../> ...</Button>
  ) : (
    <Button ...><Unlock .../> ...</Button>
  )
)}
```
