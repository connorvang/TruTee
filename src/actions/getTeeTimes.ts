'use server'

import { createClient } from '@/lib/supabase/server'

export interface TeeTime {
  id: string
  start_date: string
  start_time: string
  end_date: string
  end_time: string
  price: number
  green_fee_9: number
  green_fee_18: number
  cart_fee_9: number
  cart_fee_18: number
  available_spots: number
  booked_spots: number
  has_cart: boolean
  number_of_holes: number
  tee_time_bookings: {
    bookings: {
      id: string
      user_id: string
      guests: number
      number_of_holes: number
      has_cart: boolean
      users: {
        handicap: number
        first_name: string
        last_name: string
      }
    }
  }[]
}
export async function getTeeTimes(date: Date, organizationId: string) {
  const supabase = await createClient() 

  const localDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
  const dateString = localDate.toISOString().split('T')[0]  // "2024-12-19"

  const [teeTimesResponse, settingsResponse] = await Promise.all([
    supabase
      .from('tee_times')
      .select(`
        *,
        tee_time_bookings (
          id,
          bookings (
            id,
            user_id,
            guests,
            number_of_holes,
            has_cart,
            simulator,
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
      .order('start_time', { ascending: true }),

    supabase
      .from('tee_time_settings')
      .select('number_of_simulators')
      .eq('organization_id', organizationId)
      .single()
  ])

  if (teeTimesResponse.error) throw teeTimesResponse.error
  if (settingsResponse.error) throw settingsResponse.error

  return {
    teeTimes: teeTimesResponse.data || [],
    numberOfSimulators: settingsResponse.data?.number_of_simulators || 0
  }
} 