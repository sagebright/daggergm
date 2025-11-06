import type { Metadata } from 'next'
import type React from 'react'
import { Toaster } from 'sonner'
import './globals.css'

// Use system fonts to avoid build-time fetch issues in CI/CD
// Google Fonts (Geist) fetching fails in restricted network environments
const fontVariables = '--font-geist-sans: system-ui, -apple-system, sans-serif; --font-geist-mono: ui-monospace, monospace;'

export const metadata: Metadata = {
  title: 'DaggerGM - AI-Powered Daggerheart Adventures',
  description: 'Generate complete Daggerheart one-shot adventures in minutes with AI assistance',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased" style={{ fontFamily: 'var(--font-geist-sans, system-ui, sans-serif)' }}>
        <style dangerouslySetInnerHTML={{ __html: `:root { ${fontVariables} }` }} />
        {children}
        <Toaster position="bottom-right" />
        {/* Pipeline test: v1.0.1 */}
      </body>
    </html>
  )
}
