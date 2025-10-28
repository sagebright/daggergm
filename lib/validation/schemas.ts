import { z } from 'zod'

// Email validation schema
export const emailSchema = z.string().email('Invalid email address')

// UUID validation schema - strict UUID v4 format
export const uuidSchema = z.string().uuid('Invalid UUID format')

// ID validation schema - more lenient to accept various ID formats
export const idSchema = z.string().regex(/^[a-zA-Z0-9-_]+$/, 'Invalid ID format')

// Adventure configuration schema
export const adventureConfigSchema = z.object({
  length: z.enum(['oneshot', 'short_campaign', 'campaign']),
  primary_motif: z.string().min(1, 'Primary motif is required'),
  focus: z.string().optional(),
  frame: z.string().optional(),
  party_size: z.number().int().min(1).max(8, 'Party size must be 8 or less').default(4),
  party_level: z.number().int().min(1).max(20).default(1),
  difficulty: z.enum(['easier', 'standard', 'harder']).default('standard'),
  stakes: z.enum(['low', 'personal', 'high', 'world']).default('personal'),
})

// Credit package IDs
export const creditPackageSchema = z.enum(['credits_5', 'credits_15', 'credits_30'])

// Credit purchase schema
export const creditPurchaseSchema = z.object({
  packageId: creditPackageSchema,
  amount: z.number().positive('Amount must be positive'),
  price: z.number().positive('Price must be positive'), // in cents
})

// Movement update schema
export const movementUpdateSchema = z
  .object({
    title: z.string().min(1, 'Title cannot be empty').optional(),
    type: z.string().optional(),
    content: z.string().optional(),
    order_index: z.number().int().min(0).optional(),
    metadata: z
      .object({
        gm_notes: z.string().optional(),
        estimated_time: z.string().optional(),
        mechanics: z
          .object({
            difficulty: z.number().optional(),
            consequences: z.string().optional(),
          })
          .optional(),
      })
      .optional(),
  })
  .partial()

// Export format schema
export const exportFormatSchema = z.enum(['markdown', 'pdf', 'roll20'])

// Export request schema
export const exportRequestSchema = z.object({
  adventureId: uuidSchema,
  format: exportFormatSchema,
})

// Webhook event schema
export const stripeWebhookMetadataSchema = z.object({
  userId: z.string(),
  creditAmount: z.string().transform((val) => parseInt(val, 10)),
})

// Adventure generation request schema for API
export const adventureGenerationRequestSchema = z.object({
  config: adventureConfigSchema,
  userId: z.string().optional(),
})

// Movement expansion request schema
export const movementExpansionRequestSchema = z.object({
  adventureId: uuidSchema,
  movementId: z.string(),
  instruction: z.string().optional(),
})

// Movement refinement request schema
export const movementRefinementRequestSchema = z.object({
  adventureId: uuidSchema,
  movementId: z.string(),
  instruction: z.string().min(3, 'Instruction must be at least 3 characters long'),
})

// Credit transaction query schema
export const creditTransactionQuerySchema = z.object({
  userId: z.string(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
})

// Type exports
export type AdventureConfig = z.infer<typeof adventureConfigSchema>
export type CreditPurchase = z.infer<typeof creditPurchaseSchema>
export type MovementUpdate = z.infer<typeof movementUpdateSchema>
export type ExportRequest = z.infer<typeof exportRequestSchema>
export type ExportFormat = z.infer<typeof exportFormatSchema>
export type CreditPackageId = z.infer<typeof creditPackageSchema>
