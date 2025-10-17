import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { AppLayout } from '@/components/layout/AppLayout'

const peopleSearchSchema = z.object({
  filter: z.enum(['all', 'unread', 'important']).optional().default('all'),
  sort: z.enum(['recent', 'name', 'intent']).optional().default('recent'),
  search: z.string().optional(),
})

export const Route = createFileRoute('/people')({
  validateSearch: peopleSearchSchema,
  component: AppLayout,
})