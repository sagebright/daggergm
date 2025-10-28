'use client'

import { Coins } from 'lucide-react'
import { useState } from 'react'

import { CreditPurchaseDialog } from '@/components/features/credit-purchase-dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

import { useCreditBalance } from './useCreditBalance'

export interface CreditBalanceProps {
  variant?: 'default' | 'compact' | 'detailed'
  showPurchaseButton?: boolean
  animate?: boolean
  className?: string
}

/**
 * Component to display user's credit balance
 * Supports multiple display variants and optional purchase flow
 */
export function CreditBalance({
  variant = 'default',
  showPurchaseButton = true,
  animate = true,
  className,
}: CreditBalanceProps) {
  const { balance, isLoading, error } = useCreditBalance()
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false)

  // Handle loading state
  if (isLoading) {
    return (
      <div className={cn('flex items-center gap-2', className)} aria-label="Loading credits">
        <Coins className="h-4 w-4 text-dagger-gold-400 animate-pulse" />
        <span className="font-medium">...</span>
      </div>
    )
  }

  // Handle error state
  if (error) {
    return (
      <div className={cn('flex items-center gap-2', className)} aria-label="Credit balance error">
        <Coins className="h-4 w-4 text-destructive" />
        <span className="text-sm text-destructive">Failed to load credits</span>
      </div>
    )
  }

  // Determine if balance is low
  const isLowBalance = balance < 5

  // Detailed variant
  if (variant === 'detailed') {
    return (
      <div
        className={cn('flex flex-col gap-1', className)}
        aria-label={`${balance} credits available`}
      >
        <div className="flex items-center gap-2">
          <Coins className="h-5 w-5 text-dagger-gold-400" />
          <span className={cn('text-2xl font-bold', animate && 'transition-all duration-300')}>
            {balance}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          {balance === 0
            ? 'No credits remaining'
            : `${balance} credit${balance !== 1 ? 's' : ''} available`}
        </p>
        {showPurchaseButton && isLowBalance ? (
          <Button size="sm" onClick={() => setShowPurchaseDialog(true)} className="mt-2">
            Add Credits
          </Button>
        ) : null}
        {showPurchaseButton ? (
          <CreditPurchaseDialog
            open={showPurchaseDialog}
            onSuccess={() => setShowPurchaseDialog(false)}
            onCancel={() => setShowPurchaseDialog(false)}
          />
        ) : null}
      </div>
    )
  }

  // Compact variant
  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center gap-1.5', className)} aria-label={`${balance} credits`}>
        <Coins className="h-3.5 w-3.5 text-dagger-gold-400" />
        <span className={cn('text-sm font-medium', animate && 'transition-all duration-300')}>
          {balance}
        </span>
      </div>
    )
  }

  // Default variant
  return (
    <div
      className={cn('flex items-center gap-2', className)}
      aria-label={`${balance} credits available`}
    >
      <Coins className="h-4 w-4 text-dagger-gold-400" />
      <span className={cn('font-medium', animate && 'transition-all duration-300')}>{balance}</span>
      {showPurchaseButton && isLowBalance ? (
        <Button size="sm" variant="ghost" onClick={() => setShowPurchaseDialog(true)}>
          Add Credits
        </Button>
      ) : null}
      {showPurchaseButton ? (
        <CreditPurchaseDialog
          open={showPurchaseDialog}
          onSuccess={() => setShowPurchaseDialog(false)}
          onCancel={() => setShowPurchaseDialog(false)}
        />
      ) : null}
    </div>
  )
}
