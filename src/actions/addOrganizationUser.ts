'use server'

import { createClient } from '@/lib/supabase/server'

export async function addOrganizationUser(userId: string, organizationId: string) {
  const supabase = await createClient()
  const now = new Date().toISOString()

  // First check if the user is already in the organization
  const { data: existingUser, error: checkError } = await supabase
    .from('organization_users')
    .select('id, created_at')
    .eq('user_id', userId)
    .eq('organization_id', organizationId)
    .single()

  if (checkError && checkError.code !== 'PGRST116') {
    throw checkError
  }

  // If user already exists, return early with their join date
  if (existingUser) {
    return existingUser
  }

  // If user doesn't exist, add them with current timestamp
  const { data, error } = await supabase
    .from('organization_users')
    .insert([{
      user_id: userId,
      organization_id: organizationId,
      created_at: now
    }])
    .select('id, created_at')
    .single()

  if (error) {
    console.error('Error adding user to org:', error)
    throw error
  }

  return data
} 