import Link from 'next/link'
import { redirect } from 'next/navigation'

import { CreditBalance } from '@/components/features/credits/CreditBalance'
import { Button } from '@/components/ui/button'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect('/auth/login')
  }

  // Fetch user's adventures
  const { data: adventures } = (await supabase
    .from('adventures')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })) as {
    data: Array<{ id: string; title: string; frame: string; state: string }> | null
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Your Adventures</h1>
          <div className="mt-2">
            <CreditBalance variant="detailed" />
          </div>
        </div>
        <Link href="/adventures/new">
          <Button>Generate New Adventure</Button>
        </Link>
      </div>

      {adventures && adventures.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {adventures.map((adventure) => (
            <Link key={adventure.id} href={`/adventures/${adventure.id}`} className="block">
              <div className="rounded-lg border bg-card p-6 hover:shadow-md transition-shadow">
                <h3 className="font-semibold mb-2">{adventure.title}</h3>
                <p className="text-sm text-muted-foreground mb-1">Frame: {adventure.frame}</p>
                <p className="text-sm text-muted-foreground">Status: {adventure.state}</p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">You haven&apos;t created any adventures yet.</p>
          <Link href="/adventures/new">
            <Button>Generate Your First Adventure</Button>
          </Link>
        </div>
      )}
    </div>
  )
}
