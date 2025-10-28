'use client'

import { Info } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface RegenerationBudgetProps {
  scaffoldUsed: number
  scaffoldLimit: number
  expansionUsed: number
  expansionLimit: number
  className?: string
}

export function RegenerationBudget({
  scaffoldUsed,
  scaffoldLimit,
  expansionUsed,
  expansionLimit,
  className,
}: RegenerationBudgetProps) {
  const scaffoldRemaining = scaffoldLimit - scaffoldUsed
  const expansionRemaining = expansionLimit - expansionUsed

  const scaffoldPercentage = (scaffoldUsed / scaffoldLimit) * 100
  const expansionPercentage = (expansionUsed / expansionLimit) * 100

  const getStatusColor = (remaining: number): 'default' | 'warning' | 'destructive' => {
    if (remaining === 0) {
      return 'destructive'
    }
    if (remaining <= 2) {
      return 'warning'
    }
    return 'default'
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium">Regeneration Budget</h3>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Info className="h-4 w-4 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="text-sm">
                Regenerations are <strong>FREE</strong> (no credits consumed). Each adventure has{' '}
                {scaffoldLimit} scaffold regenerations and {expansionLimit} expansion regenerations.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Scaffold Budget */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-muted-foreground">Scaffold Regenerations</span>
          <Badge variant={getStatusColor(scaffoldRemaining)}>
            {scaffoldRemaining}/{scaffoldLimit} remaining
          </Badge>
        </div>
        <Progress value={scaffoldPercentage} className="h-2" />
      </div>

      {/* Expansion Budget */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-muted-foreground">Expansion Regenerations</span>
          <Badge variant={getStatusColor(expansionRemaining)}>
            {expansionRemaining}/{expansionLimit} remaining
          </Badge>
        </div>
        <Progress value={expansionPercentage} className="h-2" />
      </div>
    </div>
  )
}
