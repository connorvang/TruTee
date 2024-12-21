'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Copy } from "lucide-react"
import { AccessCode } from '@/types/seam'

export default function AccessCodesList({ lockId }: { lockId: string }) {
  const [codes, setCodes] = useState<AccessCode[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchCodes() {
      try {
        const response = await fetch(`/api/webhooks/seam/${lockId}`)
        const data = await response.json()
        setCodes(data.accessCodes || [])
      } catch (error) {
        console.error('Error fetching access codes:', error)
        setCodes([])
      } finally {
        setLoading(false)
      }
    }

    fetchCodes()
  }, [lockId])

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Access codes</h2>
        <Button 
          variant="default" 
          size="sm"
          className="bg-black hover:bg-gray-800"
        >
          Add code
        </Button>
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
                      `${code.starts_at ? formatDate(code.starts_at) : ''}  →  ${code.ends_at ? formatDate(code.ends_at) : ''}`}
                  </div>
                </div>
                <div className="flex items-center px-3 justify-end gap-3 w-40">
                    <Button 
                      variant="secondary" 
                      size="sm"
                      className="text-sm font-medium"
                      onClick={() => copyCode(code.code)}
                    >
                      <span className="text-base font-medium">{code.code}</span>
                      <Copy className="w-4 h-4" />
                    </Button>
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
                </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}