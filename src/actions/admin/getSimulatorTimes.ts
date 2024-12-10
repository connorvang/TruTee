// src/app/_actions/simulator.ts
'use server'

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function getSimulatorTimes(date: Date, organizationId: string) {
  const supabase = createServerComponentClient({ cookies })
  
  const start = new Date(date)
  start.setHours(0, 0, 0, 0)
  
  const end = new Date(date)
  end.setHours(23, 59, 59, 999)

  try {
    // First get the number of simulators
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
    const organizedTeeTimes: { [key: number]: any[] } = {}
    for (let i = 1; i <= (settingsData?.number_of_simulators || 0); i++) {
      organizedTeeTimes[i] = teeTimesData
        .filter(time => time.simulator === i)
        .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
    }

    return { teeTimes: organizedTeeTimes, error: null }
  } catch (error) {
    console.error('Error:', error)
    return { teeTimes: {}, error }
  }
}