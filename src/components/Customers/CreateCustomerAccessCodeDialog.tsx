'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { DateTimePicker } from "@/components/ui/date-time-picker"
import { addUserAccessCode } from '@/actions/security/addUserAccessCode'


export function CreateAccessCodeDialog({ 
  userId, 
  devices = [],
  onAccessCodeCreated 
}: { 
  userId: string
  devices: Array<{ device_id: string; name: string; }>;
  onAccessCodeCreated: () => void 
}) {
  console.log('CreateAccessCodeDialog devices:', devices);

  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    type: 'ongoing',
    deviceId: '',
    startsAt: new Date(),
    endsAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Default to tomorrow
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.deviceId) {
      toast({
        variant: "destructive",
        description: "Please select a device",
        duration: 3000,
      })
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`/api/seam/${formData.deviceId}/access-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          code: formData.code,
          type: formData.type,
          user_id: userId,
          ...(formData.type === 'timebound' && {
            starts_at: formData.startsAt.toISOString(),
            ends_at: formData.endsAt.toISOString(),
          }),
        }),
      })

      if (!response.ok) throw new Error('Failed to create access code')

      const { access_code_id } = await response.json()

      await addUserAccessCode({
        user_id: userId,
        access_code_id,
        device_id: formData.deviceId,
      })

      toast({
        description: "Access code created successfully",
        duration: 3000,
      })
      
      setOpen(false)
      onAccessCodeCreated()
    } catch (error) {
      toast({
        variant: "destructive",
        description: "Failed to create access code",
        duration: 3000,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" className="w-full flex items-center justify-start gap-2 text-blue-600 px-4 py-6 hover:bg-white hover:text-blue-800">
          <span>+</span> Add access code
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Create Access Code</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="device">Device</Label>
            <Select
              value={formData.deviceId}
              onValueChange={(value) => setFormData(prev => ({ ...prev, deviceId: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a device" />
              </SelectTrigger>
              <SelectContent>
                {devices?.map((device) => (
                  <SelectItem key={device.device_id} value={device.device_id}>
                    {device.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter code name"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="code">Code</Label>
            <Input
              id="code"
              value={formData.code}
              onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
              placeholder="Enter access code"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Type</Label>
            <RadioGroup
              value={formData.type}
              onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
              className="flex flex-col space-y-1"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="ongoing" id="ongoing" />
                <Label htmlFor="ongoing">Ongoing</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="timebound" id="timebound" />
                <Label htmlFor="timebound">Time-bound</Label>
              </div>
            </RadioGroup>
          </div>

          {formData.type === 'timebound' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Starts at</Label>
                <DateTimePicker 
                  date={formData.startsAt}
                  setDate={(date) => setFormData(prev => ({ ...prev, startsAt: date }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Ends at</Label>
                <DateTimePicker 
                  date={formData.endsAt}
                  setDate={(date) => setFormData(prev => ({ ...prev, endsAt: date }))}
                />
              </div>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating..." : "Create Access Code"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
} 