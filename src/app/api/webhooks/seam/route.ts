import { Webhook } from 'svix'
import { headers } from 'next/headers'


// Define an interface for your webhook payload
interface SeamWebhookPayload {
  event_type: string;
  device_id?: string;
  // Add other expected properties
}

export async function POST(request: Request) {
  const SIGNING_SECRET = process.env.SEAM_SIGNING_SECRET

  if (!SIGNING_SECRET) {
    throw new Error('Error: Please add SEAM_WEBHOOK_SECRET to .env or .env.local')
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
  const payload: SeamWebhookPayload = await request.json()
  const body = JSON.stringify(payload)

  console.log('🔵 Incoming Seam webhook:', {
    headers: {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature?.substring(0, 20) + '...' // Only log part of the signature for security
    },
    payload: payload
  })

  // Verify payload with headers
  try {
    const evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as { event_type: string; data: Record<string, unknown> }

    console.log('✅ Webhook verified successfully:', {
      event_type: evt.event_type,
      data: evt.data
    })


    // Handle different events
    switch (evt.event_type) {
      // Access Code Events
      case 'access_code.created':
      case 'access_code.set_on_device':
      case 'access_code.deleted':
      case 'access_code.removed_from_device':
      case 'access_code.changed':
      case 'access_code.updated':
      case 'access_code.scheduled_on_device':
        console.log('🎯 Broadcasting event:', evt.event_type)
        break
      // Lock Action Events
      case 'action_attempt.lock_door.failed':
      case 'action_attempt.lock_door.succeeded':
      case 'action_attempt.unlock_door.failed':
      case 'action_attempt.unlock_door.succeeded':
      // Connect Webview Events
      case 'connect_webview.login_failed':
      case 'connect_webview.login_succeeded':
      // Connected Account Events
      case 'connected_account.completed_first_sync':
      case 'connected_account.completed_first_sync_after_reconnection':
      case 'connected_account.connected':
      case 'connected_account.created':
      case 'connected_account.deleted':
      case 'connected_account.disconnected':
      case 'connected_account.successful_login':
      // Device Events
      case 'device.accessory_keypad_connected':
      case 'device.accessory_keypad_disconnected':
      case 'device.added':
      case 'device.battery_status_changed':
      case 'device.connected':
      case 'device.connection_became_flaky':
      case 'device.connection_stabilized':
      case 'device.converted_to_unmanaged':
      case 'device.deleted':
      case 'device.disconnected':
      case 'device.error.subscription_required':
      case 'device.error.subscription_required.resolved':
      case 'device.low_battery':
      case 'device.removed':
      case 'device.salto.privacy_mode_activated':
      case 'device.salto.privacy_mode_deactivated':
      case 'device.tampered':
      case 'device.third_party_integration_detected':
      case 'device.third_party_integration_no_longer_detected':
      case 'device.unmanaged.connected':
      case 'device.unmanaged.converted_to_managed':
      case 'device.unmanaged.disconnected':
      // Lock Status Events
      case 'lock.access_denied':
      case 'lock.locked':
      case 'lock.unlocked':
        console.log('🎯 Broadcasting event:', evt.event_type)
        break
      default:
        console.log('ℹ️ Unhandled event:', evt.event_type, evt.data)
    }

    return new Response('Webhook received', { status: 200 })
  } catch (err) {
    console.error('❌ Error: Could not verify webhook:', err)
    return new Response('Error: Verification error', {
      status: 400,
    })
  }
}
