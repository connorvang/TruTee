'use server'

import { createClient } from '@/lib/supabase/server'

export interface Organization {
  id: string
  name: string
  golf_course: boolean
  location?: string
  description?: string
  image_url: string
}

export async function getOrganizations() {
  const supabase = await createClient() 

  const { data, error } = await supabase
    .from('organizations')
    .select('*')
    .order('name')

  if (error) throw error

  return data || []
} 