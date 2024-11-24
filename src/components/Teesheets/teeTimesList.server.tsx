import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

async function getTeeTimes(date: string, courseId: string = '5c78eae7-d8df-4877-a60c-84e1b4d6ffb4') {
  if (!courseId) throw new Error('Course ID is required')
  const supabase = createClientComponentClient()
  
  const start = new Date(date)
  start.setHours(0, 0, 0, 0)
  
  const end = new Date(date)
  end.setHours(23, 59, 59, 999)

  const { data, error } = await supabase
    .from('tee_times')
    .select('*')
    .eq('course_id', courseId)
    .gte('start_time', start.toISOString())
    .lte('start_time', end.toISOString())
    .order('start_time', { ascending: true })

  if (error) throw error
  return data
}

export { getTeeTimes }