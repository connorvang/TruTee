export interface Device {
  device_id: string
  created_at: string
  device_type: string
  display_name: string
  properties: {
    name?: string
    locked?: boolean
    online?: boolean
    door_open?: boolean
    manufacturer?: string
    model?: {
      display_name: string
    }
    image_url?: string
    battery_level?: number
  }
  can_remotely_lock?: boolean
  can_remotely_unlock?: boolean
}

export interface Event {
  event_id: string
  event_type: string
  occurred_at: string
  device_id: string
}

export interface AccessCode {
  access_code_id: string
  code: string
  name: string
  type: string
  starts_at?: string
  ends_at?: string
  status: string
} 