import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export async function POST(req: Request) {
  const SIGNING_SECRET = process.env.SIGNING_SECRET

  if (!SIGNING_SECRET) {
    throw new Error('Error: Please add SIGNING_SECRET from Clerk Dashboard to .env or .env.local')
  }

  // Create new Svix instance with secret
  const wh = new Webhook(SIGNING_SECRET)

  // Get headers
  const headerPayload = await headers()
  const svix_id = headerPayload.get('svix-id')
  const svix_timestamp = headerPayload.get('svix-timestamp')
  const svix_signature = headerPayload.get('svix-signature')

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error: Missing Svix headers', {
      status: 400,
    })
  }

  // Get body
  const payload = await req.json()
  const body = JSON.stringify(payload)

  console.log('Webhook payload received:', {
    type: payload.type,
    data: payload.data,
    payload: payload // full payload for inspection
  })

  let evt: WebhookEvent

  // Verify payload with headers
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent
  } catch (err) {
    console.error('Error: Could not verify webhook:', err)
    return new Response('Error: Verification error', {
      status: 400,
    })
  }

  // Handle user.created event
  if (evt.type === 'user.created') {
    try {
      const supabase = createClientComponentClient()
      
      const { error } = await supabase
        .from('users')
        .insert({
          id: evt.data.id,
          email: evt.data.email_addresses[0]?.email_address,
          first_name: evt.data.first_name,
          last_name: evt.data.last_name,
          created_at: new Date().toISOString()
        })

      if (error) {
        console.error('Supabase insert error:', error)
      } else {
        console.log('Successfully created user in Supabase')
      }
    } catch (err) {
      console.error('Error creating user in Supabase:', err)
    }
  }

  // Handle organization.created event
  if (evt.type === 'organization.created') {
    try {
      const supabase = createClientComponentClient()
      
      const { error } = await supabase
        .from('organizations')
        .insert({
          id: evt.data.id,
          name: evt.data.name,
          created_by: evt.data.created_by,
          created_at: new Date().toISOString()
        })

      if (error) {
        console.error('Supabase insert error:', error)
      } else {
        console.log('Successfully created organization in Supabase')
      }
    } catch (err) {
      console.error('Error creating organization in Supabase:', err)
    }
  }

  // Handle organization.created event
  if (evt.type === 'organization.created') {
    try {
      const supabase = createClientComponentClient()
      
      const { error: settingsError } = await supabase
        .from('tee_time_settings')
        .insert({
          organization_id: evt.data.id,
          interval_minutes: 10,
          first_tee_time: '06:00:00',  // timetz format HH:MM:SS
          last_tee_time: '18:00:00',   // timetz format HH:MM:SS
          booking_days_in_advance: 7,
          price: 0.00,
          created_at: new Date().toISOString()
        })

      if (settingsError) {
        console.error('Supabase tee time settings insert error:', settingsError)
      } else {
        console.log('Successfully created tee time settings')
      }
    } catch (err) {
      console.error('Error creating tee time settings:', err)
    }
  }

  return new Response('Webhook received', { status: 200 })
}