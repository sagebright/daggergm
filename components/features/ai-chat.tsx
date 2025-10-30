'use client'

import { Loader2, Sparkles, FileText, Swords, Users } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { expandMovement, refineMovementContent } from '@/app/actions/movements'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { RegenerationConfirmDialog } from '@/features/focus-mode/components/RegenerationConfirmDialog'
import { getQuickPrompts } from '@/lib/llm/quick-prompts'

import type { Movement } from './focus-mode'

interface AIChatProps {
  movement: Movement
  adventureId: string
  adventureState: 'draft' | 'ready' | 'archived'
  expansionRegenerationsUsed?: number
  onSuggestionApply: (_suggestion: string) => void
  onRefreshAdventure?: (() => void) | undefined
}

export function AIChat({
  movement,
  adventureId,
  adventureState,
  expansionRegenerationsUsed = 0,
  onSuggestionApply,
  onRefreshAdventure,
}: AIChatProps) {
  const [loading, setLoading] = useState(false)
  const [instruction, setInstruction] = useState('')
  const [_suggestions, setSuggestions] = useState<string[]>([])
  const [showExpandConfirm, setShowExpandConfirm] = useState(false)
  const [showRefineConfirm, setShowRefineConfirm] = useState(false)

  const remainingExpansionRegens = 20 - expansionRegenerationsUsed

  const handleExpandClick = () => {
    // Check if user has disabled confirmation
    const skipConfirm = localStorage.getItem('skip_regen_confirm_expansion') === 'true'

    if (skipConfirm || remainingExpansionRegens === 0) {
      void performExpand()
    } else {
      setShowExpandConfirm(true)
    }
  }

  const performExpand = async () => {
    setLoading(true)
    try {
      const result = await expandMovement(adventureId, movement.id)

      if (result.success && result.content) {
        onSuggestionApply(result.content)
        toast.success('Movement expanded successfully!')

        // Add GM notes if available
        if (result.gmNotes) {
          setSuggestions((prev) => [...prev, `GM Notes: ${result.gmNotes}`])
        }

        // Refresh adventure data to update regeneration counts
        onRefreshAdventure?.()
      } else {
        toast.error(result.error || 'Failed to expand movement')
      }
    } catch {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleRefineClick = () => {
    if (!instruction.trim()) {
      toast.error('Please provide refinement instructions')
      return
    }

    // Check if user has disabled confirmation
    const skipConfirm = localStorage.getItem('skip_regen_confirm_expansion') === 'true'

    if (skipConfirm || remainingExpansionRegens === 0) {
      void performRefine()
    } else {
      setShowRefineConfirm(true)
    }
  }

  const performRefine = async () => {
    setLoading(true)
    try {
      const result = await refineMovementContent(adventureId, movement.id, instruction)

      if (result.success && result.content) {
        onSuggestionApply(result.content)
        toast.success('Content refined!')
        setInstruction('')

        // Refresh adventure data to update regeneration counts
        onRefreshAdventure?.()
      } else {
        toast.error(result.error || 'Failed to refine content')
      }
    } catch {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const getMovementIcon = () => {
    switch (movement.type) {
      case 'combat':
        return <Swords className="h-4 w-4" />
      case 'social':
        return <Users className="h-4 w-4" />
      case 'exploration':
        return <FileText className="h-4 w-4" />
      default:
        return <Sparkles className="h-4 w-4" />
    }
  }

  // Determine phase based on adventure state
  const phase = adventureState === 'draft' ? 'scaffold' : 'expansion'

  // Get context-aware quick prompts based on phase and movement type
  const quickPrompts = getQuickPrompts(
    phase,
    movement.type as 'combat' | 'social' | 'exploration' | 'puzzle',
  )

  return (
    <div className="p-4 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        {getMovementIcon()}
        <h3 className="text-lg font-semibold">AI Assistant</h3>
      </div>

      <Card className="p-4 mb-4">
        <h4 className="font-medium mb-2">{movement.title}</h4>
        <p className="text-sm text-muted-foreground">
          {movement.type} • {movement.estimatedTime}
        </p>
      </Card>

      <div className="flex-1 space-y-4 overflow-y-auto">
        {!movement.content || movement.content.length < 50 ? (
          <div className="text-center py-8">
            <Sparkles className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-4">
              This movement needs content. Let AI help you expand it!
            </p>
            <Button
              onClick={handleExpandClick}
              disabled={loading || remainingExpansionRegens === 0}
              className="w-full"
              title={
                remainingExpansionRegens === 0
                  ? 'No expansion regenerations remaining for this adventure'
                  : undefined
              }
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              Generate Full Content
            </Button>
          </div>
        ) : (
          <>
            <div>
              <label className="text-sm font-medium mb-2 block">Refinement Instructions</label>
              <Textarea
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                placeholder="Describe how you'd like to improve this movement..."
                className="min-h-[100px]"
              />
            </div>

            <div>
              <p className="text-xs text-muted-foreground mb-2">Quick prompts:</p>
              <div className="flex flex-wrap gap-2">
                {quickPrompts.map((prompt) => (
                  <Button
                    key={prompt}
                    variant="outline"
                    size="sm"
                    onClick={() => setInstruction(prompt)}
                  >
                    {prompt}
                  </Button>
                ))}
              </div>
            </div>

            <Button
              onClick={handleRefineClick}
              disabled={loading || remainingExpansionRegens === 0}
              className="w-full"
              title={
                remainingExpansionRegens === 0
                  ? 'No expansion regenerations remaining for this adventure'
                  : undefined
              }
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              Refine Content
            </Button>
          </>
        )}

        {_suggestions.length > 0 && (
          <div className="border-t pt-4">
            <h5 className="text-sm font-medium mb-2">Suggestions</h5>
            <div className="space-y-2">
              {_suggestions.map((suggestion, index) => (
                <Card key={index} className="p-3 text-sm">
                  {suggestion}
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Expand Confirmation Dialog */}
      <RegenerationConfirmDialog
        open={showExpandConfirm}
        onOpenChange={setShowExpandConfirm}
        onConfirm={() => void performExpand()}
        type="expansion"
        scope="Full scene (6 components)"
        remainingRegens={remainingExpansionRegens - 1}
        estimatedTime="~10-15 seconds"
      />

      {/* Refine Confirmation Dialog */}
      <RegenerationConfirmDialog
        open={showRefineConfirm}
        onOpenChange={setShowRefineConfirm}
        onConfirm={() => void performRefine()}
        type="expansion"
        scope="Content refinement"
        remainingRegens={remainingExpansionRegens - 1}
        estimatedTime="~5-10 seconds"
      />
    </div>
  )
}
