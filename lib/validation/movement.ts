import { z } from 'zod'

import { MovementType } from '@/types/adventure'

export const movementUpdateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().max(10000).optional(),
  type: MovementType.optional(),
  estimatedTime: z.string().optional(),
  isLocked: z.boolean().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

export type MovementUpdate = z.infer<typeof movementUpdateSchema>

export const movementExpansionSchema = z.object({
  movementId: z.string().uuid(),
  prompt: z.string().min(1).max(1000),
  includeContext: z.boolean().default(true),
})

export type MovementExpansion = z.infer<typeof movementExpansionSchema>
