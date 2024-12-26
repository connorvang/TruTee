'use server'

import { createClient } from '@/lib/supabase/server'

interface UserAccessCode {
  id: string
  user_id: string
  access_code_id: string
  created_at: string
  device_id: string
}

export async function getUserAccessCodes(userId: string): Promise<UserAccessCode[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('user_access_codes')
    .select('*')
    .eq('user_id', userId)

  if (error) throw error

  return data
} 