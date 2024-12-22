'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from "@/components/ui/button"
import { Copy, Trash2 } from "lucide-react"
import { AccessCode } from '@/types/seam'
import { useToast } from "@/hooks/use-toast"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { CreateAccessCodeDialog } from './CreateAccessCodeDialog'

export default function AccessCodesList({ lockId }: { lockId: string }) {
  const { toast } = useToast()
  const [codes, setCodes] = useState<AccessCode[]>([])
  const [loading, setLoading] = useState(true)

  const fetchCodes = useCallback(async (background = false) => {
    try {
      if (!background) {
        setLoading(true)
      }
      console.log('🔍 Fetching codes for lockId:', lockId)
      const response = await fetch(`/api/seam/${lockId}`)
      const data = await response.json()
      console.log('📥 Received codes:', data.accessCodes)
      setCodes(data.accessCodes || [])
    } catch (error) {
      console.error('Error fetching access codes:', error)
      setCodes([])
    } finally {
      setLoading(false)
    }
  }, [lockId])

  useEffect(() => {
    fetchCodes()
  }, [fetchCodes])

  useEffect(() => {
    let events = new EventSource('/api/events')
    console.log('🔌 Setting up SSE connection')
    
    events.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        console.log('🔄 Received SSE update:', data)
        
        if (
          (data.type === 'access_code.created' ||
           data.type === 'access_code.set_on_device' ||
           data.type === 'access_code.deleted' ||
           data.type === 'access_code.removed_from_device' ||
           data.type === 'access_code.changed' ||
           data.type === 'access_code.updated' ||
           data.type === 'access_code.scheduled_on_device') &&
          data.device_id === lockId
        ) {
          console.log('🎯 Matching event received, refreshing codes')
          fetchCodes(true)
        } else {
          console.log('⏭️ Skipping event - not relevant:', { 
            eventType: data.type, 
            deviceId: data.device_id,
            expectedDeviceId: lockId 
          })
        }
      } catch (error) {
        console.error('Error processing SSE message:', error)
      }
    }

    events.onerror = (error) => {
      console.error('❌ SSE Error:', error)
      events.close()
      
      setTimeout(() => {
        console.log('🔄 Attempting to reconnect SSE')
        events = new EventSource('/api/events')
      }, 5000)
    }

    return () => {
      console.log('🔌 Closing SSE connection')
      events.close()
    }
  }, [lockId, fetchCodes])

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    toast({
      description: "Code copied to clipboard",
      duration: 2000,
    })
  }

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
          <div className="flex gap-2">
            <div className="w-20 h-8 bg-gray-200 rounded animate-pulse" />
            <div className="w-8 h-8 bg-gray-200 rounded animate-pulse" />
            <div className="w-8 h-8 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  )

  const refreshCodes = () => {
    fetchCodes(false)
  }

  const deleteCode = async (accessCodeId: string) => {
    try {
      const response = await fetch(`/api/seam/${lockId}/access-code`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          access_code_id: accessCodeId
        })
      })
      
      if (response.ok) {
        toast({
          description: "Access code deleted successfully",
          duration: 2000,
        })
        refreshCodes()
      } else {
        throw new Error(`Failed with status: ${response.status}`)
      }
    } catch (error) {
      console.error('Error deleting access code:', error)
      toast({
        description: "Failed to delete access code",
        variant: "destructive",
        duration: 2000,
      })
    }
  }

  return (
    <div className="space-y-4 w-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Access codes</h2>
        <CreateAccessCodeDialog lockId={lockId} onAccessCodeCreated={refreshCodes} />
      </div>
      
      <div className="bg-gray-50 p-1 rounded-2xl overflow-hidden">
        {/* Table Body */}
        <div className="bg-white border border-black/6 rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <Skeleton />
          ) : codes.length === 0 ? (
            <div className="p-6 text-sm text-gray-500">
              No access codes found. Add a code to get started.
            </div>
          ) : (
            codes.map((code) => (
              <div 
                key={code.access_code_id} 
                className="flex items-center px-6 py-4 border-b border-gray-100"
              >
                <div className="space-y-1 pr-3 flex flex-1 flex-col">
                  <div className="text-base font-medium">{code.name}</div>
                  <div className="text-sm text-gray-500">
                    {code.type === 'ongoing' ? 'Ongoing' : 
                      `${code.starts_at ? formatDate(code.starts_at) : ''} → ${code.ends_at ? formatDate(code.ends_at) : ''}`}
                  </div>
                </div>
                <div className="flex items-center px-3 justify-end gap-3 w-40">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="secondary" 
                            size="sm"
                            onClick={() => copyCode(code.code)}
                            className="text-sm font-medium border bg-gray-50 border-gray-200 py-0 px-2"
                          >
                            <span className="text-sm font-medium">{code.code}</span>
                            <Copy className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Copy access code</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                </div>
                <div className="flex px-3 items-center gap-2 w-32">
                    <div className={`h-2 w-2 rounded-full ${
                      code.status === 'set' ? 'bg-green-500' : 
                      code.status === 'setting' ? 'bg-yellow-500' :
                      code.status === 'removing' ? 'bg-red-500' :
                      'bg-gray-400'
                    }`} />
                    <span className="text-sm">{code.status === 'set' ? 'Set' : 
                      code.status === 'setting' ? 'Setting' :
                      code.status === 'removing' ? 'Removing' :
                      'Unset'
                    }</span>
                  </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteCode(code.access_code_id)}
                        className="text-gray-500 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Delete access code</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}