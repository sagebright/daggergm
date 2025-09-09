'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

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
  const [currentStep, setCurrentStep] = useState(0)
  const [selections, setSelections] = useState<Record<string, string>>({})
  const [isGuest, setIsGuest] = useState(true)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  async function checkAuth() {
    const supabase = createClient()
    const { data } = await supabase.auth.getUser()
    setIsGuest(!data.user)
    setLoading(false)
  }

  const handleSelection = (value: string) => {
    setSelections({ ...selections, [ADVENTURE_STEPS[currentStep].id]: value })

    if (currentStep < ADVENTURE_STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      // All steps completed, navigate to scaffold generation
      // For now, just log - actual navigation will be implemented
      console.log('Adventure config:', selections)
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

  const step = ADVENTURE_STEPS[currentStep]

  return (
    <div className="container max-w-2xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-2">Create Your Adventure</h1>

      {isGuest && (
        <Card className="mb-6 bg-muted">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              You&apos;re creating as a guest. Sign up to save your adventures and access premium
              features.
            </p>
          </CardContent>
        </Card>
      )}

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
          <CardTitle>{step.title}</CardTitle>
          <CardDescription>{step.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {step.options.map((option) => (
              <Button
                key={option.value}
                variant="outline"
                className="w-full justify-start text-left h-auto p-4"
                onClick={() => handleSelection(option.value)}
              >
                <div>
                  <div className="font-semibold">{option.label}</div>
                  {option.description && (
                    <div className="text-sm text-muted-foreground mt-1">{option.description}</div>
                  )}
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
