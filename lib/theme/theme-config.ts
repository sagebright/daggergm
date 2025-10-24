// Daggerheart-inspired theme configuration
export interface ThemeColors {
  'dagger-purple-900': string
  'dagger-purple-800': string
  'dagger-teal-400': string
  'dagger-gold-400': string
  background: string
  foreground: string
  primary: string
  accent: string
  [key: string]: string
}

export interface ContrastResult {
  ratio: number
  passesAA: boolean
  passesAAA: boolean
}

// Get theme colors based on mode (light only for MVP)
export function getThemeColors(mode: 'light' | 'dark' = 'light'): ThemeColors {
  // Light mode colors (MVP - dark mode structure ready for future)
  // TODO: Implement dark mode support using the mode parameter
  if (mode === 'dark') {
    // Dark mode will be implemented in FEATURE_dark_mode
  }
  return {
    'dagger-purple-900': 'oklch(0.18 0.15 285)',
    'dagger-purple-800': 'oklch(0.24 0.12 285)',
    'dagger-teal-400': 'oklch(0.75 0.08 180)',
    'dagger-gold-400': 'oklch(0.82 0.12 85)',
    background: 'oklch(0.98 0.005 285)',
    foreground: 'oklch(0.15 0.12 285)',
    primary: 'var(--dagger-purple-800)',
    'primary-foreground': 'oklch(0.98 0.005 285)',
    secondary: 'oklch(0.95 0.005 285)',
    'secondary-foreground': 'oklch(0.15 0.12 285)',
    accent: 'var(--dagger-teal-400)',
    'accent-foreground': 'oklch(0.15 0.12 285)',
    muted: 'oklch(0.90 0.01 285)',
    'muted-foreground': 'oklch(0.45 0.06 285)',
    card: 'oklch(0.98 0.005 285)',
    'card-foreground': 'oklch(0.15 0.12 285)',
    border: 'oklch(0.85 0.01 285)',
    input: 'oklch(0.85 0.01 285)',
    ring: 'var(--dagger-purple-800)',
  }
}

// Get Tailwind theme configuration
export function getDaggerheartTheme() {
  return {
    colors: {
      'dagger-purple': {
        900: 'oklch(var(--dagger-purple-900))',
        800: 'oklch(var(--dagger-purple-800))',
      },
      'dagger-teal': {
        400: 'oklch(var(--dagger-teal-400))',
      },
      'dagger-gold': {
        400: 'oklch(var(--dagger-gold-400))',
      },
    },
    fontFamily: {
      sans: [
        'system-ui',
        '-apple-system',
        'BlinkMacSystemFont',
        '"Segoe UI"',
        'Roboto',
        'Inter',
        '"Helvetica Neue"',
        'Arial',
        'sans-serif',
      ],
    },
    fontSize: {
      display: ['24px', { lineHeight: '32px', fontWeight: '600' }],
      medium: ['18px', { lineHeight: '28px', fontWeight: '500' }],
      small: ['16px', { lineHeight: '24px', fontWeight: '400' }],
      caption: ['14px', { lineHeight: '20px', fontWeight: '400' }],
    },
  }
}

// Convert OKLCH to RGB for contrast calculation
function oklchToRgb(oklch: string): [number, number, number] {
  // Parse OKLCH values
  const match = oklch.match(/oklch\(([\d.]+)\s+([\d.]+)\s+([\d.]+)\)/)
  if (!match) {
    return [0, 0, 0]
  }

  const [, l, c, h] = match.map(Number)

  // Simplified OKLCH to RGB conversion
  // Note: This is a simplified version for testing
  // Production would use a proper color library
  const L = l
  const a = c * Math.cos((h * Math.PI) / 180)
  const b = c * Math.sin((h * Math.PI) / 180)

  // OKLab to linear RGB
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b
  const s_ = L - 0.0894841775 * a - 1.291485548 * b

  const l3 = l_ * l_ * l_
  const m3 = m_ * m_ * m_
  const s3 = s_ * s_ * s_

  let r = 4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3
  let g = -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3
  let b_ = -0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * s3

  // Clamp and convert to 0-255
  r = Math.max(0, Math.min(1, r)) * 255
  g = Math.max(0, Math.min(1, g)) * 255
  b_ = Math.max(0, Math.min(1, b_)) * 255

  return [Math.round(r), Math.round(g), Math.round(b_)]
}

// Calculate relative luminance
function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    c = c / 255
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
}

// Validate WCAG color contrast
export function validateColorContrast(foreground: string, background: string): ContrastResult {
  const [fr, fg, fb] = oklchToRgb(foreground)
  const [br, bg, bb] = oklchToRgb(background)

  const lum1 = getLuminance(fr, fg, fb)
  const lum2 = getLuminance(br, bg, bb)

  const lighter = Math.max(lum1, lum2)
  const darker = Math.min(lum1, lum2)

  const ratio = (lighter + 0.05) / (darker + 0.05)

  return {
    ratio: Math.round(ratio * 100) / 100,
    passesAA: ratio >= 4.5,
    passesAAA: ratio >= 7,
  }
}
