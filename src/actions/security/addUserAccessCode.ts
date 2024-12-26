'use server'

import { createClient } from '@/lib/supabase/server'
import { auth } from '@clerk/nextjs/server'

export async function addUserAccessCode({
  user_id,
  access_code_id,
  device_id
}: {
  user_id: string
  access_code_id: string
  device_id: string
}) {
  const { userId: currentUserId } = await auth()
  if (!currentUserId) throw new Error('Unauthorized')

  const supabase = await createClient()
  const now = new Date().toISOString()

  // Check if the access code is already assigned to the user
  const { data: existingCode, error: checkError } = await supabase
    .from('user_access_codes')
    .select('id')
    .eq('user_id', user_id)
    .eq('access_code_id', access_code_id)
    .single()

  if (checkError && checkError.code !== 'PGRST116') {
    throw checkError
  }

  // If already exists, return early
  if (existingCode) {
    return existingCode
  }

  // Create new user access code record
  const { data, error } = await supabase
    .from('user_access_codes')
    .insert([{
      user_id,
      access_code_id,
      device_id,
      created_at: now
    }])
    .select('id')
    .single()

  if (error) {
    console.error('Error adding user access code:', error)
    throw error
  }

  return data
} 