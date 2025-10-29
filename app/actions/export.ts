'use server'

import { analytics, ANALYTICS_EVENTS } from '@/lib/analytics/analytics'
import { MarkdownExporter } from '@/lib/export/markdown-exporter'
import { PDFExporter } from '@/lib/export/pdf-exporter'
import { Roll20Exporter } from '@/lib/export/roll20-exporter'
import { withRateLimit, getRateLimitContext } from '@/lib/rate-limiting/middleware'
import { RateLimitError } from '@/lib/rate-limiting/rate-limiter'
import { createClient } from '@/lib/supabase/server'
import { exportRequestSchema, type ExportFormat } from '@/lib/validation/schemas'
import type { Adventure, Movement } from '@/types/adventure'

export interface ExportResult {
  success: boolean
  data?: Blob
  filename?: string
  error?: string
  retryAfter?: number
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
        error: validationResult.error.issues[0]?.message || 'Validation failed',
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
      .from('daggerheart_adventures')
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

    // Movements are stored in the adventure.movements JSONB array
    const movements = (adventure.movements as unknown as Movement[]) || []

    // Convert database types to application types
    const adventureData: Adventure = {
      id: adventure.id,
      title: adventure.title,
      frame: adventure.frame,
      focus: adventure.focus,
      state: (adventure.state as 'draft' | 'finalized' | 'exported') || 'draft',
      config: adventure.config as unknown as Adventure['config'],
      movements: movements,
      metadata: (adventure.metadata as Record<string, unknown>) || {},
      created_at: adventure.created_at || new Date().toISOString(),
      updated_at: adventure.updated_at || new Date().toISOString(),
      exported_at: adventure.exported_at,
    }

    // Export based on format
    let file: { filename: string; content: string | Buffer; mimeType: string }

    switch (format) {
      case 'markdown': {
        const exporter = new MarkdownExporter()
        file = exporter.exportToFile(adventureData, movements)
        break
      }
      case 'pdf': {
        const exporter = new PDFExporter()
        file = await exporter.exportToFile(adventureData, movements)
        break
      }
      case 'roll20': {
        const exporter = new Roll20Exporter()
        file = exporter.exportToFile(adventureData, movements)
        break
      }
    }

    // Convert to Blob
    const blob = new Blob([file.content as BlobPart], { type: file.mimeType })

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
