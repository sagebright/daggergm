'use client'

import { useRouter } from 'next/navigation'
import type { FormEvent } from 'react'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

import { generateAdventure, type AdventureConfig } from '@/app/actions/adventures'
import { CreditBalance } from '@/components/features/credits/CreditBalance'
import { CreditCost } from '@/components/features/credits/CreditCost'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import { getTierLevel } from '@/lib/utils'

type FormData = {
  motif: string
  partySize: string
  partyTier: string
  numScenes: string
}

export default function NewAdventurePage() {
  const router = useRouter()
  const [generating, setGenerating] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState<FormData>({
    motif: '',
    partySize: '4', // Default to 4 players
    partyTier: 'tier1', // Default to Tier 1
    numScenes: '3', // Default to 3 scenes
  })

  const checkAuth = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase.auth.getUser()
    setIsAuthenticated(!!data.user)
    setLoading(false)
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void checkAuth()
  }, [checkAuth])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    // Validate all fields
    if (!formData.motif || !formData.partySize || !formData.partyTier || !formData.numScenes) {
      toast.error('Please fill in all fields')
      return
    }

    // Require authentication (guest system removed)
    if (!isAuthenticated) {
      toast.error('Please sign in to create an adventure')
      router.push('/login')
      return
    }

    // Prevent multiple calls
    if (generating) {
      return
    }

    setGenerating(true)

    try {
      toast.info('Generating your adventure...', { duration: 2000 })

      const adventureConfig: AdventureConfig = {
        length: 'oneshot', // Fixed for now
        primary_motif: formData.motif,
        frame: 'witherwild', // Default frame
        party_size: parseInt(formData.partySize),
        party_level: getTierLevel(formData.partyTier),
        difficulty: 'standard',
        stakes: 'personal',
        num_scenes: parseInt(formData.numScenes),
      }

      const result = await generateAdventure(adventureConfig)

      if (result.success) {
        toast.success('Adventure created successfully!')
        // Use replace to prevent back button issues
        router.replace(`/adventures/${result.adventureId}`)
        return // Exit early to avoid resetting generating state
      } else {
        toast.error('error' in result ? result.error : 'Failed to generate adventure')
        setGenerating(false)
      }
    } catch (error) {
      console.error('Generation error:', error)
      toast.error('Something went wrong. Please try again.')
      setGenerating(false)
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  if (generating) {
    return (
      <div className="container max-w-2xl mx-auto py-8 text-center">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <h2 className="text-xl font-semibold">Generating Your Adventure</h2>
              <p className="text-muted-foreground">
                Our AI is crafting your perfect Daggerheart adventure...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container max-w-2xl mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Create Your Adventure</h1>
        {isAuthenticated ? <CreditBalance variant="compact" /> : null}
      </div>

      {isAuthenticated ? (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Adventure Generation Cost</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Each adventure costs 1 credit to generate
                </p>
              </div>
              <CreditCost action="generate this adventure" cost={1} />
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="mb-6 border-amber-400/20 bg-amber-400/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
                  🔒 Authentication Required
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Please sign in to create an adventure. All adventures require an account.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Adventure Details</CardTitle>
          <CardDescription>Configure your adventure settings below</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Primary Motif */}
            <div className="space-y-2">
              <Label htmlFor="motif">Primary Motif *</Label>
              <Select
                value={formData.motif}
                onValueChange={(value: string) => setFormData({ ...formData, motif: value })}
              >
                <SelectTrigger id="motif" aria-required="true" aria-describedby="motif-desc">
                  <SelectValue placeholder="Select a motif" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high_fantasy">High Fantasy</SelectItem>
                  <SelectItem value="low_fantasy">Low Fantasy</SelectItem>
                  <SelectItem value="sword_sorcery">Sword & Sorcery</SelectItem>
                  <SelectItem value="grimdark">Grimdark</SelectItem>
                  <SelectItem value="weird">Weird</SelectItem>
                </SelectContent>
              </Select>
              <p id="motif-desc" className="text-xs text-muted-foreground">
                Choose the main theme for your adventure
              </p>
            </div>

            {/* Party Size */}
            <div className="space-y-2">
              <Label htmlFor="partySize">Party Size *</Label>
              <Select
                value={formData.partySize}
                onValueChange={(value: string) => setFormData({ ...formData, partySize: value })}
              >
                <SelectTrigger
                  id="partySize"
                  aria-required="true"
                  aria-describedby="party-size-desc"
                >
                  <SelectValue placeholder="Select party size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Player</SelectItem>
                  <SelectItem value="2">2 Players</SelectItem>
                  <SelectItem value="3">3 Players</SelectItem>
                  <SelectItem value="4">4 Players</SelectItem>
                  <SelectItem value="5">5+ Players</SelectItem>
                </SelectContent>
              </Select>
              <p id="party-size-desc" className="text-xs text-muted-foreground">
                Number of players in your group
              </p>
            </div>

            {/* Party Tier */}
            <div className="space-y-2">
              <Label htmlFor="partyTier">Party Tier *</Label>
              <Select
                value={formData.partyTier}
                onValueChange={(value: string) => setFormData({ ...formData, partyTier: value })}
              >
                <SelectTrigger
                  id="partyTier"
                  aria-required="true"
                  aria-describedby="party-tier-desc"
                >
                  <SelectValue placeholder="Select party tier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tier1">Tier 1 [Level 1]</SelectItem>
                  <SelectItem value="tier2">Tier 2 [Levels 2-4]</SelectItem>
                  <SelectItem value="tier3">Tier 3 [Levels 5-7]</SelectItem>
                  <SelectItem value="tier4">Tier 4 [Levels 8-10]</SelectItem>
                </SelectContent>
              </Select>
              <p id="party-tier-desc" className="text-xs text-muted-foreground">
                Experience level of your party
              </p>
            </div>

            {/* Number of Scenes */}
            <div className="space-y-2">
              <Label htmlFor="numScenes">Number of Scenes *</Label>
              <Select
                value={formData.numScenes}
                onValueChange={(value: string) => setFormData({ ...formData, numScenes: value })}
              >
                <SelectTrigger
                  id="numScenes"
                  aria-required="true"
                  aria-describedby="num-scenes-desc"
                >
                  <SelectValue placeholder="Select number of scenes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 Scenes</SelectItem>
                  <SelectItem value="4">4 Scenes</SelectItem>
                  <SelectItem value="5">5 Scenes</SelectItem>
                </SelectContent>
              </Select>
              <p id="num-scenes-desc" className="text-xs text-muted-foreground">
                Number of scenes in your adventure
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={generating}>
              {generating ? 'Generating...' : 'Generate Adventure'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
