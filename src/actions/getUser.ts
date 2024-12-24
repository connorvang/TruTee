'use server'

import { createClient } from '@/lib/supabase/server'

export interface User {
  id: string
  email: string
  first_name?: string
  last_name?: string
  created_at: string
  organization_id?: string
  ghin?: string;
}

export async function getUser(userId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) throw error

  return data
} 