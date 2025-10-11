'use server'

import { createClient } from '@/lib/supabase/server'
import { MarkdownExporter } from '@/lib/export/markdown-exporter'
import { PDFExporter } from '@/lib/export/pdf-exporter'
import { Roll20Exporter } from '@/lib/export/roll20-exporter'
import { exportRequestSchema, type ExportFormat } from '@/lib/validation/schemas'
import { withRateLimit, getRateLimitContext } from '@/lib/rate-limiting/middleware'
import { RateLimitError } from '@/lib/rate-limiting/rate-limiter'
import { analytics, ANALYTICS_EVENTS } from '@/lib/analytics/analytics'
import type { Adventure, Movement } from '@/types/adventure'

export interface ExportResult {
  success: boolean
  data?: Blob
  filename?: string
  error?: string
}

export async function exportAdventure(
  adventureId: string,
  format: ExportFormat,
): Promise<ExportResult> {
  try {
    // Validate input
    const validationResult = exportRequestSchema.safeParse({
      adventureId,
      format,
    })

    if (!validationResult.success) {
      return {
        success: false,
        error: validationResult.error.issues[0].message,
      }
    }

    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return {
        success: false,
        error: 'Authentication required',
      }
    }

    // Apply rate limiting
    try {
      const rateLimitContext = await getRateLimitContext(user.id)
      await withRateLimit('export', rateLimitContext, async () => {
        // Rate limiting wrapper - the actual work will be done below
      })
    } catch (error) {
      if (error instanceof RateLimitError) {
        return {
          success: false,
          error: error.message,
          retryAfter: error.retryAfter,
        }
      }
      throw error
    }

    // Fetch adventure
    const { data: adventure, error: adventureError } = await supabase
      .from('adventures')
      .select('*')
      .eq('id', adventureId)
      .single()

    if (adventureError) {
      return {
        success: false,
        error: 'Failed to fetch adventure',
      }
    }

    if (!adventure) {
      return {
        success: false,
        error: 'Adventure not found',
      }
    }

    // Verify ownership
    if (adventure.user_id !== user.id) {
      return {
        success: false,
        error: 'Adventure not found',
      }
    }

    // Fetch movements
    const { data: movements, error: movementsError } = await supabase
      .from('movements')
      .select('*')
      .eq('adventure_id', adventureId)
      .order('order_index')

    if (movementsError) {
      return {
        success: false,
        error: 'Failed to fetch movements',
      }
    }

    // Export based on format
    let file: { filename: string; content: string | Buffer; mimeType: string }

    switch (format) {
      case 'markdown': {
        const exporter = new MarkdownExporter()
        file = exporter.exportToFile(adventure as Adventure, movements as Movement[])
        break
      }
      case 'pdf': {
        const exporter = new PDFExporter()
        file = await exporter.exportToFile(adventure as Adventure, movements as Movement[])
        break
      }
      case 'roll20': {
        const exporter = new Roll20Exporter()
        file = exporter.exportToFile(adventure as Adventure, movements as Movement[])
        break
      }
    }

    // Convert to Blob
    const blob = new Blob([file.content], { type: file.mimeType })

    // Track export completion
    await analytics.track(ANALYTICS_EVENTS.ADVENTURE_EXPORTED, {
      userId: user.id,
      adventureId,
      format,
      frame: adventure.frame,
      movementCount: movements?.length || 0,
      fileSize: blob.size,
    })

    return {
      success: true,
      data: blob,
      filename: file.filename,
    }
  } catch (error) {
    console.error('Export error:', error)
    return {
      success: false,
      error: 'Failed to export adventure',
    }
  }
}
