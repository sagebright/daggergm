'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { useState, useCallback } from 'react'
import { toast } from 'sonner'

import { AIChat } from '@/components/features/ai-chat'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { MovementConfirmationBadge } from '@/features/focus-mode/components/MovementConfirmationBadge'
import { RegenerationBudget } from '@/features/focus-mode/components/RegenerationBudget'
// import { MarkdownEditor } from '@/components/features/markdown-editor' // TODO: Implement when ready
import { useDebounce } from '@/lib/hooks/use-debounce'
import { useHotkeys } from '@/lib/hooks/use-hotkeys'
import { cn } from '@/lib/utils'

export interface Movement {
  id: string
  title: string
  type: string
  content: string
  estimatedTime: string
  confirmed?: boolean
  confirmTimestamp?: string
}

interface FocusModeProps {
  movements: Movement[]
  adventureId: string
  adventureState: 'draft' | 'finalized' | 'exported'
  scaffoldRegenerationsUsed?: number
  expansionRegenerationsUsed?: number
  onUpdate: (_movementId: string, _updates: Partial<Movement>) => void
  onExit: () => void
  onRefreshAdventure?: () => void
}

export function FocusMode({
  movements,
  adventureId,
  adventureState,
  scaffoldRegenerationsUsed = 0,
  expansionRegenerationsUsed = 0,
  onUpdate,
  onExit,
  onRefreshAdventure,
}: FocusModeProps) {
  const [focusedId, setFocusedId] = useState<string | null>(null)
  const [isPanelOpen, setIsPanelOpen] = useState(true)
  const [confirmingMovementId, setConfirmingMovementId] = useState<string | null>(null)

  // Keyboard shortcuts
  useHotkeys('escape', () => {
    if (focusedId) {
      setFocusedId(null)
    } else {
      onExit()
    }
  })

  useHotkeys('cmd+k', () => setIsPanelOpen(!isPanelOpen))

  // Store local content state for immediate updates
  const [localContent, setLocalContent] = useState<Record<string, string>>(
    movements.reduce((acc, m) => ({ ...acc, [m.id]: m.content }), {}),
  )

  // Debounced update handler
  const debouncedUpdate = useDebounce((movementId: string, content: string) => {
    onUpdate(movementId, { content })
  }, 500)

  const handleContentChange = useCallback(
    (movementId: string, content: string) => {
      setLocalContent((prev) => ({ ...prev, [movementId]: content }))
      debouncedUpdate(movementId, content)
    },
    [debouncedUpdate],
  )

  // Confirmation handlers (Issue #9)
  const handleConfirm = useCallback(
    async (movementId: string) => {
      setConfirmingMovementId(movementId)

      try {
        const { confirmMovement } = await import('@/app/actions/movements')
        const result = await confirmMovement(adventureId, movementId)

        if (result.success) {
          toast.success(
            result.allConfirmed
              ? `All ${result.totalCount} scenes confirmed! You can now mark as ready.`
              : `Scene confirmed! ${result.confirmedCount}/${result.totalCount} scenes confirmed`,
          )

          onRefreshAdventure?.()
        } else {
          toast.error(result.error || 'Failed to confirm scene')
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to confirm scene')
      } finally {
        setConfirmingMovementId(null)
      }
    },
    [adventureId, onRefreshAdventure],
  )

  const handleUnconfirm = useCallback(
    async (movementId: string) => {
      setConfirmingMovementId(movementId)

      try {
        const { unconfirmMovement } = await import('@/app/actions/movements')
        const result = await unconfirmMovement(adventureId, movementId)

        if (result.success) {
          toast.success('Scene unconfirmed - you can now regenerate it')

          onRefreshAdventure?.()
        } else {
          toast.error(result.error || 'Failed to unconfirm scene')
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to unconfirm scene')
      } finally {
        setConfirmingMovementId(null)
      }
    },
    [adventureId, onRefreshAdventure],
  )

  const focusedMovement = movements.find((m) => m.id === focusedId)

  return (
    <div
      className="relative h-screen overflow-hidden bg-background"
      data-testid="focus-mode-container"
    >
      {/* Movement List */}
      <div
        className={cn(
          'h-full overflow-y-auto p-4 pb-20 transition-all duration-300',
          isPanelOpen && focusedId ? 'pr-100' : 'pr-4',
        )}
      >
        <AnimatePresence>
          {movements.map((movement) => (
            <motion.div
              key={movement.id}
              layout
              data-testid={`movement-card-${movement.id}`}
              initial={{ opacity: 0 }}
              animate={{
                opacity: focusedId === null || focusedId === movement.id ? 1 : 0.3,
                scale: focusedId === movement.id ? 1 : 0.98,
              }}
              exit={{ opacity: 0 }}
              style={{
                opacity: focusedId === null || focusedId === movement.id ? 1 : 0.3,
              }}
              className={cn(
                'mb-4 cursor-pointer transition-all',
                focusedId === movement.id && 'ring-2 ring-primary',
              )}
              onClick={() => {
                // console.log('Movement clicked:', movement.id, 'Current focused:', focusedId)
                setFocusedId(focusedId === movement.id ? null : movement.id)
              }}
            >
              <Card className="p-6">
                {focusedId !== movement.id ? (
                  // Collapsed view
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">{movement.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {movement.type} • {movement.estimatedTime}
                      </p>
                    </div>
                    {adventureState === 'draft' && (
                      <MovementConfirmationBadge
                        confirmed={movement.confirmed ?? false}
                        onConfirm={() => handleConfirm(movement.id)}
                        onUnconfirm={() => handleUnconfirm(movement.id)}
                        disabled={confirmingMovementId === movement.id}
                        isLoading={confirmingMovementId === movement.id}
                      />
                    )}
                  </div>
                ) : (
                  // Expanded view
                  <div onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">{movement.title}</h3>
                      {adventureState === 'draft' && (
                        <MovementConfirmationBadge
                          confirmed={movement.confirmed ?? false}
                          onConfirm={() => handleConfirm(movement.id)}
                          onUnconfirm={() => handleUnconfirm(movement.id)}
                          disabled={confirmingMovementId === movement.id}
                          isLoading={confirmingMovementId === movement.id}
                        />
                      )}
                    </div>
                    <textarea
                      className="w-full min-h-[200px] p-4 border rounded-md resize-none"
                      value={localContent[movement.id] || movement.content}
                      onChange={(e) => handleContentChange(movement.id, e.target.value)}
                      placeholder="Start writing your movement..."
                      aria-label="Movement content editor"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                )}
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* AI Assistant Panel */}
      <AnimatePresence>
        {isPanelOpen && focusedId && focusedMovement ? (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            className="fixed right-0 top-0 h-full w-96 bg-card border-l"
            data-testid="ai-chat-panel"
          >
            <AIChat
              movement={focusedMovement}
              adventureId={adventureId}
              adventureState={adventureState}
              expansionRegenerationsUsed={expansionRegenerationsUsed}
              onSuggestionApply={(suggestion) => {
                setLocalContent((prev) => ({ ...prev, [focusedId]: suggestion }))
                onUpdate(focusedId, {
                  content: suggestion,
                })
              }}
              onRefreshAdventure={onRefreshAdventure}
            />
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Exit Button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 bg-background border"
        onClick={onExit}
        aria-label="Exit focus mode"
      >
        <X className="h-4 w-4" />
      </Button>

      {/* Regeneration Budget Display */}
      <div className="fixed top-4 left-16 z-50 bg-card border rounded-lg p-3 shadow-xs max-w-sm">
        <RegenerationBudget
          scaffoldUsed={scaffoldRegenerationsUsed}
          scaffoldLimit={10}
          expansionUsed={expansionRegenerationsUsed}
          expansionLimit={20}
        />
      </div>
    </div>
  )
}
