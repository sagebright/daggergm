import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Convert party tier selection to corresponding level number
 * Used for adventure generation difficulty calculations
 *
 * @param tier - Tier identifier (tier1, tier2, tier3, tier4)
 * @returns Mid-range level for the tier
 *
 * Tier ranges:
 * - Tier 1: Level 1
 * - Tier 2: Levels 2-4 (returns 3)
 * - Tier 3: Levels 5-7 (returns 6)
 * - Tier 4: Levels 8-10 (returns 9)
 */
export function getTierLevel(tier: string): number {
  switch (tier) {
    case 'tier1':
      return 1
    case 'tier2':
      return 3 // Mid-range of 2-4
    case 'tier3':
      return 6 // Mid-range of 5-7
    case 'tier4':
      return 9 // Mid-range of 8-10
    default:
      return 1 // Default to Tier 1
  }
}
// Trigger CI
