import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  // Update user's session
  const { response, user } = await updateSession(request)

  // Protected routes
  const protectedPaths = ['/dashboard']
  const authPaths = ['/auth/login', '/auth/callback']
  const currentPath = request.nextUrl.pathname

  const isProtectedPath = protectedPaths.some((path) => currentPath.startsWith(path))
  const isAuthPath = authPaths.some((path) => currentPath.startsWith(path))

  // Check if user is authenticated (using actual user from getUser())
  const hasSession = !!user

  // Redirect logic
  if (isProtectedPath && !hasSession) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  if (isAuthPath && hasSession) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes
     */
    '/((?!_next/static|_next/image|favicon.ico|api/).*)',
  ],
}
