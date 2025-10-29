'use client'

import type React from 'react'
import { useState } from 'react'
import { toast } from 'sonner'

import { signInWithOtp, signInWithPassword, signUpWithPassword } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type AuthMode = 'password' | 'magic-link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [authMode, setAuthMode] = useState<AuthMode>('password')
  const [isSignUp, setIsSignUp] = useState(false)

  async function handlePasswordAuth(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (isSignUp) {
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin
        const result = await signUpWithPassword(email, password, siteUrl)

        if (result && !result.success) {
          toast.error(result.error)
        } else if (result) {
          toast.success(result.message)
        }
      } else {
        // Server Action establishes session server-side
        const result = await signInWithPassword(email, password)

        if (result && !result.success) {
          toast.error(result.error)
        } else if (result && result.success) {
          // Session established - redirect to dashboard
          toast.success('Login successful!')
          window.location.href = '/dashboard'
        }
      }
    } catch (error) {
      console.error('Login error:', error)
      toast.error('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)

    try {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin
      const result = await signInWithOtp(email, siteUrl)

      if (result && !result.success) {
        toast.error(result.error)
      } else if (result) {
        toast.success(result.message)
      }
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <Card className="mx-auto max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">
            {isSignUp ? 'Create Account' : 'Welcome to DaggerGM'}
          </CardTitle>
          <CardDescription>
            {isSignUp
              ? 'Sign up to start creating epic adventures'
              : 'Create epic Daggerheart adventures in minutes'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={authMode === 'password' ? handlePasswordAuth : handleMagicLink}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            {authMode === 'password' && (
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                />
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading
                ? 'Processing...'
                : authMode === 'password'
                  ? isSignUp
                    ? 'Sign Up'
                    : 'Sign In'
                  : 'Send Magic Link'}
            </Button>
          </form>

          <div className="mt-4 space-y-2 text-center text-sm">
            <div>
              <button
                onClick={() => {
                  setAuthMode(authMode === 'password' ? 'magic-link' : 'password')
                  setPassword('')
                }}
                className="text-primary underline-offset-4 hover:underline"
                type="button"
              >
                {authMode === 'password' ? 'Use magic link instead' : 'Use password instead'}
              </button>
            </div>

            {authMode === 'password' && (
              <div>
                <span className="text-muted-foreground">
                  {isSignUp ? 'Already have an account?' : 'New to DaggerGM?'}{' '}
                </span>
                <button
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-primary underline-offset-4 hover:underline"
                  type="button"
                >
                  {isSignUp ? 'Sign in' : 'Create account'}
                </button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
