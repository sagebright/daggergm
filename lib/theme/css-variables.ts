// CSS variable management for Daggerheart theme

export interface CSSVariableMap {
  [key: string]: string
}

// Extract CSS variables from computed styles
export function getCSSVariables(): CSSVariableMap {
  if (typeof window === 'undefined') {
    return {}
  }

  const computedStyle = window.getComputedStyle(document.documentElement)
  const variables: CSSVariableMap = {}

  // Daggerheart-specific variables
  const themeVariables = [
    'dagger-purple-900',
    'dagger-purple-800',
    'dagger-teal-400',
    'dagger-gold-400',
    'background',
    'foreground',
    'primary',
    'accent',
    'secondary',
    'muted',
    'card',
    'border',
    'input',
    'ring',
  ]

  themeVariables.forEach((variable) => {
    const value = computedStyle.getPropertyValue(`--${variable}`).trim()
    if (value) {
      variables[variable] = value
    }
  })

  return variables
}

// Apply CSS variables to document root
export function applyCSSVariables(variables: CSSVariableMap): void {
  if (typeof document === 'undefined') {
    return
  }

  const root = document.documentElement

  Object.entries(variables).forEach(([key, value]) => {
    root.style.setProperty(`--${key}`, value)
  })
}

// Initialize theme variables
export function initializeTheme(): void {
  if (typeof document === 'undefined') {
    return
  }

  // This will be populated by globals.css
  // But we ensure the structure is ready for dynamic updates
  const root = document.documentElement
  root.classList.add('daggerheart-theme')
}
