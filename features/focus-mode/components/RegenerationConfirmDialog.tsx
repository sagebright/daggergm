'use client'

import { useState } from 'react'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

interface RegenerationConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  type: 'scaffold' | 'expansion'
  scope: string // e.g., "Full Scene (6 components)" or "Combat mechanics only"
  remainingRegens: number
  estimatedTime: string // e.g., "~10-15 seconds"
}

export function RegenerationConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  type,
  scope,
  remainingRegens,
  estimatedTime,
}: RegenerationConfirmDialogProps) {
  const [dontAskAgain, setDontAskAgain] = useState(false)

  const handleConfirm = () => {
    if (dontAskAgain) {
      localStorage.setItem(`skip_regen_confirm_${type}`, 'true')
    }
    onConfirm()
    onOpenChange(false)
  }

  const typeLabel = type === 'scaffold' ? 'Scaffold' : 'Expansion'

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm Regeneration</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <div>
                <strong>What will be regenerated:</strong>
                <p className="text-sm mt-1">{scope}</p>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant="outline">FREE - No credits consumed</Badge>
                <Badge variant="secondary">Est. time: {estimatedTime}</Badge>
              </div>

              <div>
                <strong>Remaining {typeLabel} Regenerations:</strong>
                <p className="text-sm mt-1">
                  {remainingRegens} regeneration
                  {remainingRegens !== 1 ? 's' : ''} remaining after this action
                </p>
                {remainingRegens <= 2 && (
                  <p className="text-sm text-amber-600 mt-1">
                    ⚠️ Warning: Running low on regenerations for this adventure
                  </p>
                )}
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <Checkbox
                  id="dont-ask"
                  checked={dontAskAgain}
                  onCheckedChange={(checked) => setDontAskAgain(checked === true)}
                />
                <Label htmlFor="dont-ask" className="text-sm font-normal cursor-pointer">
                  Don&apos;t ask again for {typeLabel.toLowerCase()} regenerations
                </Label>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm}>Confirm Regeneration</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
