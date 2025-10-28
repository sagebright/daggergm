'use client'

import { Coins } from 'lucide-react'

import { cn } from '@/lib/utils'

export interface CreditCostProps {
  action: string
  cost?: number
  className?: string
}

/**
 * Component to display the cost of an action in credits
 * Shows clear pricing information before user commits to action
 */
export function CreditCost({ action, cost = 1, className }: CreditCostProps) {
  // Handle free actions
  if (cost === 0) {
    return (
      <div className={cn('flex items-center gap-1 text-sm text-muted-foreground', className)}>
        <Coins className="h-3 w-3" />
        <span>Free</span>
      </div>
    )
  }

  return (
    <div className={cn('flex items-center gap-1 text-sm text-muted-foreground', className)}>
      <Coins className="h-3 w-3" />
      <span>
        {cost} credit{cost !== 1 ? 's' : ''}
      </span>
      <span>to {action}</span>
    </div>
  )
}
