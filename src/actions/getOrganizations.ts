'use server'

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export interface Organization {
  id: string
  name: string
  golf_course: boolean
  location?: string
  description?: string
  image_url: string
}

export async function getOrganizations() {
  const supabase = createServerComponentClient({ cookies })

  const { data, error } = await supabase
    .from('organizations')
    .select('*')
    .order('name')

  if (error) throw error

  return data || []
} 