import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function Home() {
  return (
    <div className="relative">
      {/* Hero Section */}
      <div className="relative isolate overflow-hidden">
        <div className="mx-auto max-w-7xl px-6 pb-24 pt-10 sm:pb-32 lg:flex lg:px-8 lg:py-40">
          <div className="mx-auto max-w-2xl lg:mx-0 lg:max-w-xl lg:flex-shrink-0 lg:pt-8">
            <h1 className="mt-10 text-4xl font-bold tracking-tight sm:text-6xl">
              Create Epic Daggerheart Adventures in Minutes
            </h1>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              DaggerGM is your AI-powered assistant for generating complete, balanced, and engaging
              one-shot adventures for Daggerheart. From concept to export-ready document in under 10
              minutes.
            </p>
            <div className="mt-10 flex items-center gap-x-6">
              <Link href="/auth/login">
                <Button size="lg">Get Started</Button>
              </Link>
              <Link href="/adventures/new">
                <Button variant="outline" size="lg">
                  Try as Guest
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-24 sm:py-32">
        <div className="mx-auto max-w-2xl lg:text-center">
          <h2 className="text-base font-semibold leading-7 text-primary">Everything you need</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            GM Like a Pro, Prep Like Magic
          </p>
          <p className="mt-6 text-lg leading-8 text-muted-foreground">
            DaggerGM understands the unique mechanics and narrative structure of Daggerheart,
            creating adventures that feel authentic and play smoothly at your table.
          </p>
        </div>
        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
          <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
            <div className="flex flex-col">
              <dt className="text-base font-semibold leading-7">Frame-Aware Generation</dt>
              <dd className="mt-1 flex flex-auto flex-col text-base leading-7 text-muted-foreground">
                <p className="flex-auto">
                  Adventures tailored to specific Daggerheart Frames, with appropriate adversaries,
                  themes, and environmental challenges.
                </p>
              </dd>
            </div>
            <div className="flex flex-col">
              <dt className="text-base font-semibold leading-7">Balanced Encounters</dt>
              <dd className="mt-1 flex flex-auto flex-col text-base leading-7 text-muted-foreground">
                <p className="flex-auto">
                  Combat, exploration, and social encounters balanced for your party&apos;s size and
                  level, following Daggerheart&apos;s unique mechanics.
                </p>
              </dd>
            </div>
            <div className="flex flex-col">
              <dt className="text-base font-semibold leading-7">AI-Powered Refinement</dt>
              <dd className="mt-1 flex flex-auto flex-col text-base leading-7 text-muted-foreground">
                <p className="flex-auto">
                  Focus Mode lets you dive deep into any movement, with AI assistance to expand,
                  refine, and perfect every scene.
                </p>
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* CTA Section */}
      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-24 sm:py-32">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Ready to revolutionize your game prep?
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-muted-foreground">
            Join thousands of Game Masters who are creating amazing adventures in minutes instead of
            hours.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Link href="/auth/login">
              <Button size="lg">Start Creating Adventures</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
