'use server'

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

interface TeeTime {
    id: string
    start_time: string
    end_time: string
    price: number
    simulator: number
    tee_time_bookings: {
      id: string
      bookings: {
        id: string
        user_id: string
        users: {
          handicap: number
          first_name: string
          last_name: string
        }
      }
    }[]
  }

export interface TeeTimes {
  [simulator: number]: TeeTime[]
}

export async function getSimulatorTimes(date: Date, organizationId: string) {
  const supabase = createServerComponentClient({ cookies })
  
  const start = new Date(date)
  start.setHours(0, 0, 0, 0)
  
  const end = new Date(date)
  end.setHours(23, 59, 59, 999)

  const { data, error } = await supabase
    .from('tee_times')
    .select(`
      *,
      tee_time_bookings (
        id,
        bookings (
          id,
          user_id,
          users (
            handicap,
            first_name,
            last_name
          )
        )
      )
    `)
    .eq('organization_id', organizationId)
    .gte('start_time', start.toISOString())
    .lte('start_time', end.toISOString())
    .order('start_time', { ascending: true })

  if (error) throw error

  const grouped = (data || []).reduce((acc: TeeTimes, teeTime: TeeTime) => {
    if (!acc[teeTime.simulator]) {
      acc[teeTime.simulator] = []
    }
    acc[teeTime.simulator].push(teeTime)
    return acc
  }, {} as TeeTimes)

  return grouped
} 