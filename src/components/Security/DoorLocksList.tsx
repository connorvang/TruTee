'use client'

import { useEffect, useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import { Battery, BatteryLow, BatteryMedium, BatteryFull, Lock, LockOpen } from 'lucide-react'

interface Device {
  device_id: string
  display_name: string
  properties: {
    name: string
    locked: boolean
    online: boolean
    door_open: boolean
    manufacturer: string
    model: {
      display_name: string
    }
    image_url: string
    battery_level: number
  }
  can_remotely_lock: boolean
  can_remotely_unlock: boolean
}

export default function DoorLocksList() {
  const [locks, setLocks] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const connectWindowRef = useRef<Window | null>(null)
  const pollIntervalRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    fetchLocks()

    const interval = setInterval(() => {
      fetchLocks()
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const fetchLocks = async () => {
    try {
      const response = await fetch('/api/webhooks/seam')
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch locks')
      }
      const data = await response.json()
      setLocks(data)
    } catch (err) {
      console.error('Error fetching locks:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleLockAction = async (deviceId: string, action: 'unlock' | 'lock') => {
    setActionLoading(deviceId)
    try {
      const response = await fetch('/api/webhooks/seam', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ deviceId, action }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        if (data.code === 'error_from_august_api_status_code_524') {
          throw new Error('Unable to reach the lock. Please check if the lock is online and try again.')
        }
        throw new Error(data.error || `Failed to ${action} door`)
      }

      await fetchLocks()
    } catch (err) {
      console.error(`${action} error:`, err)
      alert(err instanceof Error ? err.message : `Failed to ${action} door`)
    } finally {
      setActionLoading(null)
    }
  }

  const handleAddDevice = async () => {
    try {
      setIsConnecting(true)
      const response = await fetch('/api/webhooks/seam', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to create connect webview')
      }
      
      const data = await response.json()
      
      // Open the Connect Webview in a popup
      const width = 500
      const height = 700
      const left = window.screen.width / 2 - width / 2
      const top = window.screen.height / 2 - height / 2
      
      connectWindowRef.current = window.open(
        data.url,
        'Seam Connect',
        `width=${width},height=${height},left=${left},top=${top}`
      )

      // Start polling for new devices
      pollIntervalRef.current = setInterval(async () => {
        await fetchLocks()
        
        // Check if the popup is closed
        if (connectWindowRef.current?.closed) {
          clearInterval(pollIntervalRef.current)
          setIsConnecting(false)
          connectWindowRef.current = null
        }
      }, 2000)

      // Cleanup after 5 minutes
      setTimeout(() => {
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current)
          setIsConnecting(false)
        }
      }, 300000)

    } catch (err) {
      console.error('Error creating connect webview:', err)
      alert('Failed to open device connection window')
      setIsConnecting(false)
    }
  }

  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
      }
    }
  }, [])

  const Skeleton = () => (
    <div className="flex flex-col">
      {Array.from({ length: 3 }).map((_, idx) => (
        <div key={idx} className="flex items-center border-b px-6 py-5 border-gray-100">
          <div className="flex-1 flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-200 rounded-md animate-pulse" />
            <div>
              <div className="h-5 w-32 bg-gray-200 rounded animate-pulse mb-2" />
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
          <div className="flex-1 flex justify-end">
            <div className="w-24 h-10 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  )

  const toSentenceCase = (str: string) => {
    return str.toLowerCase().replace(/^\w/, c => c.toUpperCase());
  }

  return (
    <div className="flex flex-col gap-12 max-w-[1080px] mx-auto mt-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold mb-1">Security</h1>
        <p className="text-gray-500">Manage your security devices and access</p>
      </div>

      {/* Devices Section */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Devices</h2>
          <Button 
            variant="default" 
            size="sm" 
            className="bg-black hover:bg-gray-800"
            onClick={handleAddDevice}
            disabled={isConnecting}
          >
            {isConnecting ? 'Connecting...' : 'Add device'}
          </Button>
        </div>

        {/* Table */}
        <div className="bg-gray-50 p-1 rounded-2xl overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-5 px-6 py-3">
            <div className="text-sm font-medium text-gray-600">Device</div>
            <div className="text-sm font-medium text-gray-600">Status</div>
            <div className="text-sm font-medium text-gray-600">Battery</div>
            <div className="text-sm font-medium text-gray-600">State</div>
            <div></div> {/* Action column */}
          </div>

          {/* Table Body */}
          <div className="bg-white border border-black/6 rounded-xl shadow-sm overflow-hidden">
            {loading ? (
              <Skeleton />
            ) : locks.length === 0 ? (
              <div className="p-6 text-sm text-gray-500">
                No devices found. Add a device to get started.
              </div>
            ) : (
              locks.map((lock) => (
                <div key={lock.device_id} className="grid grid-cols-5 px-6 py-4 border-b border-gray-100 items-center">
                  {/* Device */}
                  <div className="flex items-center gap-3">
                    <Image 
                      src={lock.properties.image_url || '/default-lock.png'} 
                      alt={lock.display_name}
                      width={32}
                      height={32}
                      className="rounded"
                    />
                    <span className="text-sm font-medium">{toSentenceCase(lock.display_name)}</span>
                  </div>

                  {/* Status */}
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-sm ${lock.properties.online ? 'bg-green-600' : 'bg-red-600'}`} />
                    <span className="text-sm text-gray-600">Online</span>
                  </div>

                  {/* Battery */}
                  <div className="flex items-center gap-2">
                    {lock.properties.battery_level * 100 >= 75 ? (
                      <BatteryFull className="w-5 h-5 text-green-500" />
                    ) : lock.properties.battery_level * 100 >= 50 ? (
                      <Battery className="w-5 h-5 text-green-500" />
                    ) : lock.properties.battery_level * 100 >= 25 ? (
                      <BatteryMedium className="w-5 h-5 text-orange-500" />
                    ) : (
                      <BatteryLow className="w-5 h-5 text-red-500" />
                    )}
                    <span className="text-sm text-gray-600">{Math.round(lock.properties.battery_level * 100)}%</span>
                  </div>

                  {/* State */}
                  <div className="flex items-center gap-2">
                    {lock.properties.locked ? (
                      <Lock className="w-4 h-4 text-gray-600" />
                    ) : (
                      <LockOpen className="w-4 h-4 text-gray-600" />
                    )}
                    <span className="text-sm text-gray-600">
                      {lock.properties.locked ? 'Locked' : 'Unlocked'}
                    </span>
                  </div>

                  {/* Action */}
                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleLockAction(lock.device_id, lock.properties.locked ? 'unlock' : 'lock')}
                      disabled={actionLoading === lock.device_id || !lock.properties.online}
                      className="min-w-[80px]"
                    >
                      {actionLoading === lock.device_id ? (
                        <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                      ) : lock.properties.locked ? (
                        'Unlock'
                      ) : (
                        'Lock'
                      )}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}