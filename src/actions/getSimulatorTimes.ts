'use server'

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

interface TeeTime {
    id: string
    start_time: string
    end_time: string
    price: number
    booked_spots: number
    available_spots: number
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
  
  // Create start/end dates in local timezone
  const start = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    0, 0, 0, 0
  )
  
  const end = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    23, 59, 59, 999
  )

  try {
    // Get number of simulators first
    const { data: settingsData } = await supabase
      .from('tee_time_settings')
      .select('number_of_simulators')
      .eq('organization_id', organizationId)
      .single()

    const { data: teeTimesData, error } = await supabase
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

    // Organize tee times by simulator
    const organizedTeeTimes: { [key: number]: TeeTime[] } = {}
    for (let i = 1; i <= (settingsData?.number_of_simulators || 0); i++) {
      organizedTeeTimes[i] = teeTimesData
        .filter((time: TeeTime) => time.simulator === i)
        .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
    }

    return { teeTimes: organizedTeeTimes, error: null }
  } catch (error) {
    console.error('Error:', error)
    return { teeTimes: {}, error }
  }
} 