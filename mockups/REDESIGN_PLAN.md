# DaggerGM UI Redesign Plan

## Overview

This document outlines the comprehensive UI/UX redesign for DaggerGM, transitioning from the current dark purple theme to a light, elegant **Moonlit Steel** aesthetic.

**Design Philosophy**: _Intentionally understated with subtle signals of magic and power_

---

## Selected Direction: Moonlit Steel

### Core Identity

- **Feel**: Elegant, refined, heroic
- **Associations**: Moonlight, armor, nobility, quests
- **Mood**: Professional tool that inspires creativity without overwhelming

### Why This Works

1. **Distinct from Daggerheart**: Cool slate/gold vs. Daggerheart's teal
2. **Light theme**: Easier on the eyes for extended prep sessions
3. **Premium feel**: Gold accents convey quality without fantasy cliche
4. **Readable**: High contrast for content-heavy screens

---

## Color System

### Primary Palette

| Token             | Hex       | Usage                               |
| ----------------- | --------- | ----------------------------------- |
| `--background`    | `#f8fafc` | Page background (slate-50)          |
| `--surface`       | `#ffffff` | Cards, elevated surfaces            |
| `--surface-muted` | `#f1f5f9` | Nested elements, inputs (slate-100) |
| `--border`        | `#e2e8f0` | Card borders, dividers (slate-200)  |
| `--border-subtle` | `#cbd5e1` | Hover borders (slate-300)           |

### Text Colors

| Token              | Hex       | Usage                                 |
| ------------------ | --------- | ------------------------------------- |
| `--text-primary`   | `#0f172a` | Headlines, important text (slate-900) |
| `--text-secondary` | `#334155` | Body text (slate-700)                 |
| `--text-muted`     | `#64748b` | Labels, captions (slate-500)          |
| `--text-disabled`  | `#94a3b8` | Inactive elements (slate-400)         |

### Brand Colors

| Token             | Hex       | Usage                              |
| ----------------- | --------- | ---------------------------------- |
| `--primary`       | `#475569` | Primary buttons, links (slate-600) |
| `--primary-hover` | `#334155` | Primary hover state (slate-700)    |
| `--accent`        | `#d4af37` | Gold accents, highlights           |
| `--accent-light`  | `#f0e6c8` | Gold backgrounds, badges           |
| `--accent-dark`   | `#b8962e` | Gold hover states                  |

### Semantic Colors

| State       | Background | Text      | Border    |
| ----------- | ---------- | --------- | --------- |
| **Success** | `#f0fdf4`  | `#166534` | `#86efac` |
| **Warning** | `#fffbeb`  | `#92400e` | `#fcd34d` |
| **Error**   | `#fef2f2`  | `#991b1b` | `#fca5a5` |
| **Info**    | `#f8fafc`  | `#475569` | `#cbd5e1` |

### Combat/Adversary Colors

| Element       | Background | Text      | Border    |
| ------------- | ---------- | --------- | --------- |
| **Minion**    | `#fef2f2`  | `#991b1b` | `#fca5a5` |
| **Standard**  | `#fef2f2`  | `#7c2d12` | `#f87171` |
| **Solo/Boss** | `#450a0a`  | `#fef2f2` | `#dc2626` |

---

## Typography

### Font Stack (System Fonts Only)

```css
font-family:
  system-ui,
  -apple-system,
  BlinkMacSystemFont,
  'Segoe UI',
  Roboto,
  sans-serif;
```

### Type Scale

| Level          | Classes     | Size | Weight          | Usage              |
| -------------- | ----------- | ---- | --------------- | ------------------ |
| **Display**    | `text-3xl`  | 30px | `font-bold`     | Landing hero only  |
| **Page Title** | `text-2xl`  | 24px | `font-semibold` | Page headers       |
| **Section**    | `text-xl`   | 20px | `font-semibold` | Section headers    |
| **Card Title** | `text-lg`   | 18px | `font-medium`   | Card headings      |
| **Body**       | `text-base` | 16px | `font-normal`   | Default text       |
| **Caption**    | `text-sm`   | 14px | `font-normal`   | Labels, metadata   |
| **Tiny**       | `text-xs`   | 12px | `font-medium`   | Badges, timestamps |

### Typography Rules

1. **Headlines**: Slate-900 (`#0f172a`), semibold/bold
2. **Body**: Slate-700 (`#334155`), regular weight
3. **Labels**: Slate-500 (`#64748b`), regular or medium
4. **Gold accent text**: Use sparingly for "Read-Aloud" labels, scene type indicators
5. **No fantasy fonts**: Clean, modern, professional

---

## Spacing & Layout

### Spacing Scale (4px base)

| Name      | Value | Usage                      |
| --------- | ----- | -------------------------- |
| `space-1` | 4px   | Icon gaps, tight spacing   |
| `space-2` | 8px   | Related elements           |
| `space-3` | 12px  | Small gaps                 |
| `space-4` | 16px  | Default element spacing    |
| `space-6` | 24px  | Card padding, section gaps |
| `space-8` | 32px  | Page sections              |

### Container Widths

| Container   | Max Width   | Usage               |
| ----------- | ----------- | ------------------- |
| Full page   | `max-w-6xl` | Main content area   |
| Form/dialog | `max-w-2xl` | Focused content     |
| Narrow      | `max-w-md`  | Single-column forms |

### Border Radius

| Size    | Class          | Usage                    |
| ------- | -------------- | ------------------------ |
| Large   | `rounded-xl`   | Cards, modals            |
| Medium  | `rounded-lg`   | Buttons, larger elements |
| Default | `rounded-md`   | Inputs, small cards      |
| Small   | `rounded`      | Badges                   |
| Full    | `rounded-full` | Pills, avatars           |

---

## Component Patterns

### Cards

**Standard Card:**

```html
<div
  class="bg-white rounded-xl p-6 border border-slate-200 shadow-xs
            hover:shadow-md hover:border-slate-300 transition-all"
></div>
```

**Highlighted Card (Selected/Active):**

```html
<div class="bg-white rounded-xl p-6 border-2 border-amber-400 shadow-md"></div>
```

**Nested/Muted Card:**

```html
<div class="bg-slate-50 rounded-lg p-4 border border-slate-100"></div>
```

### Buttons

**Primary (Slate):**

```html
<button
  class="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white
               font-medium rounded-lg shadow-xs transition-colors"
>
  Confirm
</button>
```

**Secondary (Gold Outline):**

```html
<button
  class="px-4 py-2 bg-white border-2 border-amber-400 text-amber-700
               hover:bg-amber-50 font-medium rounded-lg transition-colors"
>
  Edit
</button>
```

**Ghost:**

```html
<button
  class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700
               rounded-lg transition-colors"
>
  Cancel
</button>
```

**Destructive:**

```html
<button
  class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white
               font-medium rounded-lg transition-colors"
>
  Delete
</button>
```

### Inputs

```html
<input
  type="text"
  class="w-full bg-white border border-slate-300 rounded-lg
       px-4 py-2.5 text-slate-900 placeholder:text-slate-400
       focus:border-slate-500 focus:ring-2 focus:ring-slate-500/20
       focus:outline-hidden transition-all"
/>
```

### Badges

**Scene Type:**

```html
<span class="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-sm font-medium">
  Exploration
</span>
```

**Status - Confirmed:**

```html
<span class="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
  ✓ Confirmed
</span>
```

**Status - Pending:**

```html
<span class="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-sm"> Pending </span>
```

---

## Special UI Elements

### Read-Aloud Boxes (GM Narrative)

The signature element - subtle gold accent with premium feel:

```html
<div
  class="bg-linear-to-r from-amber-50 to-white border-l-4 border-amber-400
            rounded-r-lg p-5 shadow-xs"
>
  <p class="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-3">
    Read-Aloud Narrative
  </p>
  <p class="text-slate-700 italic leading-relaxed text-lg">"The village gates creak open..."</p>
</div>
```

### Context Sections

```html
<div class="border-l-4 border-slate-400 pl-4 py-2">
  <h4 class="font-semibold text-slate-900 mb-2">Context</h4>
  <ul class="text-slate-600 space-y-1.5 text-sm">
    <li><strong>Why:</strong> Explanation here</li>
  </ul>
</div>
```

### NPC Cards

```html
<div class="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
  <h3 class="font-semibold text-slate-900 text-lg mb-4">Elder Mora</h3>
  <table class="w-full text-sm">
    <tr class="border-b border-slate-100">
      <td class="py-2 text-slate-500 w-28">Appearance</td>
      <td class="py-2 text-slate-700">Silver-haired woman, weathered face</td>
    </tr>
    <tr class="border-b border-slate-100">
      <td class="py-2 text-slate-500">Motivation</td>
      <td class="py-2 text-slate-700">Protect her village, find her son</td>
    </tr>
    <tr>
      <td class="py-2 text-slate-500">Secret</td>
      <td class="py-2 text-amber-600 font-medium">Her son was first to disappear</td>
    </tr>
  </table>
</div>
```

### Stat Blocks (Adversaries)

```html
<div class="bg-red-50 border border-red-200 rounded-xl p-5">
  <div class="flex justify-between items-start mb-4">
    <div>
      <h4 class="font-bold text-red-900 text-lg">Corrupted Wolf</h4>
      <span class="text-red-600 text-sm">Minion</span>
    </div>
    <span class="px-2.5 py-1 bg-red-200 text-red-800 text-xs font-bold rounded uppercase">
      Minion
    </span>
  </div>
  <div class="grid grid-cols-3 gap-3 mb-4">
    <div class="bg-white/80 p-3 rounded-lg text-center border border-red-100">
      <p class="text-xs text-red-600 uppercase font-medium">HP</p>
      <p class="text-xl font-bold text-red-900">8</p>
    </div>
    <!-- Armor, Evasion similar -->
  </div>
  <div class="space-y-2 text-sm text-red-900">
    <p><strong>Bite:</strong> 1d8+2 damage</p>
    <p><strong>Pack Tactics:</strong> +2 to attack if ally within 5ft</p>
  </div>
</div>
```

### Progress Indicators

**Step Progress:**

```html
<div class="flex gap-2">
  <div class="flex-1 h-2 bg-green-500 rounded-full"></div>
  <!-- Complete -->
  <div class="flex-1 h-2 bg-slate-600 rounded-full"></div>
  <!-- Current -->
  <div class="flex-1 h-2 bg-slate-200 rounded-full"></div>
  <!-- Pending -->
</div>
```

**Scene Confirmation Progress:**

```html
<div class="flex items-center gap-3">
  <div class="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
    <div class="h-full bg-amber-400 transition-all" style="width: 66%"></div>
  </div>
  <span class="text-sm font-medium text-slate-600">2/3 confirmed</span>
</div>
```

---

## Subtle Magic Effects

### Particle Animation (CSS)

Floating particles on landing page and key sections:

```css
@keyframes float-particle {
  0%,
  100% {
    transform: translateY(0) rotate(0deg);
    opacity: 0.3;
  }
  50% {
    transform: translateY(-20px) rotate(180deg);
    opacity: 0.6;
  }
}

.particle {
  position: absolute;
  width: 4px;
  height: 4px;
  background: linear-gradient(135deg, #d4af37, #f0e6c8);
  border-radius: 50%;
  animation: float-particle 4s ease-in-out infinite;
}
```

### Hover Glow Effect

Subtle glow on interactive cards:

```css
.card-glow {
  transition: box-shadow 0.3s ease;
}

.card-glow:hover {
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -2px rgba(0, 0, 0, 0.1),
    0 0 20px rgba(212, 175, 55, 0.15);
}
```

### Button Shimmer (Optional)

Very subtle shimmer on primary CTA:

```css
@keyframes shimmer {
  0% {
    background-position: -200% center;
  }
  100% {
    background-position: 200% center;
  }
}

.btn-shimmer {
  background: linear-gradient(
    90deg,
    #475569 0%,
    #475569 40%,
    #64748b 50%,
    #475569 60%,
    #475569 100%
  );
  background-size: 200% auto;
  animation: shimmer 3s linear infinite;
}
```

---

## Page-by-Page Recommendations

### 1. Landing Page

**Changes:**

- White background with subtle slate-50 sections
- Hero: Clean typography, single gold-accented CTA
- Floating particles (sparse, slow) in hero section
- Feature cards with hover glow
- Trust indicators in muted slate tones

**Remove:**

- Heavy gradients
- Multiple competing accent colors
- Overly saturated elements

### 2. Dashboard

**Changes:**

- Clean card grid on white/slate-50 background
- Adventure cards with subtle shadow, gold border on hover
- Status badges in semantic colors
- Progress indicators in slate with gold fill

**Key Elements:**

- "Create New Adventure" - Primary slate button with gold icon
- Adventure cards - White with slate border, hover shadow + gold glow
- Empty state - Minimal, encouraging copy

### 3. Adventure Creation Flow

**Changes:**

- Step indicator: Slate circles, gold fill for current/complete
- Form inputs: Clean slate borders, focus ring
- Preview cards: Real-time feedback with subtle transitions
- Submit: Primary slate button

### 4. Scene Overview

**Changes:**

- Scene cards in a clean grid
- Each card shows: Title, duration badge, scene type, confirm/edit buttons
- Confirmed scenes: Green checkmark badge, subtle green border
- Unconfirmed: Default slate styling
- Collapsible sections for dense content

### 5. Scene Expansion (Detail View)

**Changes:**

- Master layout with sticky navigation
- Read-aloud boxes: Gold left border, cream gradient
- NPC cards: Clean tables with slate dividers
- Adversary blocks: Red-tinted for combat tension
- Context sections: Slate left border
- Collapsible nested content (abilities, loot, etc.)

### 6. Export Page

**Changes:**

- Format selection cards (PDF, Markdown, Print)
- Preview pane with actual styled content
- Download button: Primary slate with download icon
- Success state: Green confirmation

---

## Progressive Disclosure Pattern

### Implementation

Use collapsible sections throughout:

```html
<details class="group border border-slate-200 rounded-lg overflow-hidden">
  <summary
    class="flex justify-between items-center p-4 bg-slate-50
                  cursor-pointer hover:bg-slate-100 transition-colors"
  >
    <span class="font-medium text-slate-900">NPC Details (3)</span>
    <svg class="w-5 h-5 text-slate-500 transform group-open:rotate-180 transition-transform">
      <!-- Chevron icon -->
    </svg>
  </summary>
  <div class="p-4 border-t border-slate-200">
    <!-- Content -->
  </div>
</details>
```

### When to Use

- **Always collapsed by default:**
  - NPC lists (show count)
  - Adversary abilities (show name only)
  - Environmental details
  - Loot tables

- **Always expanded:**
  - Scene title and description
  - Read-aloud narrative
  - Primary scene objective

---

## Accessibility

### Focus States

```css
focus:outline-hidden focus:ring-2 focus:ring-slate-500 focus:ring-offset-2
```

### Color Contrast

All text combinations meet WCAG AA:

- Slate-900 on white: 15.5:1
- Slate-700 on white: 8.6:1
- Slate-500 on white: 4.6:1
- Amber-700 on white: 4.8:1
- Amber-700 on amber-50: 5.2:1

### Touch Targets

- Minimum 44x44px for all interactive elements
- Adequate padding on buttons (`py-2 px-4` minimum)

---

## Migration Checklist

### Phase 1: Color System

- [ ] Update Tailwind config with new color tokens
- [ ] Replace all `bg-dagger-*` classes with slate/amber equivalents
- [ ] Update semantic colors (success, warning, error)
- [ ] Test in light mode (dark mode deferred)

### Phase 2: Typography

- [ ] Standardize heading hierarchy
- [ ] Apply consistent text colors
- [ ] Remove any fantasy/decorative fonts
- [ ] Verify type scale across breakpoints

### Phase 3: Components

- [ ] Update Button variants in shadcn
- [ ] Update Card component styles
- [ ] Update Input/Select styles
- [ ] Update Badge variants
- [ ] Create Read-Aloud component
- [ ] Create Stat Block component

### Phase 4: Special Elements

- [ ] Implement collapsible sections
- [ ] Add hover glow effects
- [ ] Add subtle particle animation (landing only)
- [ ] Test all interactive states

### Phase 5: Polish

- [ ] Verify accessibility (contrast, focus states)
- [ ] Test responsive breakpoints
- [ ] Performance audit (animation FPS)
- [ ] Cross-browser testing

---

## Files to Update

| File                       | Changes                                   |
| -------------------------- | ----------------------------------------- |
| `tailwind.config.ts`       | New color tokens, remove dagger-\* colors |
| `globals.css`              | CSS variables, animation keyframes        |
| `components/ui/button.tsx` | New variant styles                        |
| `components/ui/card.tsx`   | Updated styling                           |
| `components/ui/badge.tsx`  | New variants                              |
| `features/*/components/*`  | Apply new design system                   |

---

## Reference Screenshots

- Moonlit Steel mockup: `.playwright-mcp/color-direction-C-moonlit-steel.png`
- Current design (for comparison): `.playwright-mcp/` directory

---

**Version**: 2024-12-11
**Status**: ✅ COMPLETE - Mockup finalized and deployed
**Selected Palette**: Moonlit Steel (Option C)
**Backup Palette**: Forest & Flame (Option D)

---

## Implementation Complete

The Moonlit Steel redesign has been fully implemented in the mockup. All 12 pages have been updated with:

### Completed Features

- [x] **Color System**: Full slate/gold palette applied throughout
- [x] **Typography**: Consistent heading hierarchy and text colors
- [x] **Cards**: Hover glow effects, consistent borders and shadows
- [x] **Buttons**: Shimmer effects, hover states, focus rings
- [x] **Progressive Disclosure**: Collapsible sections with chevron animations
- [x] **Visual Hierarchy**: Gold borders for must-read content, slate for reference
- [x] **Progress Indicators**: Gold pulse animation for current step
- [x] **Accessibility**: Focus states on all interactive elements
- [x] **Particles**: Floating particles on landing page (8 particles, varied sizes)
- [x] **Scene Badges**: Consistent styling (Exploration/Combat/Social)

### Files

- `mockups/index.html` - Main mockup file (Moonlit Steel theme)
- `mockups/index-dark-theme-archived.html` - Original dark theme (archived)
- `mockups/DESIGN_RULES.md` - Design constraints for migration
- `mockups/REDESIGN_PLAN.md` - This document

### Related Issues

- #96: Progressive disclosure with collapsible sections
- #97: Visual hierarchy with section borders
- #98: Landing page polish and particles
- #99: Scene review pages improvements
- #100: Login, Dashboard, Export polish
- #101: Finalization and deployment
