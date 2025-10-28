'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

import { generateAdventure, type AdventureConfig } from '@/app/actions/adventures'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'

// Adventure creation steps based on requirements
const ADVENTURE_STEPS = [
  {
    id: 'length',
    title: 'Adventure Length',
    description: 'How long will your adventure be?',
    options: [{ value: 'oneshot', label: 'One-shot', description: '3-4 hours of play' }],
  },
  {
    id: 'primary_motif',
    title: 'Primary Motif',
    description: 'Choose the main theme for your adventure',
    options: [
      {
        value: 'high_fantasy',
        label: 'High Fantasy',
        description: 'Epic adventures with magic and heroism',
      },
      {
        value: 'low_fantasy',
        label: 'Low Fantasy',
        description: 'Subtle magic in realistic settings',
      },
      { value: 'sword_sorcery', label: 'Sword & Sorcery', description: 'Combat and mysticism' },
      { value: 'grimdark', label: 'Grimdark', description: 'Dark, morally ambiguous stories' },
      { value: 'weird', label: 'Weird', description: 'Strange and surreal adventures' },
    ],
  },
  // Add more steps as needed
]

export default function NewAdventurePage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [selections, setSelections] = useState<Record<string, string>>({})
  const [isGuest, setIsGuest] = useState(true)
  const [guestEmail, setGuestEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  const checkAuth = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase.auth.getUser()
    setIsGuest(!data.user)
    setLoading(false)
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void checkAuth()
  }, [checkAuth])

  const handleSelection = async (value: string) => {
    const newSelections = { ...selections, [ADVENTURE_STEPS[currentStep]!.id]: value }
    setSelections(newSelections)

    if (currentStep < ADVENTURE_STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      // All steps completed, generate adventure
      await handleAdventureGeneration(newSelections)
    }
  }

  const handleAdventureGeneration = async (config: Record<string, string>) => {
    // Prevent multiple calls
    if (generating) {
      return
    }

    // For guest users, validate email first
    if (isGuest && !guestEmail) {
      toast.error('Please enter your email to continue')
      return
    }

    setGenerating(true)

    try {
      toast.info('Generating your adventure...', { duration: 2000 })

      const adventureConfig: AdventureConfig = {
        length: config.length || '',
        primary_motif: config.primary_motif || '',
        // Add defaults for missing fields
        frame: 'witherwild', // Default frame
        party_size: 4,
        party_level: 1,
        difficulty: 'standard',
        stakes: 'personal',
        // Add guest email if guest
        ...(isGuest && { guestEmail }),
      }

      const result = await generateAdventure(adventureConfig)

      if (result.success) {
        toast.success('Adventure created successfully!')

        // Don't reset generating state on success to prevent UI flicker
        const redirectUrl = `/adventures/${result.adventureId}`

        // Use replace to prevent back button issues
        router.replace(redirectUrl)
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

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
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

  const step = ADVENTURE_STEPS[currentStep]

  return (
    <div className="container max-w-2xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-2">Create Your Adventure</h1>

      {isGuest ? (
        <Card className="mb-6">
          <CardContent className="pt-6 space-y-4">
            <p className="text-sm text-muted-foreground">
              You&apos;re creating as a guest. Sign up to save your adventures and access premium
              features.
            </p>
            <div className="space-y-2">
              <Label htmlFor="email">Email (required for guest access)</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                We&apos;ll use this to save your adventure. You can claim it later by signing up.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="mb-8">
        <p className="text-sm text-muted-foreground mb-2">
          Step {currentStep + 1} of {ADVENTURE_STEPS.length}
        </p>
        <div className="w-full bg-secondary rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all"
            style={{ width: `${((currentStep + 1) / ADVENTURE_STEPS.length) * 100}%` }}
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{step!.title}</CardTitle>
          <CardDescription>{step!.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {step!.options.map((option) => (
              <Button
                key={option.value}
                variant="outline"
                className="w-full justify-start text-left h-auto p-4"
                onClick={() => handleSelection(option.value)}
              >
                <div>
                  <div className="font-semibold">{option.label}</div>
                  {option.description ? (
                    <div className="text-sm text-muted-foreground mt-1">{option.description}</div>
                  ) : null}
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {currentStep > 0 && (
        <div className="mt-6">
          <Button variant="ghost" onClick={handleBack}>
            Back
          </Button>
        </div>
      )}
    </div>
  )
}
