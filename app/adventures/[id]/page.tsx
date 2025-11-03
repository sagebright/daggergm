/* eslint-disable max-lines */
'use client'

import { Download, Trash2 } from 'lucide-react'
import { notFound, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

import { getAdventure, deleteAdventure } from '@/app/actions/adventures'
import { ExportDialog } from '@/components/features/export-dialog'
import { FocusMode } from '@/components/features/focus-mode'
import type { Movement } from '@/components/features/focus-mode'
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
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface Adventure {
  id: string
  title: string
  description?: string
  frame: string
  focus: string
  state: string
  scaffold_regenerations_used?: number
  expansion_regenerations_used?: number
  movements?: Array<{
    id?: string
    title: string
    type: string
    content?: string
    description?: string
    estimatedTime?: string
    confirmed?: boolean
    confirmTimestamp?: string
  }>
}

export default function AdventureDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [adventure, setAdventure] = useState<Adventure | null>(null)
  const [loading, setLoading] = useState(true)
  const [focusMode, setFocusMode] = useState(false)
  const [exportDialogOpen, setExportDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  const loadAdventure = async () => {
    const { id } = await params

    const data = await getAdventure(id)

    if (!data) {
      notFound()
    }

    // Adventure loaded
    setAdventure(data as unknown as Adventure)
    setLoading(false)
  }

  useEffect(() => {
    void loadAdventure()
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

    const result = await updateMovement(
      adventure.id,
      movementId,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      updates as any,
    )

    if (!result.success) {
      console.error('Failed to update movement:', result.error)
      // TODO: Show error toast and revert changes
    }
  }

  const handleDeleteAdventure = async () => {
    if (!adventure) {
      return
    }

    setIsDeleting(true)

    try {
      const result = await deleteAdventure(adventure.id)

      if (result.success) {
        const { toast } = await import('sonner')
        toast.success('Adventure deleted successfully')
        setDeleteDialogOpen(false)
        router.push('/dashboard')
      } else {
        const { toast } = await import('sonner')
        toast.error(result.error || 'Failed to delete adventure')
      }
    } catch (error) {
      console.error('Error deleting adventure:', error)
      const { toast } = await import('sonner')
      toast.error('An error occurred')
    } finally {
      setIsDeleting(false)
    }
  }

  if (focusMode && adventure.movements) {
    // Entering focus mode with movements
    const formattedMovements = adventure.movements.map((m, index) => {
      const movement: Movement = {
        id: m.id || String(index),
        title: m.title,
        type: m.type,
        content: m.content || m.description || '', // Use description if content is missing
        estimatedTime: m.estimatedTime || '30 minutes',
      }
      // Only add optional fields if they're defined (exactOptionalPropertyTypes: true)
      if (m.confirmed !== undefined) {
        movement.confirmed = m.confirmed
      }
      if (m.confirmTimestamp !== undefined) {
        movement.confirmTimestamp = m.confirmTimestamp
      }
      return movement
    })
    // Formatted movements

    return (
      <FocusMode
        movements={formattedMovements}
        adventureId={adventure.id}
        adventureState={adventure.state as 'draft' | 'finalized' | 'exported'}
        scaffoldRegenerationsUsed={adventure.scaffold_regenerations_used ?? 0}
        expansionRegenerationsUsed={adventure.expansion_regenerations_used ?? 0}
        onUpdate={handleMovementUpdate}
        onExit={() => setFocusMode(false)}
        onRefreshAdventure={() => void loadAdventure()}
      />
    )
  }

  // Calculate confirmation progress
  const confirmedCount = adventure.movements?.filter((m) => m.confirmed).length ?? 0
  const totalCount = adventure.movements?.length ?? 0
  const allConfirmed = confirmedCount === totalCount && totalCount > 0

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
                  disabled={isUpdating || !allConfirmed}
                  onClick={() => {
                    setIsUpdating(true)
                    // Use immediate async function
                    void (async () => {
                      try {
                        const { updateAdventureState } = await import('@/app/actions/adventures')

                        const result = await updateAdventureState(adventure.id, 'finalized')

                        if (result.success) {
                          setAdventure((prev) => (prev ? { ...prev, state: 'finalized' } : prev))
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
                  title={
                    !allConfirmed
                      ? `Confirm all scenes before marking as ready (${confirmedCount}/${totalCount} confirmed)`
                      : undefined
                  }
                >
                  {isUpdating ? 'Updating...' : 'Mark as Ready'}
                </Button>
                <Button variant="secondary" onClick={() => setFocusMode(true)}>
                  Edit Details
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setDeleteDialogOpen(true)}
                  className="text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </>
            )}
            {adventure.state === 'finalized' && (
              <>
                <Button variant="default" onClick={() => setFocusMode(true)}>
                  Expand Scenes
                </Button>
                <Button variant="outline" onClick={() => setExportDialogOpen(true)}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setDeleteDialogOpen(true)}
                  className="text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Per-Scene Confirmation Progress Indicator (Issue #9) */}
        {adventure.state === 'draft' &&
          adventure.movements !== undefined &&
          adventure.movements.length > 0 && (
            <div className="mb-4">
              <Card className={allConfirmed ? 'border-green-500 bg-green-50' : 'border-yellow-500'}>
                <CardContent className="py-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">
                        {allConfirmed ? (
                          <span className="text-green-700">
                            ✓ All scenes confirmed! Ready to mark as ready.
                          </span>
                        ) : (
                          <span className="text-yellow-700">
                            {confirmedCount}/{totalCount} scenes confirmed
                          </span>
                        )}
                      </p>
                      {!allConfirmed && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Confirm all scenes in Edit Details mode before marking as ready
                        </p>
                      )}
                    </div>
                    <Badge variant={allConfirmed ? 'default' : 'secondary'}>
                      {confirmedCount}/{totalCount}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

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

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Adventure?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{adventure.title}&quot;? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAdventure}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
