import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useOrganization } from '@clerk/nextjs'

interface TeeTime {
  id: string
  start_time: string
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
  simulator: number
  tee_time_bookings: {
    bookings: any
    booking: {
      id: string
      user_id: string
      guests: number
      number_of_holes: number
      has_cart: boolean
      simulator: number
      user: {
        handicap: number
        first_name: string
        last_name: string
      }
    }
  }[]
}

export function useTeeTimes(date: Date | undefined) {
  const [teeTimes, setTeeTimes] = useState<TeeTime[]>([])
  const [numberOfSimulators, setNumberOfSimulators] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const { organization } = useOrganization()
  const activeOrganization = organization?.id

  useEffect(() => {
    if (!date || !activeOrganization) {
      setLoading(false)
      return
    }

    const fetchOrgSettings = async () => {
      const supabase = createClientComponentClient()
      
      try {
        const { data, error } = await supabase
          .from('tee_time_settings')
          .select('number_of_simulators')
          .eq('organization_id', activeOrganization)
          .single()

        if (error) throw error
        setNumberOfSimulators(data?.number_of_simulators || 0)
      } catch (err) {
        console.error('Error fetching org settings:', err)
        setError(err instanceof Error ? err : new Error('Failed to fetch org settings'))
      }
    }

    const fetchTeeTimes = async () => {
      const supabase = createClientComponentClient()
      
      const start = new Date(date)
      start.setHours(0, 0, 0, 0)
      
      const end = new Date(date)
      end.setHours(23, 59, 59, 999)

      try {
        const { data, error } = await supabase
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
          .eq('organization_id', activeOrganization)
          .gte('start_time', start.toISOString())
          .lte('start_time', end.toISOString())
          .order('start_time', { ascending: true })

        if (error) throw error
        setTeeTimes(data || []);
        setError(null)
        console.log('Fetched tee times:', data)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch tee times'))
      } finally {
        setLoading(false)
      }
    }

    fetchOrgSettings()
    if (date) {
      fetchTeeTimes()
    }
  }, [date, activeOrganization])

  return { teeTimes, loading, error, numberOfSimulators }
} 