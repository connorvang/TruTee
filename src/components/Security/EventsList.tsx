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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: '2-digit',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).toLowerCase()
  }

  const Skeleton = () => (
    <div className="flex flex-col">
      {Array.from({ length: 3 }).map((_, idx) => (
        <div key={idx} className="flex items-center border-b px-6 py-5 border-gray-100">
          <div className="flex-1">
            <div className="h-5 w-32 bg-gray-200 rounded animate-pulse mb-2" />
            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  )

  return (
    <div className="space-y-4 w-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Events</h2>
      </div>
      
      <div className="bg-gray-50 p-1 rounded-2xl overflow-hidden">
        <div className="bg-white border border-black/6 rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <Skeleton />
          ) : events.length === 0 ? (
            <div className="p-6 text-sm text-gray-500">
              No events found.
            </div>
          ) : (
            events.map((event) => (
              <div 
                key={event.event_id} 
                className="flex items-center justify-between px-6 py-4 border-b border-gray-100"
              >
                <div className="space-y-1">
                  <div className="text-base font-medium">{event.event_type}</div>
                  <div className="text-sm text-gray-500">
                    {formatDate(event.occurred_at)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
} 