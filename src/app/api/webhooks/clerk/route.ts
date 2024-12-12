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
      
      // First insert: organization
      const { error: orgError } = await supabase
        .from('organizations')
        .insert({
          id: evt.data.id,
          name: evt.data.name,
          created_by: evt.data.created_by,
          created_at: new Date().toISOString()
        })

      if (orgError) {
        console.error('Supabase insert error:', orgError)
        return new Response('Error creating organization', { status: 500 })
      }

      // Second insert: tee time settings
      const { error: settingsError } = await supabase
        .from('tee_time_settings')
        .insert({
          organization_id: evt.data.id,
          interval_minutes: 10,
          first_tee_time: '06:00:00',
          last_tee_time: '18:00:00',
          booking_days_in_advance: 7,
          price: 99.99,
          created_at: new Date().toISOString()
        })

      if (settingsError) {
        console.error('Supabase tee time settings insert error:', settingsError)
        return new Response('Error creating tee time settings', { status: 500 })
      }

      console.log('Successfully created organization and tee time settings')
    } catch (err) {
      console.error('Error in organization.created handler:', err)
      return new Response('Internal server error', { status: 500 })
    }
  }

  // Handle organization.deleted event
  if (evt.type === 'organization.deleted') {
    try {
      const supabase = createClientComponentClient()
      
      // Delete organization (cascade will handle related tee_time_settings)
      const { error } = await supabase
        .from('organizations')
        .delete()
        .eq('id', evt.data.id)

      if (error) {
        console.error('Supabase delete error:', error)
        return new Response('Error deleting organization', { status: 500 })
      }

      console.log('Successfully deleted organization')
    } catch (err) {
      console.error('Error in organization.deleted handler:', err)
      return new Response('Internal server error', { status: 500 })
    }
  }

  // Handle organization.updated event
  if (evt.type === 'organization.updated') {
    try {
      const supabase = createClientComponentClient()
      
      const { error } = await supabase
        .from('organizations')
        .update({
          name: evt.data.name,
          updated_at: new Date().toISOString()
        })
        .eq('id', evt.data.id)

      if (error) {
        console.error('Supabase update error:', error)
        return new Response('Error updating organization', { status: 500 })
      }

      console.log('Successfully updated organization')
    } catch (err) {
      console.error('Error in organization.updated handler:', err)
      return new Response('Internal server error', { status: 500 })
    }
  }

  // Handle user.updated event
  if (evt.type === 'user.updated') {
    try {
      const supabase = createClientComponentClient()
      
      const { error } = await supabase
        .from('users')
        .update({
          email: evt.data.email_addresses[0]?.email_address,
          first_name: evt.data.first_name,
          last_name: evt.data.last_name,
          updated_at: new Date().toISOString()
        })
        .eq('id', evt.data.id)

      if (error) {
        console.error('Supabase update error:', error)
        return new Response('Error updating user', { status: 500 })
      }

      console.log('Successfully updated user')
    } catch (err) {
      console.error('Error in user.updated handler:', err)
      return new Response('Internal server error', { status: 500 })
    }
  }

  // Handle user.deleted event
  if (evt.type === 'user.deleted') {
    try {
      const supabase = createClientComponentClient()
      
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', evt.data.id)

      if (error) {
        console.error('Supabase delete error:', error)
        return new Response('Error deleting user', { status: 500 })
      }

      console.log('Successfully deleted user')
    } catch (err) {
      console.error('Error in user.deleted handler:', err)
      return new Response('Internal server error', { status: 500 })
    }
  }

  return new Response('Webhook received', { status: 200 })
}