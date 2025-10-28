# FEATURE: Dark Mode Implementation

**Status**: Not Started
**Priority**: P3.2 (Medium - UI/UX Polish)
**Estimated Time**: 2-3 hours
**Dependencies**: FEATURE_daggerheart_theme.md (must be completed first)
**Business Impact**: User comfort and extended session support

**Purpose**: Implement a dark mode toggle for DaggerGM, providing users with a comfortable viewing experience during extended prep sessions and late-night gaming

---

## 📋 **Requirements**

### Dark Mode Functionality

- Toggle between light and dark themes
- Persist user preference (localStorage)
- System preference detection
- Smooth transition animations
- No flash of unstyled content (FOUC)

### Visual Requirements

- Dark purple background (#15 0.08 285 in OKLCH)
- Light text with proper contrast
- Teal primary color in dark mode
- Adjusted component shadows and borders
- Preserved readability for all content

### Technical Requirements

- next-themes integration
- CSS variable switching
- Server-side rendering support
- Accessibility maintained
- Performance optimized

---

## 🎯 **Success Criteria**

1. Theme toggle works without page refresh
2. User preference persists across sessions
3. No FOUC on page load
4. All components properly styled in both modes
5. 99% test coverage maintained
6. WCAG AA compliance in both themes

---

## 📐 **Technical Implementation**

### Dependencies to Add

```json
{
  "next-themes": "^0.2.1"
}
```

### Files to Create/Update

```
app/layout.tsx                    # ThemeProvider wrapper
components/ui/theme-toggle.tsx    # Toggle button component
app/globals.css                   # Dark mode variables
lib/hooks/use-theme.ts           # Theme hook wrapper
```

### Dark Mode CSS Variables

```css
.dark {
  --background: oklch(0.15 0.08 285);
  --foreground: oklch(0.95 0.005 285);
  --primary: var(--dagger-teal-400);
  --primary-foreground: oklch(0.15 0.12 285);
  --muted: oklch(0.25 0.06 285);
  --accent: var(--dagger-gold-400);

  /* Component-specific */
  --card: oklch(0.18 0.07 285);
  --border: oklch(0.3 0.05 285);
}
```

---

## 🧪 **Test Requirements**

### Unit Tests

- Theme toggle functionality
- Preference persistence
- System preference detection
- Hook behavior

### Integration Tests

- Theme switching without refresh
- localStorage interaction
- SSR compatibility
- Component styling in both modes

### E2E Tests

- User flow: toggle theme
- Persistence across page reload
- No FOUC scenarios

---

## 📊 **Phase Breakdown**

### Phase 1: Infrastructure Setup

1. Install and configure next-themes
2. Create ThemeProvider wrapper
3. Update layout with provider
4. Write tests for provider

### Phase 2: Theme Toggle Component

1. Create theme toggle button
2. Add keyboard accessibility
3. Position in header/nav
4. Test toggle functionality

### Phase 3: Dark Mode Styles

1. Define dark mode CSS variables
2. Update all components for dark mode
3. Test contrast ratios
4. Fix any styling issues

### Phase 4: Polish & Optimization

1. Add smooth transitions
2. Prevent FOUC
3. Performance optimization
4. Documentation

---

## 🚨 **Risk Mitigation**

- **Risk**: Flash of unstyled content
  - **Mitigation**: Use next-themes suppressHydrationWarning
- **Risk**: Poor contrast in dark mode
  - **Mitigation**: Automated contrast testing, OKLCH color space

- **Risk**: Component styling breaks
  - **Mitigation**: Comprehensive visual regression tests

---

## 📝 **Implementation Notes**

1. Use next-themes for battle-tested implementation
2. Keep transitions subtle (150-200ms)
3. Icon should clearly indicate current state
4. Consider adding "auto" option for system preference
5. Test on various devices and browsers

### Theme Toggle Component Example

```tsx
export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      aria-label="Toggle theme"
    >
      <SunIcon className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <MoonIcon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    </Button>
  )
}
```

---

**Estimated Time**: 3-4 hours
**Dependencies**: Daggerheart theme implementation
**Blocked By**: FEATURE_daggerheart_theme.md completion

---

## 🎬 **Next Steps After Completion**

1. Focus mode UI updates (FEATURE_focus_mode.md)
2. Enhanced loading states with theme awareness
3. Theme-aware export functionality
