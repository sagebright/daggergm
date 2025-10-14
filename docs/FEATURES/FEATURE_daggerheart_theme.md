# FEATURE: Daggerheart Theme Implementation

**Purpose**: Implement the Daggerheart-inspired color palette and typography system across DaggerGM, establishing a modern fantasy toolkit aesthetic that differentiates from generic TTRPG tools.

**Priority**: HIGH - Foundation for all UI work

---

## 📋 **Requirements**

### Color Palette Implementation

- Deep purple primary colors (#18094d, #24135f)
- Soft teal accent (#83CDC2)
- Golden yellow highlights (#E7C74B)
- OKLCH color space for accessibility
- Light and dark mode variants
- 508 compliance (4.5:1 contrast ratios)

### Typography System

- System fonts with Roboto/Inter fallback
- Clear hierarchy: Display (24px+), Medium (18px), Small (16px), Caption (14px)
- Weights: Bold (600), Medium (500), Regular (400)

### Component Updates

- Update all shadcn/ui components with new theme
- Maintain existing functionality
- Add theme-specific hover states
- Ensure mobile responsiveness

---

## 🎯 **Success Criteria**

1. All UI elements use Daggerheart palette
2. WCAG AA compliance verified
3. Components maintain 99% test coverage
4. No visual regressions
5. Theme switcher functional (light mode only for MVP)

---

## 📐 **Technical Implementation**

### Files to Update

```
app/globals.css          # CSS custom properties
tailwind.config.ts       # Tailwind theme extension
components/ui/*.tsx      # Component theme updates
```

### CSS Variables Structure

```css
:root {
  /* Daggerheart-inspired palette */
  --dagger-purple-900: oklch(0.18 0.15 285);
  --dagger-purple-800: oklch(0.24 0.12 285);
  --dagger-teal-400: oklch(0.75 0.08 180);
  --dagger-gold-400: oklch(0.82 0.12 85);

  /* Semantic tokens */
  --background: oklch(0.98 0.005 285);
  --foreground: oklch(0.15 0.12 285);
  --primary: var(--dagger-purple-800);
  --accent: var(--dagger-teal-400);
}
```

---

## 🧪 **Test Requirements**

### Unit Tests

- Color contrast validation tests
- Theme variable application tests
- Component rendering with new theme

### Visual Tests

- Screenshot comparisons for all components
- Mobile responsiveness verification
- Cross-browser compatibility

### Accessibility Tests

- Automated contrast checking
- Screen reader compatibility
- Keyboard navigation preserved

---

## 📊 **Phase Breakdown**

### Phase 1: CSS Variables & Tailwind Config

1. Update globals.css with OKLCH colors
2. Extend tailwind.config.ts theme
3. Create theme utility functions
4. Write tests for color contrast

### Phase 2: Component Updates

1. Update Button component styling
2. Update Card and form components
3. Update typography components
4. Verify all hover/focus states

### Phase 3: Integration & Polish

1. Update page layouts with new theme
2. Add theme documentation
3. Performance optimization
4. Final accessibility audit

---

## 🚨 **Risk Mitigation**

- **Risk**: Breaking existing functionality
  - **Mitigation**: Comprehensive test coverage before changes
- **Risk**: Accessibility regressions
  - **Mitigation**: Automated contrast testing, manual audits

- **Risk**: Performance impact
  - **Mitigation**: CSS variable approach, no runtime calculations

---

## 📝 **Implementation Notes**

1. Start with TDD - write visual regression tests first
2. Use CSS custom properties for runtime flexibility
3. Keep dark mode structure but implement light only
4. Document all color decisions for future reference
5. Preserve all existing component APIs

---

**Estimated Time**: 4-6 hours
**Dependencies**: None
**Blocked By**: Nothing

---

## 🎬 **Next Steps After Completion**

1. Dark mode implementation (FEATURE_dark_mode.md)
2. Focus mode styling (FEATURE_focus_mode.md)
3. Credit display components (FEATURE_credit_display.md)
