import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://wuzhvcipluqobqixljoc.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1emh2Y2lwbHVxb2JxaXhsam9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1NTU5ODUsImV4cCI6MjA4MjEzMTk4NX0.7kPSkgzz25vTcOHdxNHLJguZ2dxxIxziAy5f5NA0rH8'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

