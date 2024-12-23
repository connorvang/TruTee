'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useToast } from "@/hooks/use-toast"
import { DateTimePicker } from "@/components/ui/date-time-picker"

export function CreateAccessCodeDialog({ lockId, onAccessCodeCreated }: { 
  lockId: string,
  onAccessCodeCreated: () => void 
}) {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    type: 'ongoing',
    startsAt: new Date(),
    endsAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Default to tomorrow
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch(`/api/seam/${lockId}/access-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          code: formData.code,
          type: formData.type,
          ...(formData.type === 'timebound' && {
            starts_at: formData.startsAt.toISOString(),
            ends_at: formData.endsAt.toISOString(),
          }),
        }),
      })

      if (!response.ok) throw new Error('Failed to create access code')

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
        <Button variant="default" size="sm" className="bg-black hover:bg-gray-800">
          Add code
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Create Access Code</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
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