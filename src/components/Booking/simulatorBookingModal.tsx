import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { format } from 'date-fns'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useUser } from "@clerk/nextjs"
import { Input } from "@/components/ui/input"

interface BookingModalProps {
  isOpen: boolean
  onClose: () => void
  teeTime: {
    id: string
    start_time: string
    end_time: string
    price: number
    available_spots: number
    simulator: number
    potentialTimeSlots: Array<{ start_time: string; end_time: string }>
  }
  potentialSlots: {
    id: string
    start_time: string
    end_time: string
    price: number
    available_spots: number
    simulator: number
    potentialTimeSlots: Array<{ start_time: string; end_time: string }>
  }[]
  onBookingComplete: () => void
}

export function BookingModal({ isOpen, onClose, teeTime, potentialSlots, onBookingComplete }: BookingModalProps) {
  console.log('Received potential slots:', potentialSlots);
  console.log('TeeTime:', teeTime);
  console.log('TeeTime Data:', teeTime);

  const { user } = useUser()
  const [duration, setDuration] = useState(30)
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClientComponentClient()
  const { toast } = useToast()
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [users, setUsers] = useState<Array<{ id: string, full_name: string }>>([])
  const [isNewUser, setIsNewUser] = useState(false)
  const [newUserName, setNewUserName] = useState('')
  const [newUserEmail, setNewUserEmail] = useState('')
  const [newUserPhone, setNewUserPhone] = useState('')

  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase
        .from('users')
        .select('id, first_name, last_name')
        .order('last_name')
      
      if (data && !error) {
        const usersWithFullName = data.map(user => ({
          id: user.id,
          full_name: `${user.first_name} ${user.last_name}`.trim()
        }))
        setUsers(usersWithFullName)
      }
    }

    if (isOpen) {
      fetchUsers()
    }
  }, [isOpen, supabase])

  const handleBooking = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to book a simulator.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsLoading(true)
      
      let bookingUserId = selectedUserId

      if (isNewUser) {
        const { data: newUser, error: userError } = await supabase
          .from('users')
          .insert({
            full_name: newUserName,
            email: newUserEmail,
            phone: newUserPhone,
          })
          .select('id')
          .single()

        if (userError || !newUser) {
          throw new Error('Failed to create new user')
        }

        bookingUserId = newUser.id
      }

      if (!bookingUserId) {
        throw new Error('No user selected')
      }

      if (!potentialSlots || potentialSlots.length === 0) {
        throw new Error('No potential time slots available')
      }

      const timeSlotsToBook = potentialSlots.slice(0, duration / 30)

      for (const slot of timeSlotsToBook) {
        const { error: bookingError } = await supabase
          .from('bookings')
          .insert({
            teetime_id: teeTime.id,
            user_id: bookingUserId,
            booked_spots: 1,
            start_time: slot.start_time,
            end_time: slot.end_time,
            simulator: teeTime.simulator,
          })

        if (bookingError) throw bookingError
      }

      toast({
        title: "Success!",
        description: "Your simulator time has been booked.",
        variant: "default",
        className: "bg-white dark:bg-gray-800",
      })
      
      onBookingComplete()
      onClose()
    } catch (error) {
      console.error('Booking error:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to book simulator. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white dark:bg-gray-900">
        <DialogHeader>
          <DialogTitle>Book Simulator</DialogTitle>
          <DialogDescription>
            {format(new Date(teeTime.start_time), 'EEEE, MMMM d, yyyy h:mm a')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>User</Label>
            <Select
              value={isNewUser ? "new" : selectedUserId || ""}
              onValueChange={(value) => {
                if (value === "new") {
                  setIsNewUser(true)
                  setSelectedUserId(null)
                } else {
                  setIsNewUser(false)
                  setSelectedUserId(value)
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select user" />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.full_name}
                  </SelectItem>
                ))}
                <SelectItem value="new">New User</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isNewUser && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="Enter full name"
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="Enter email"
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  type="tel"
                  value={newUserPhone}
                  onChange={(e) => setNewUserPhone(e.target.value)}
                  placeholder="Enter phone number"
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Duration</Label>
            <Select
              value={duration.toString()}
              onValueChange={(value) => setDuration(parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select duration" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 6 }, (_, index) => {
                  const minutes = (index + 1) * 30;
                  return (
                    <SelectItem key={minutes} value={minutes.toString()}>
                      {minutes / 60} hour{minutes > 30 ? 's' : ''}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          
          <div className="text-sm text-muted-foreground">
            Total Price: ${((teeTime.price * duration) / 30).toFixed(2)}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleBooking} disabled={isLoading}>
            {isLoading ? "Booking..." : "Confirm Booking"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 