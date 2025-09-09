import { z } from 'zod'

// Enums
export const AdventureFrame = z.enum(['witherwild', 'custom'])
export type AdventureFrame = z.infer<typeof AdventureFrame>

export const AdventureDifficulty = z.enum(['easier', 'standard', 'harder'])
export type AdventureDifficulty = z.infer<typeof AdventureDifficulty>

export const AdventureStakes = z.enum(['low', 'personal', 'high', 'world'])
export type AdventureStakes = z.infer<typeof AdventureStakes>

export const MovementType = z.enum(['combat', 'exploration', 'social'])
export type MovementType = z.infer<typeof MovementType>

// Adventure configuration schema
export const adventureConfigSchema = z.object({
  frame: AdventureFrame,
  focus: z.string().min(1).max(100),
  partySize: z.number().min(1).max(6),
  partyLevel: z.number().min(1).max(3),
  difficulty: AdventureDifficulty,
  stakes: AdventureStakes,
  customFrameDescription: z.string().optional(),
})

export type AdventureConfig = z.infer<typeof adventureConfigSchema>

// Movement schema
export const movementSchema = z.object({
  id: z.string(),
  title: z.string(),
  type: MovementType,
  content: z.string(),
  estimatedTime: z.string(),
  isLocked: z.boolean().default(false),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

export type Movement = z.infer<typeof movementSchema>

// Adventure schema
export const adventureSchema = z.object({
  id: z.string(),
  title: z.string(),
  frame: z.string(),
  focus: z.string(),
  state: z.enum(['draft', 'finalized', 'exported']),
  config: adventureConfigSchema,
  movements: z.array(movementSchema),
  metadata: z.record(z.string(), z.unknown()).optional(),
  created_at: z.string(),
  updated_at: z.string(),
  exported_at: z.string().nullable(),
})

export type Adventure = z.infer<typeof adventureSchema>

// Scaffold result from LLM
export const scaffoldResultSchema = z.object({
  title: z.string(),
  summary: z.string(),
  movements: z.array(
    z.object({
      title: z.string(),
      type: MovementType,
      description: z.string(),
      estimatedTime: z.string(),
    }),
  ),
  hooks: z.array(z.string()),
  themes: z.array(z.string()),
})

export type ScaffoldResult = z.infer<typeof scaffoldResultSchema>
