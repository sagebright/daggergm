'use client'

import { Download } from 'lucide-react'
import { notFound } from 'next/navigation'
import { useState, useEffect } from 'react'

import { getAdventure } from '@/app/actions/adventures'
import { ExportDialog } from '@/components/features/export-dialog'
import { FocusMode } from '@/components/features/focus-mode'
import type { Movement } from '@/components/features/focus-mode'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface Adventure {
  id: string
  title: string
  description?: string
  frame: string
  focus: string
  state: string
  movements?: Array<{
    id?: string
    title: string
    type: string
    content?: string
    description?: string
    estimatedTime?: string
  }>
}

export default function AdventureDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [adventure, setAdventure] = useState<Adventure | null>(null)
  const [loading, setLoading] = useState(true)
  const [focusMode, setFocusMode] = useState(false)
  const [exportDialogOpen, setExportDialogOpen] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    async function loadAdventure() {
      const { id } = await params

      // Check for guest token in localStorage
      const guestToken = localStorage.getItem(`guest_token_${id}`)

      const data = await getAdventure(id, guestToken || undefined)

      if (!data) {
        notFound()
      }

      console.log('Adventure loaded:', data)
      setAdventure(data as unknown as Adventure)
      setLoading(false)
    }

    void loadAdventure()
  }, [params])

  if (loading) {
    return <div className="container max-w-4xl mx-auto py-8">Loading...</div>
  }

  if (!adventure) {
    return null
  }

  const handleMovementUpdate = async (movementId: string, updates: Partial<Movement>) => {
    // Update local state immediately for responsiveness
    setAdventure((prev) => {
      if (!prev) {
        return prev
      }
      return {
        ...prev,
        movements: (prev.movements || []).map((m) =>
          (m.id || String(prev.movements?.indexOf(m))) === movementId ? { ...m, ...updates } : m,
        ),
      }
    })

    // Save to database
    const { updateMovement } = await import('@/app/actions/movements')

    // Get guest token if needed
    const guestToken = localStorage.getItem(`guest_token_${adventure.id}`)

    const result = await updateMovement(
      adventure.id,
      movementId,
      updates as Partial<Movement>,
      guestToken || undefined,
    )

    if (!result.success) {
      console.error('Failed to update movement:', result.error)
      // TODO: Show error toast and revert changes
    }
  }

  if (focusMode && adventure.movements) {
    console.log('Entering focus mode with movements:', adventure.movements)
    const formattedMovements = adventure.movements.map((m, index) => ({
      id: m.id || String(index),
      title: m.title,
      type: m.type,
      content: m.content || m.description || '', // Use description if content is missing
      estimatedTime: m.estimatedTime || '30 minutes',
    }))
    console.log('Formatted movements:', formattedMovements)

    return (
      <FocusMode
        movements={formattedMovements}
        adventureId={adventure.id}
        onUpdate={handleMovementUpdate}
        onExit={() => setFocusMode(false)}
      />
    )
  }

  return (
    <div className="container max-w-4xl mx-auto py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold">{adventure.title}</h1>
          <div className="flex gap-2">
            {adventure.state === 'draft' && (
              <>
                <Button
                  variant="default"
                  disabled={isUpdating}
                  onClick={() => {
                    console.log('Mark as Ready button clicked!')
                    setIsUpdating(true)
                    // Use immediate async function
                    void (async () => {
                      try {
                        console.log('Starting updateAdventureState...')
                        const { updateAdventureState } = await import('@/app/actions/adventures')
                        const guestToken = localStorage.getItem(`guest_token_${adventure.id}`)
                        console.log('Got guestToken:', !!guestToken)

                        const result = await updateAdventureState(
                          adventure.id,
                          'ready',
                          guestToken || undefined,
                        )
                        console.log('updateAdventureState result:', result)

                        if (result.success) {
                          setAdventure((prev) => (prev ? { ...prev, state: 'ready' } : prev))
                          const { toast } = await import('sonner')
                          toast.success('Adventure marked as ready!')
                        } else {
                          console.error('Failed to update adventure state:', result.error)
                          const { toast } = await import('sonner')
                          toast.error(result.error || 'Failed to update adventure')
                        }
                      } catch (error) {
                        console.error('Error in Mark as Ready handler:', error)
                        const { toast } = await import('sonner')
                        toast.error('An error occurred')
                      } finally {
                        setIsUpdating(false)
                      }
                    })()
                  }}
                >
                  {isUpdating ? 'Updating...' : 'Mark as Ready'}
                </Button>
                <Button variant="secondary" onClick={() => setFocusMode(true)}>
                  Edit Details
                </Button>
              </>
            )}
            <Button variant="outline" onClick={() => setExportDialogOpen(true)}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {adventure.description ? (
          <p className="text-lg text-muted-foreground">{adventure.description}</p>
        ) : null}

        <div className="flex gap-2 mt-4">
          <Badge variant="secondary">{adventure.frame}</Badge>
          <Badge variant="secondary">{adventure.focus.replace(/_/g, ' ')}</Badge>
        </div>
      </div>

      <div className="space-y-6">
        {adventure.movements?.map((movement, index) => (
          <Card key={movement.id || index}>
            <CardHeader>
              <CardTitle>{movement.title}</CardTitle>
              <CardDescription>{movement.type}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{movement.content || movement.description}</p>
              {movement.estimatedTime ? (
                <p className="text-sm text-muted-foreground mt-2">
                  Estimated time: {movement.estimatedTime}
                </p>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>

      <ExportDialog
        open={exportDialogOpen}
        adventureId={adventure.id}
        onClose={() => setExportDialogOpen(false)}
      />
    </div>
  )
}
