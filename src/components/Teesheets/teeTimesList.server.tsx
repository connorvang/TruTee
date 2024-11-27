import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

async function getTeeTimes(date: string) {
  const supabase = createClientComponentClient()
  
  const start = new Date(date)
  start.setHours(0, 0, 0, 0)
  
  const end = new Date(date)
  end.setHours(23, 59, 59, 999)

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
    .eq('organization_id', 'b4741620-74bc-4364-95c4-3b00be85e7f6')
    .gte('start_time', start.toISOString())
    .lte('start_time', end.toISOString())
    .order('start_time', { ascending: true })

  if (error) throw error
  return data
}

export { getTeeTimes }