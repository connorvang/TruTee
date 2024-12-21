'use client'

import { useEffect, useState } from 'react'
import { Event } from '@/types/seam'

export default function EventsList({ lockId }: { lockId: string }) {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchEvents() {
      try {
        const response = await fetch(`/api/webhooks/seam/${lockId}`)
        const data = await response.json()
        setEvents(data.events || [])
      } catch (error) {
        console.error('Error fetching events:', error)
        setEvents([])
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [lockId])

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Events</h2>
      <div className="bg-gray-50 rounded-lg p-4">
        {events.length === 0 ? (
          <div className="text-gray-500 text-sm">No events found</div>
        ) : (
          <div className="space-y-2">
            {events.map((event) => (
              <div key={event.event_id} className="flex justify-between p-3 bg-white rounded-md">
                <span>{event.event_type}</span>
                <span className="text-gray-500">
                  {new Date(event.occurred_at).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 