import { z } from 'zod'

export const emailSchema = z.string().email('Invalid email address')

export const magicLinkSchema = z.object({
  email: emailSchema,
})

export type MagicLinkInput = z.infer<typeof magicLinkSchema>

export const guestSessionSchema = z.object({
  email: emailSchema,
  adventureId: z.string().uuid(),
  guestToken: z.string().uuid(),
})

export type GuestSession = z.infer<typeof guestSessionSchema>
