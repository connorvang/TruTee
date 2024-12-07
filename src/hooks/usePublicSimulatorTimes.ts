import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

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
    }
  }[]
}

interface teeTimes {
  [simulator: number]: TeeTime[]
}

export function usePublicSimulatorTimes(date: Date | undefined, organizationId: string) {
  const [teeTimes, setGroupedTeeTimes] = useState<teeTimes>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!date || !organizationId) {
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
            tee_time_bookings (
              id,
              bookings (
                id,
                user_id
              )
            )
          `)
          .eq('organization_id', organizationId)
          .gte('start_time', start.toISOString())
          .lte('start_time', end.toISOString())
          .order('start_time', { ascending: true })

        if (error) throw error

        const grouped = (data || []).reduce((acc: teeTimes, teeTime: TeeTime) => {
          if (!acc[teeTime.simulator]) {
            acc[teeTime.simulator] = []
          }
          acc[teeTime.simulator].push(teeTime)
          return acc
        }, {} as teeTimes)

        setGroupedTeeTimes(grouped)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch tee times'))
      } finally {
        setLoading(false)
      }
    }

    fetchTeeTimes()
  }, [date, organizationId])

  return { teeTimes, loading, error }
} 