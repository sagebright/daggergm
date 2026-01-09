# DaggerGM Mockup Design Rules

This document defines the design constraints for the workflow mockup to ensure easy migration to the production codebase.

**Design Direction**: Moonlit Steel - Elegant, refined, heroic

---

## Color Palette (Moonlit Steel Theme)

A light, sophisticated palette with cool slate grays and gold accents.

### Mockup Color Definitions

```javascript
// Added to mockup via Tailwind CDN config
colors: {
  'moonlit': {
    'bg': '#f8fafc',          // Page background (slate-50)
    'surface': '#ffffff',      // Cards, elevated surfaces
    'muted': '#f1f5f9',        // Nested elements, inputs (slate-100)
    'border': '#e2e8f0',       // Card borders, dividers (slate-200)
    'border-hover': '#cbd5e1', // Hover borders (slate-300)
  },
  'steel': {
    900: '#0f172a',            // Primary text (slate-900)
    700: '#334155',            // Body text (slate-700)
    600: '#475569',            // Primary buttons (slate-600)
    500: '#64748b',            // Muted text (slate-500)
    400: '#94a3b8',            // Disabled text (slate-400)
  },
  'gold': {
    700: '#b8962e',            // Gold hover
    600: '#d4af37',            // Primary gold accent
    500: '#d4af37',            // Gold (alias)
    400: '#e0c35a',            // Light gold
    100: '#f0e6c8',            // Gold backgrounds
    50: '#faf6eb',             // Subtle gold tint
  },
}
```

### Color Usage Rules

| Purpose               | Mockup Class             | Usage                                |
| --------------------- | ------------------------ | ------------------------------------ |
| **Page background**   | `bg-slate-50`            | Main app background                  |
| **Cards/panels**      | `bg-white`               | Elevated surfaces                    |
| **Nested elements**   | `bg-slate-100`           | Inputs, nested cards                 |
| **Borders**           | `border-slate-200`       | Card borders, dividers               |
| **Hover borders**     | `hover:border-slate-300` | Interactive elements                 |
| **Primary buttons**   | `bg-slate-600`           | Main actions (Generate, Confirm)     |
| **Secondary buttons** | `border-amber-400`       | Edit, alternative actions            |
| **Headings/emphasis** | `text-slate-900`         | Section titles                       |
| **Gold accents**      | `text-amber-600`         | Highlights, secrets, special content |

### Text Colors

| Role               | Class            | Usage                     |
| ------------------ | ---------------- | ------------------------- |
| **Primary text**   | `text-slate-900` | Headlines, important text |
| **Secondary text** | `text-slate-700` | Body text                 |
| **Muted text**     | `text-slate-500` | Labels, captions          |
| **Disabled text**  | `text-slate-400` | Inactive elements         |
| **Gold accent**    | `text-amber-600` | Special content, secrets  |

### Semantic Colors (Status)

| State       | Background    | Text             | Border             |
| ----------- | ------------- | ---------------- | ------------------ |
| **Success** | `bg-green-50` | `text-green-700` | `border-green-200` |
| **Warning** | `bg-amber-50` | `text-amber-700` | `border-amber-200` |
| **Error**   | `bg-red-50`   | `text-red-700`   | `border-red-200`   |
| **Info**    | `bg-slate-50` | `text-slate-600` | `border-slate-200` |

---

## Typography

### Font Stack (MANDATORY)

Use system fonts only. No Google Fonts (causes CI/CD issues):

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

| Name           | Classes                  | Size | Usage                    |
| -------------- | ------------------------ | ---- | ------------------------ |
| **Display**    | `text-3xl font-bold`     | 30px | Landing hero only        |
| **Page Title** | `text-2xl font-semibold` | 24px | Page headers             |
| **Section**    | `text-xl font-semibold`  | 20px | Section headers          |
| **Card Title** | `text-lg font-medium`    | 18px | Card titles, subheadings |
| **Body**       | `text-base`              | 16px | Body text (default)      |
| **Caption**    | `text-sm`                | 14px | Labels, metadata         |
| **Tiny**       | `text-xs`                | 12px | Badges, timestamps       |

### Typography Rules

1. **Never use more than 3 font weights on a single screen**
2. **Headlines**: `font-semibold` or `font-bold`, `text-slate-900`
3. **Body text**: Regular weight, `text-slate-700`
4. **Emphasis within text**: `font-medium` (not bold)
5. **Line height**: Use Tailwind defaults (`leading-normal`, `leading-relaxed` for long text)
6. **Gold accents**: Use sparingly for special content labels

---

## Spacing System

### Base Unit: 4px (Tailwind default)

All spacing uses multiples of 4px via Tailwind's spacing scale.

### Standard Spacing Values

| Name       | Class           | Pixels | Usage                      |
| ---------- | --------------- | ------ | -------------------------- |
| **Micro**  | `gap-1` / `p-1` | 4px    | Icon-to-text, tight groups |
| **Small**  | `gap-2` / `p-2` | 8px    | Related elements           |
| **Medium** | `gap-4` / `p-4` | 16px   | Default element spacing    |
| **Large**  | `gap-6` / `p-6` | 24px   | Card padding, section gaps |
| **XLarge** | `gap-8` / `p-8` | 32px   | Page sections              |

### Page Layout Spacing

```
Page:      px-4 py-6 (mobile) → px-6 py-8 (desktop)
Sections:  space-y-6 or gap-6
Cards:     p-6 (content padding)
Nested:    p-4 (nested cards, inputs)
```

### Consistency Rules

1. **Vertical rhythm**: Use `space-y-*` for stacked content
2. **Grid gaps**: Use `gap-*` (not margin hacks)
3. **Card interiors**: Always `p-6` for main cards, `p-4` for nested
4. **No arbitrary values**: Stick to Tailwind scale (4, 8, 12, 16, 24, 32, 48)

---

## Layout & Containers

### Max Widths

| Container         | Class               | Usage               |
| ----------------- | ------------------- | ------------------- |
| **Full page**     | `max-w-6xl mx-auto` | Main content area   |
| **Forms/dialogs** | `max-w-2xl mx-auto` | Focused content     |
| **Narrow**        | `max-w-md mx-auto`  | Single-column forms |
| **Cards**         | No max-width        | Flex within parent  |

### Border Radius

| Size        | Class          | Usage                               |
| ----------- | -------------- | ----------------------------------- |
| **Large**   | `rounded-xl`   | Cards, dialogs (production uses xl) |
| **Medium**  | `rounded-lg`   | Buttons, larger elements            |
| **Default** | `rounded-md`   | Inputs, small cards                 |
| **Small**   | `rounded`      | Badges within cards                 |
| **Full**    | `rounded-full` | Pills, avatars, progress bars       |

---

## Mobile-First Responsive Design

### Breakpoints (Tailwind defaults)

| Breakpoint  | Prefix | Min Width | Typical Layout         |
| ----------- | ------ | --------- | ---------------------- |
| **Mobile**  | (none) | 0px       | Single column, stacked |
| **Tablet**  | `md:`  | 768px     | 2-column grids         |
| **Desktop** | `lg:`  | 1024px    | 3+ columns, sidebars   |
| **Wide**    | `xl:`  | 1280px    | Expanded layouts       |

### Mobile-First Rules

1. **Always start with mobile styles** (no prefix)
2. **Add complexity at larger breakpoints** (md:, lg:, xl:)
3. **Touch targets**: Minimum 44x44px on mobile
4. **Font sizes**: Don't shrink below `text-sm` on mobile
5. **Padding**: Don't reduce below `p-4` on mobile

### Responsive Patterns

```html
<!-- Grid: 1 col → 2 col → 3 col -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <!-- Stack → Horizontal -->
  <div class="flex flex-col md:flex-row gap-4">
    <!-- Full width → Constrained -->
    <div class="w-full md:w-auto md:min-w-[300px]">
      <!-- Hidden on mobile, visible on desktop -->
      <div class="hidden lg:block"></div>
    </div>
  </div>
</div>
```

---

## Component Patterns

### Buttons

**Primary Action (Slate):**

```html
<button
  class="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white font-medium rounded-lg shadow-xs transition-colors"
>
  Confirm
</button>
```

**Secondary Action (Gold Outline):**

```html
<button
  class="px-4 py-2 bg-white border-2 border-amber-400 text-amber-700 hover:bg-amber-50 font-medium rounded-lg transition-colors"
>
  Edit
</button>
```

**Ghost/Subtle:**

```html
<button
  class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
>
  Cancel
</button>
```

**Destructive:**

```html
<button
  class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
>
  Delete
</button>
```

**Button Sizes:**

- Default: `h-9 px-4 py-2`
- Small: `h-8 px-3 text-sm`
- Large: `h-10 px-6`
- Icon only: `size-9` (square)

### Cards

**Standard Card:**

```html
<div
  class="bg-white rounded-xl p-6 border border-slate-200 shadow-xs hover:shadow-md hover:border-slate-300 transition-all"
>
  <!-- content -->
</div>
```

**Highlighted Card (Selected/Active):**

```html
<div class="bg-white rounded-xl p-6 border-2 border-amber-400 shadow-md">
  <!-- emphasized content -->
</div>
```

**Nested/Subtle Card:**

```html
<div class="bg-slate-50 rounded-lg p-4 border border-slate-100">
  <!-- nested content -->
</div>
```

### Inputs

**Text Input:**

```html
<input
  type="text"
  class="w-full bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-slate-900
  focus:border-slate-500 focus:ring-2 focus:ring-slate-500/20 focus:outline-hidden
  placeholder:text-slate-400 transition-all"
/>
```

**Select:**

```html
<select class="w-full bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-slate-900">
  <option>Option</option>
</select>
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

## Special UI Patterns

### Read-Aloud Boxes (GM Narrative)

The signature element - subtle gold accent with premium feel:

```html
<div
  class="bg-linear-to-r from-amber-50 to-white border-l-4 border-amber-400 rounded-r-lg p-5 shadow-xs"
>
  <p class="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-3">
    Read-Aloud Narrative
  </p>
  <p class="text-slate-700 italic leading-relaxed text-lg">"Narrative text here..."</p>
</div>
```

### Context Sections

```html
<div class="border-l-4 border-slate-400 pl-4 py-2">
  <h4 class="font-semibold text-slate-900 mb-2">Context</h4>
  <ul class="text-slate-600 space-y-1.5 text-sm">
    <li><strong>Why:</strong> Explanation</li>
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
      <h4 class="font-bold text-red-900 text-lg">Creature Name</h4>
      <span class="text-red-600 text-sm">Minion</span>
    </div>
    <span class="px-2.5 py-1 bg-red-200 text-red-800 text-xs font-bold rounded uppercase"
      >MINION</span
    >
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

**Linear Progress:**

```html
<div class="bg-slate-200 h-2 rounded-full overflow-hidden">
  <div class="bg-amber-400 h-full transition-all" style="width: 60%"></div>
</div>
```

### Collapsible Sections (Progressive Disclosure)

```html
<details class="group border border-slate-200 rounded-lg overflow-hidden">
  <summary
    class="flex justify-between items-center p-4 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors"
  >
    <span class="font-medium text-slate-900">NPC Details (3)</span>
    <svg class="w-5 h-5 text-slate-500 transform group-open:rotate-180 transition-transform">
      <!-- Chevron down icon -->
    </svg>
  </summary>
  <div class="p-4 border-t border-slate-200">
    <!-- Collapsed content -->
  </div>
</details>
```

---

## Subtle Magic Effects

### Hover Glow Effect

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

### Particle Animation (Landing Page Only)

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

---

## Icons

Use emoji in mockup. Map to Lucide React during migration:

| Emoji | Lucide Icon   | Usage            |
| ----- | ------------- | ---------------- |
| ✅    | `Check`       | Confirm, success |
| ✏️    | `Pencil`      | Edit             |
| 🎲    | `Dices`       | Re-roll, random  |
| ✨    | `Sparkles`    | AI, magic        |
| ⚔️    | `Swords`      | Combat           |
| 🗺️    | `Map`         | Exploration      |
| 🎭    | `Theater`     | Social/RP        |
| 📖    | `BookOpen`    | Read-aloud       |
| 👥    | `Users`       | NPCs             |
| 🏘️    | `Home`        | Setting          |
| 📍    | `MapPin`      | Context          |
| ➡️    | `ArrowRight`  | Transition       |
| ↓     | `Download`    | Export           |
| ❌    | `X`           | Close, cancel    |
| ⚙️    | `Settings`    | Settings         |
| ▼     | `ChevronDown` | Expand/collapse  |

---

## Accessibility Requirements

### Focus States (MANDATORY)

All interactive elements must have visible focus:

```html
focus:outline-hidden focus:ring-2 focus:ring-slate-500 focus:ring-offset-2
```

Production uses `focus-visible:` for keyboard-only focus.

### Touch Targets

- **Minimum size**: 44x44px on touch devices
- **Button padding**: At least `py-2 px-4`
- **Icon buttons**: `size-9` minimum (36px)

### Color Contrast

All combinations meet WCAG AA:

- Slate-900 on white: 15.5:1
- Slate-700 on white: 8.6:1
- Slate-500 on white: 4.6:1
- Amber-700 on white: 4.8:1
- Amber-700 on amber-50: 5.2:1

### Semantic HTML

- Use `<button>` for actions (not `<div onclick>`)
- Use `<a>` for navigation
- Use proper heading hierarchy (`h1` → `h2` → `h3`)
- Use `<label>` for form inputs
- Use `<details>` for collapsible sections

### ARIA Labels

```html
<!-- Icon-only buttons -->
<button aria-label="Close dialog">✕</button>

<!-- Loading states -->
<button aria-busy="true" aria-label="Generating...">
  <span class="animate-spin">⏳</span>
</button>

<!-- Collapsible sections -->
<details>
  <summary aria-expanded="false">Section Title</summary>
</details>
```

---

## Animation Guidelines

### Transitions

All interactive elements should have smooth transitions:

```html
transition-colors
<!-- Color changes -->
transition-all
<!-- Multiple properties -->
duration-200
<!-- 200ms (default) -->
```

### Hover States

Subtle shifts for refinement:

```html
hover:bg-slate-100 hover:bg-slate-700 hover:border-slate-300 hover:shadow-md
```

### Loading States

Use `animate-pulse` for skeletons:

```html
<div class="bg-slate-200 animate-pulse h-4 rounded"></div>
```

Use `animate-spin` for spinners:

```html
<span class="animate-spin">⏳</span>
```

### Complex Animations

**Do NOT add in mockup** - Add Framer Motion during migration for:

- Page transitions
- List reordering
- Expandable sections
- Toast notifications

---

## Z-Index Scale

| Layer              | Value  | Usage               |
| ------------------ | ------ | ------------------- |
| **Base**           | `z-0`  | Default content     |
| **Dropdown**       | `z-10` | Dropdowns, tooltips |
| **Sticky**         | `z-20` | Sticky headers      |
| **Modal backdrop** | `z-40` | Dialog overlays     |
| **Modal**          | `z-50` | Dialog content      |
| **Toast**          | `z-50` | Notifications       |

---

## Migration Checklist

When converting mockup HTML to React components:

- [ ] Replace emoji icons with Lucide React
- [ ] Convert to shadcn/ui components where applicable
- [ ] Add `data-slot` attributes for testing
- [ ] Use CVA for variant management
- [ ] Apply `cn()` utility for class composition
- [ ] Add proper TypeScript types
- [ ] Implement focus states with `focus-visible:`
- [ ] Add loading/skeleton states
- [ ] Connect to real data via Server Actions
- [ ] Replace hardcoded colors with semantic tokens
- [ ] Add error states for all interactive elements
- [ ] Test keyboard navigation
- [ ] Verify touch targets on mobile
- [ ] Implement collapsible sections with Framer Motion

---

**Version**: 2024-12-11
**Design Direction**: Moonlit Steel (Light theme with slate/gold accents)
**Purpose**: Design constraints for mockup iteration
