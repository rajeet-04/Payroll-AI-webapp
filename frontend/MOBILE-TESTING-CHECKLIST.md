# Mobile UI Testing Checklist

## Quick Visual Test Guide

### Prerequisites
- Dev server running: `cd frontend && pnpm run dev`
- Open http://localhost:3000
- Chrome DevTools open (F12)
- Device Toolbar enabled (Ctrl+Shift+M or Cmd+Shift+M)

## Test Scenarios

### 1. Mobile Menu (< 640px)
**Test Device**: iPhone SE (375 × 667)

- [ ] Header shows hamburger menu icon (☰) on the left
- [ ] Hamburger menu is clickable with proper touch target
- [ ] Clicking hamburger opens full-screen sidebar dialog
- [ ] Sidebar shows logo, navigation links, and user info
- [ ] Navigation links are properly sized for touch
- [ ] Clicking outside or X closes the sidebar
- [ ] Header title is smaller on mobile (text-base)
- [ ] Subtitle is hidden on mobile

**Expected**: Clean mobile header with accessible menu

### 2. Desktop Navigation (≥ 640px)
**Test Device**: iPad (768 × 1024) or Desktop

- [ ] Hamburger menu is hidden
- [ ] Static sidebar visible on the left
- [ ] Sidebar has proper width (w-64)
- [ ] Header shows full title and subtitle
- [ ] No overflow or layout shifts

**Expected**: Traditional desktop layout with static sidebar

### 3. Dialog Forms - Mobile Full Screen
**Test Devices**: iPhone 12 Pro (390 × 844), Pixel 5 (393 × 851)

**Test all dialogs**:
- [ ] **Add Employee Dialog**
  - Opens full-screen on mobile
  - Form fields properly sized
  - Scroll works smoothly
  - All input fields accessible
  - Close button in top-right corner
  - Submit buttons at bottom

- [ ] **Request Leave Dialog**
  - Full-screen on mobile
  - Date pickers work on mobile
  - AI helper button visible and clickable
  - Form scrolls if content overflows

- [ ] **Run Payroll Dialog**
  - Full-screen on mobile
  - Date inputs accessible
  - Proper spacing on mobile

- [ ] **AI Assistant Dialog**
  - Full-screen on mobile
  - Chat area fills viewport
  - Input box at bottom
  - Messages scroll properly
  - Suggested prompts are touch-friendly

**Expected**: All dialogs use full viewport on mobile, easy to use

### 4. Dialog Forms - Desktop Centered
**Test Device**: Desktop (1920 × 1080)

- [ ] Dialogs are centered modals (not full-screen)
- [ ] Proper max-width constraints
- [ ] Backdrop blur visible
- [ ] Rounded corners (sm:rounded-lg)
- [ ] Close button positioned correctly

**Expected**: Traditional modal behavior on desktop

### 5. Tables - Horizontal Scroll
**Test**: View Payroll Details Dialog on mobile

- [ ] Summary cards stack vertically (1 column)
- [ ] Table scrolls horizontally
- [ ] No horizontal page overflow
- [ ] All columns visible when scrolling
- [ ] Text doesn't wrap awkwardly
- [ ] Scroll indicator visible (if supported)

**Expected**: Table maintains layout, scrolls smoothly

### 6. Touch Targets
**Test Device**: iPhone (any)

Check these elements:
- [ ] Hamburger menu button ≥ 44px × 44px
- [ ] Navigation links in sidebar ≥ 44px height
- [ ] Dialog close buttons ≥ 44px × 44px
- [ ] Form submit buttons ≥ 44px height
- [ ] Icon buttons ≥ 44px × 44px
- [ ] Dropdown menu items ≥ 44px height

**Expected**: All interactive elements easy to tap without precision

### 7. Responsive Grid Layouts
**Test**: Dashboard Page

- [ ] **Mobile (< 640px)**: Stats cards stack vertically (1 column)
- [ ] **Tablet (640-768px)**: Cards in 2 columns
- [ ] **Desktop (≥ 1024px)**: Cards in 4 columns
- [ ] No layout breaks at breakpoints
- [ ] Cards maintain aspect ratio

**Expected**: Smooth responsive behavior at all sizes

### 8. Form Inputs
**Test**: Any dialog form on mobile

- [ ] Input fields are full-width
- [ ] Text size ≥ 16px (prevents iOS zoom)
- [ ] Labels properly associated
- [ ] Date pickers open native picker
- [ ] Select dropdowns work on mobile
- [ ] Validation messages visible

**Expected**: Mobile-friendly form UX, no unexpected zooming

### 9. Dark Mode
**Test**: Toggle theme on mobile and desktop

- [ ] Toggle works on mobile
- [ ] Dialog backdrops update correctly
- [ ] All text readable in dark mode
- [ ] Borders and separators visible
- [ ] Glassmorphism effects work

**Expected**: Consistent dark mode across all components

### 10. Page Padding
**Test**: All app pages (dashboard, employees, etc.)

- [ ] **Mobile**: Content has p-4 padding
- [ ] **Desktop**: Content has p-6 padding
- [ ] No content touching screen edges
- [ ] Consistent spacing across pages

**Expected**: Proper breathing room on all screen sizes

## Performance Tests

### Lighthouse Audit (Chrome DevTools)
1. Open DevTools > Lighthouse
2. Select "Mobile" device
3. Check "Performance" category
4. Generate report

**Target Scores**:
- [ ] Performance ≥ 90
- [ ] First Contentful Paint ≤ 2.0s
- [ ] Time to Interactive ≤ 3.0s
- [ ] Cumulative Layout Shift ≤ 0.1

### Lighthouse CI (Command Line)
```bash
cd frontend
npx lhci autorun
```

**Expected**: All assertions pass per `.lighthouserc.json`

## Common Issues to Watch For

### ❌ Issues That Should NOT Occur
- Horizontal scrolling on any page (except tables)
- Tiny buttons that are hard to tap
- Text that's too small to read
- Dialogs that overflow the viewport
- Layout shifts when toggling menu
- Broken navigation on mobile
- Forms that don't fit on screen

### ✅ Expected Behavior
- Smooth scrolling
- Responsive text sizes
- Touch-friendly targets
- No horizontal overflow
- Proper viewport usage
- Fast page loads
- Accessible navigation

## Browser Testing Matrix

### Mobile Browsers
- [ ] iOS Safari (latest)
- [ ] Chrome Android (latest)
- [ ] Firefox Android (latest)
- [ ] Samsung Internet (latest)

### Desktop Browsers
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

## Regression Testing

After making any changes:
1. [ ] Run build: `pnpm run build`
2. [ ] Check for TypeScript errors
3. [ ] Test mobile menu
4. [ ] Test one dialog form
5. [ ] Test table scrolling
6. [ ] Run Lighthouse audit

## Sign-Off

**Tested By**: _________________
**Date**: _________________
**Devices Tested**: _________________
**Issues Found**: _________________

---

**Status**:
- [ ] ✅ All tests passed
- [ ] ⚠️ Minor issues (document below)
- [ ] ❌ Blocking issues (document below)

**Notes**:
_________________________________
_________________________________
_________________________________
