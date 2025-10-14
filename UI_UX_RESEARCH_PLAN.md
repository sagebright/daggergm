# DaggerGM UI/UX Research Plan

## Phase 1: Visual Identity Research

- Analyze Daggerheart official branding (color palette, typography, iconography)
- Study Critical Role visual design language and how it differs from D&D
- Research Demiplane.com's successful "powerful + community-aware" aesthetic
- Identify visual patterns that signal "TTRPG expertise" vs generic tools

## Phase 2: Technical Foundation Analysis

- Audit current shadcn/ui components and Tailwind setup
- Research accessibility-first design systems (for 508 compliance)
- Evaluate component patterns for prep-work focused workflows
- Investigate performance-optimized styling approaches

## Phase 3: User Experience Patterns

- Study prep-tool interfaces (campaign managers, world builders)
- Analyze Focus Mode UI patterns in creative software
- Research frame-aware content organization methods
- Examine credit-based tool interfaces for transparency

## Phase 4: Design System Planning

- Define color palette and typography hierarchy
- Plan component theming strategy
- Outline accessibility testing approach
- Create implementation roadmap with priority levels

## Questions for User:

1. **Color psychology** - Should we lean into darker themes (like many TTRPG tools) or lighter/more accessible palettes?
2. **Content density** - Do you prefer information-dense interfaces or more spacious layouts for prep work?
3. **Visual hierarchy** - How important is it that the AI-generated content feels distinct from user input areas?

## Research Findings

### Phase 1: Visual Identity Research Results

**Daggerheart Branding Analysis:**

- **Color Palette**: Deep purples (#18094d, #24135f), soft teal (#83CDC2), golden yellow (#E7C74B)
- **Typography**: "ivymode" (bold sans-serif), "Questa Sans" (clean secondary)
- **Aesthetic**: Modern fantasy, sophisticated, ethereal - moves away from traditional RPG tropes
- **Key Differentiator**: Contemporary digital-age storytelling vs medieval fantasy styling

**Demiplane Success Patterns:**

- Dark background (#101014) with vibrant electric blue (#00ABFF) accents
- Barlow/Roboto fonts for clarity + modern readability
- Responsive flexbox layouts, consistent spacing
- Professional yet engaging TTRPG-tailored atmosphere

**Roll20 Anti-patterns to Avoid:**

- Cluttered navigation with excessive nested dropdowns
- Inconsistent visual styling mixing modern/legacy elements
- Complex JavaScript for basic interactions
- Overwhelming option density

### Phase 2: Technical Foundation Analysis Results

**Current Setup:**

- **Framework**: Next.js 14 + Tailwind CSS + shadcn/ui components
- **Color System**: OKLCH color space with CSS custom properties
- **Dark Mode**: next-themes integration ready (not implemented)
- **Components**: Standard shadcn/ui library (button, card, dialog, form, input, label, skeleton, sonner, badge, textarea)

**Accessibility Foundation:**

- **508 Compliance Requirements**: 4.5:1 contrast ratio (normal text), 3:1 (large text 18px+)
- **Current State**: Basic shadcn/ui accessibility built-in
- **OKLCH Benefits**: Better perceptual uniformity for accessible color generation

**Performance Considerations:**

- Lightweight framework choices align with "tool not website" requirement
- Framer Motion available for micro-interactions
- Bundle optimization needed for tool-focused UX

### Phase 3: User Experience Patterns Results

**Focus Mode Design Patterns:**

- **Core Principle**: Distraction reduction while maintaining clarity
- **Implementation**: Hide sidebars, fade non-active content, provide clear exit paths
- **User Control**: Always ensure escape routes ("back", "save and exit", "cancel")
- **Performance**: Load only active content in memory

**TTRPG Campaign Manager Patterns:**

- **Speed Priority**: Lightning-fast loading (like Obsidian's local files approach)
- **Relationship Management**: Metadata-driven connections between campaign elements
- **Flexibility**: System-agnostic, user-controlled organization
- **Clean Interface**: Modern, uncluttered design signaling expertise

**Credit-Based UI Patterns:**

- **Transparency**: Clear credit costs upfront, visible balance
- **Trust Building**: Security indicators, PCI compliance messaging
- **Ethical Design**: Avoid dark patterns, provide clear subscription management
- **Payment UX**: Radio buttons over dropdowns, auto-formatting, progressive disclosure

**Frame-Aware Context Switching:**

- **Dynamic Adaptation**: Interface adjusts to current frame context
- **Pattern Recognition**: Predictive modeling based on user behavior
- **Seamless Transitions**: Real-time responsiveness without interrupting flow
- **Desktop Patterns**: Tab-based context switching for different frames

### Phase 4: Design System Planning Results

**Recommended Color Palette (Daggerheart-Inspired):**

```css
:root {
  /* Daggerheart-inspired palette */
  --dagger-purple-900: oklch(0.18 0.15 285); /* #18094d */
  --dagger-purple-800: oklch(0.24 0.12 285); /* #24135f */
  --dagger-teal-400: oklch(0.75 0.08 180); /* #83CDC2 */
  --dagger-gold-400: oklch(0.82 0.12 85); /* #E7C74B */

  /* Accessible variations */
  --background: oklch(0.98 0.005 285); /* Light with purple tint */
  --foreground: oklch(0.15 0.12 285); /* Dark purple text */
  --primary: var(--dagger-purple-800);
  --primary-foreground: oklch(0.98 0.005 285);
  --accent: var(--dagger-teal-400);
  --accent-foreground: oklch(0.15 0.12 285);
}

.dark {
  --background: oklch(0.15 0.08 285); /* Dark purple background */
  --foreground: oklch(0.95 0.005 285); /* Light text */
  --primary: var(--dagger-teal-400);
  --primary-foreground: oklch(0.15 0.12 285);
}
```

**Typography Hierarchy:**

- **Primary**: System fonts with fallback to Roboto/Inter for reliability
- **Display**: Consider custom font loading for headers (inspired by Daggerheart's "ivymode")
- **Sizes**: Large (24px+), Medium (18px), Small (16px), Caption (14px)
- **Weights**: Bold (600), Medium (500), Regular (400)

**Component Theming Strategy:**

- **Phase 1**: Implement Daggerheart color palette with dark mode
- **Phase 2**: Add custom focus mode components
- **Phase 3**: Frame-aware context switching UI
- **Phase 4**: Credit system UI components

**Implementation Roadmap:**

**Priority 1 (MVP Styling):**

- [ ] Implement Daggerheart-inspired color palette
- [ ] Add dark mode toggle component
- [ ] Style existing shadcn/ui components
- [ ] Basic focus mode (collapse/expand movements)

**Priority 2 (Enhanced UX):**

- [ ] Custom credit balance display component
- [ ] Frame context indicator UI
- [ ] Loading states and micro-interactions
- [ ] Mobile-responsive focus mode

**Priority 3 (Polish):**

- [ ] Custom typography loading
- [ ] Advanced animations
- [ ] Accessibility audit and improvements
- [ ] Performance optimization

## Final Recommendations

### Aesthetic Direction

Adopt a **"Modern Fantasy Toolkit"** aesthetic that:

- Uses Daggerheart's sophisticated purple/teal/gold palette
- Feels like a powerful professional tool (like Demiplane)
- Maintains TTRPG community authenticity
- Avoids dated gaming UI tropes (unlike Roll20)

### Technical Approach

- Start with shadcn/ui + Daggerheart colors + dark mode
- Implement focus mode as collapsible UI pattern
- Use OKLCH color space for accessibility compliance
- Prioritize performance and 508 compliance

### User Experience Priorities

1. **Speed** - Tool should feel instant like Obsidian
2. **Clarity** - Frame context always visible
3. **Focus** - Distraction-free editing mode
4. **Trust** - Transparent credit system

### Next Steps

1. Implement Priority 1 styling changes
2. Test accessibility compliance
3. User test focus mode patterns
4. Iterate based on community feedback
