import { z } from 'zod'

export type FeedbackType = 'bug' | 'feature' | 'general' | 'other'
export type FeedbackStatus = 'new' | 'reviewing' | 'in_progress' | 'resolved' | 'wont_fix' | 'duplicate'
export type FeedbackPriority = 'low' | 'medium' | 'high' | 'critical'

export interface Feedback {
  id: string
  created_at: string
  updated_at: string
  user_id?: string
  user_email?: string
  user_name?: string
  type: FeedbackType
  title: string
  description: string
  page_url?: string
  browser_info?: string
  screen_size?: string
  status: FeedbackStatus
  priority?: FeedbackPriority
  admin_notes?: string
  resolved_at?: string
  resolved_by?: string
}

export const feedbackSchema = z.object({
  type: z.enum(['bug', 'feature', 'general', 'other']),
  title: z.string().min(3, 'Title must be at least 3 characters').max(200, 'Title is too long'),
  description: z.string().min(10, 'Please provide more details (at least 10 characters)').max(2000, 'Description is too long'),
})

export type FeedbackFormData = z.infer<typeof feedbackSchema>
