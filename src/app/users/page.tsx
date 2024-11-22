import { createClient } from '@/lib/supabase/server'

export default async function Teetimes() {
  const supabase = await createClient()
  
  const { data: tee_times, error } = await supabase
    .from('tee_times')
    .select('*')

  if (error) {
    return <div>Error loading tee times: {error.message}</div>
  }

  if (!tee_times) {
    return <div>No tee times found</div>
  }

  return (
    <div>
      <h1>Tee Times</h1>
      <pre>{JSON.stringify(tee_times, null, 2)}</pre>
      
      {/* Optional: Display in a more structured way */}
      <div className="mt-4">
        {tee_times.map((tee_time) => (
          <div key={tee_time.id} className="p-4 border rounded mb-2">
            <p>Start time: {tee_time.start_time}</p>
            <p>Available spots: {tee_time.available_spots}</p>
            <p>Booked spots: {tee_time.booked_spots}</p>
          </div>
        ))}
      </div>
    </div>
  )
}