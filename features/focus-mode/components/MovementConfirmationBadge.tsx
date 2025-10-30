'use client'

import { CheckCircle, Circle, X } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface MovementConfirmationBadgeProps {
  confirmed: boolean
  onConfirm: () => void
  onUnconfirm: () => void
  disabled?: boolean
  isLoading?: boolean
}

/**
 * Badge component for per-scene confirmation workflow (Issue #9)
 *
 * Shows confirmation status and allows users to confirm/unconfirm individual scenes.
 * Confirmed scenes are locked for regeneration until explicitly unconfirmed.
 */
export function MovementConfirmationBadge({
  confirmed,
  onConfirm,
  onUnconfirm,
  disabled = false,
  isLoading = false,
}: MovementConfirmationBadgeProps) {
  if (confirmed) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="default" className="gap-2 bg-green-600 hover:bg-green-700 text-white">
              <CheckCircle className="h-3 w-3" />
              Confirmed
              {!disabled && !isLoading && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onUnconfirm()
                  }}
                  className="ml-1 hover:text-red-200 transition-colors"
                  aria-label="Unconfirm scene"
                  disabled={isLoading}
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-sm">
              {disabled
                ? 'Scene is confirmed and locked'
                : 'Click X to unconfirm and allow regeneration'}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onConfirm()
            }}
            disabled={disabled || isLoading}
            className="gap-2"
          >
            <Circle className="h-3 w-3" />
            {isLoading ? 'Confirming...' : 'Confirm Scene'}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-sm">Confirm this scene to lock it from regeneration</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
