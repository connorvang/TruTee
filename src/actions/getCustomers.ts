'use server'

import { createClient } from '@/lib/supabase/server'

export interface Customer {
  id: string;
  user_id: string;
  created_at: string;
  users: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    handicap: number;
    created_at: string;
    ghin: string;
  }[];
}

export async function getCustomers(organizationId: string): Promise<Customer[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('organization_users')
    .select(`
      id,
      user_id,
      created_at,
      users (
        id,
        email,
        first_name,
        last_name,
        handicap,
        created_at,
        ghin
      )
    `)
    .eq('organization_id', organizationId)

  if (error) throw error

  return data as Customer[]
} 