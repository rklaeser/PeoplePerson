import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

const personSearchSchema = z.object({
  panel: z.enum(['messages', 'profile', 'activity']).optional().default('messages'),
  edit: z.string().optional(),
})

export const Route = createFileRoute('/people/$personId')({
  validateSearch: personSearchSchema,
  component: () => null, // Will be handled by AppLayout
})