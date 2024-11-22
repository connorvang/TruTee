import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = createClient(
    process.env.SUPABASE_URL as string,
    process.env.SUPABASE_ANON_KEY as string
  )

  const { searchParams } = new URL(request.url)
  let queryBuilder = supabase.from('tee_times').select('*')
  
  // Handle date range and ordering
  for (const [key, value] of Array.from(searchParams.entries())) {
    if (value.startsWith('gte.')) {
      queryBuilder = queryBuilder.gte(key, value.substring(4))
    }
    else if (value.startsWith('lte.')) {
      queryBuilder = queryBuilder.lte(key, value.substring(4))
    }
    else if (key === 'order') {
      const [column, direction] = value.split('.')
      queryBuilder = queryBuilder.order(column, { ascending: direction === 'asc' })
    }
  }

  const { data, error } = await queryBuilder

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  // Add caching headers
  const response = NextResponse.json(data)
  response.headers.set('Cache-Control', 's-maxage=10') // Cache for 10 seconds
  return response
}
