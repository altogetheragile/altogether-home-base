
import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://wqaplkypnetifpqrungv.supabase.co'
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxYXBsa3lwbmV0aWZwcXJ1bmd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkyODg2OTUsImV4cCI6MjA2NDg2NDY5NX0.sE0cIatVX-tynJ7Z5dGp4L6f4-SA0s9KWU3WYtVoDzM'

export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    persistSession: true,
    autoRefreshToken: true,
  }
})
