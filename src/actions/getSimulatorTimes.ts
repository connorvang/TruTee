'use server'

import { createClient } from '@/lib/supabase/server'

interface TeeTime {
    id: string
    start_date: string
    start_time: string
    end_date: string
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
  const supabase = await createClient() 
  
  // Adjust for local timezone
  const localDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
  const dateString = localDate.toISOString().split('T')[0];

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
      .eq('start_date', dateString)
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
    return { teeTimes: {}, error }
  }
} 