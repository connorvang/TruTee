import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useOrganization } from '@clerk/nextjs'

interface TeeTime {
  id: string
  start_time: string
  price: number
  available_spots: number
  booked_spots: number
  has_cart: boolean
  number_of_holes: number
  bookings: {
    id: string
    user_id: string
    guests: number
    number_of_holes: number
    has_cart: boolean
    user: {
      handicap: number
      first_name: string
      last_name: string
    }
  }[]
}

export function useTeeTimes(date: Date | undefined | undefined) {
  const [teeTimes, setTeeTimes] = useState<TeeTime[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const { organization } = useOrganization()
  const activeOrganization = organization?.id

  useEffect(() => {
    if (!date || !activeOrganization) {
      setLoading(false)
      return
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
            bookings (
              id,
              user_id,
              guests,
              number_of_holes,
              has_cart,
              user:users (
                handicap,
                first_name,
                last_name
              )
            )
          `)
          .eq('organization_id', activeOrganization)
          .gte('start_time', start.toISOString())
          .lte('start_time', end.toISOString())
          .order('start_time', { ascending: true })

        if (error) throw error
        console.log('Tee Times Response:', data)
        setTeeTimes(data || [])
        setError(null)
      } catch (err) {
        console.error('Error fetching tee times:', err)
        setError(err instanceof Error ? err : new Error('Failed to fetch tee times'))
      } finally {
        setLoading(false)
      }
    }

    fetchTeeTimes()
  }, [date, activeOrganization])

  return { teeTimes, loading, error }
} 