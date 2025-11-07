'use client'

import { LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

export function LogoutButton() {
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  return (
    <Button variant="outline" onClick={handleLogout} size="sm">
      <LogOut className="h-4 w-4 mr-2" />
      Logout
    </Button>
  )
}
