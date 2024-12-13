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
    start_date: string
    price: number
    available_spots: number
    end_time: string
    simulator: number
    consecutive_slots?: {
      id: string
      start_time: string
      end_time: string
      price: number
      simulator: number
    }[]
  }
  onBookingComplete: () => void
}

// Add this helper function to convert 24h to 12h format
const formatTo12Hour = (time24: string) => {
  const [hours, minutes] = time24.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12; // Convert 0 to 12 for midnight
  return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
};

export function BookingModal({ isOpen, onClose, teeTime, onBookingComplete }: BookingModalProps) {
  const { user } = useUser()
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClientComponentClient()
  const { toast } = useToast()
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [users, setUsers] = useState<Array<{ id: string, full_name: string }>>([])
  const [isNewUser, setIsNewUser] = useState(false)
  const [newUserName, setNewUserName] = useState('')
  const [newUserEmail, setNewUserEmail] = useState('')
  const [newUserPhone, setNewUserPhone] = useState('')
  const [selectedDuration, setSelectedDuration] = useState("30");

  const maxAvailableSlots = teeTime.consecutive_slots?.length || 1;

  const getDurationOptions = () => {
    const options = [];
    for (let i = 1; i <= maxAvailableSlots; i++) {
      const minutes = i * 30;
      const hours = minutes / 60;
      const label = hours >= 1 
        ? hours === 1 
          ? "1 hour" 
          : `${hours} hours` 
        : "30 minutes";
      
      options.push({
        value: minutes.toString(),
        label: label
      });
    }
    return options;
  };

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
        description: "You must be logged in to book a tee time.",
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

      const numberOfSlots = parseInt(selectedDuration) / 30;
      const slotsToBook = teeTime.consecutive_slots?.slice(0, numberOfSlots) || [teeTime];

      const { data: newBooking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          user_id: bookingUserId,
        })
        .select('id')
        .single();

      if (bookingError || !newBooking) {
        throw new Error('Failed to create booking')
      }

      const joinRecords = slotsToBook.map(slot => ({
        teetime_id: slot.id,
        booking_id: newBooking.id,
      }));

      const { error: joinError } = await supabase
        .from('tee_time_bookings')
        .insert(joinRecords);

      if (joinError) {
        await supabase
          .from('bookings')
          .delete()
          .eq('id', newBooking.id);
        throw new Error('Failed to create tee time booking joins')
      }

      const { error: updateError } = await supabase
        .from('tee_times')
        .update({ 
          available_spots: 0,
          booked_spots: 1
        })
        .in('id', slotsToBook.map(slot => slot.id));

      if (updateError) {
        throw new Error('Failed to update tee time availability')
      }

      toast({
        title: "Success!",
        description: `Your ${selectedDuration} minute simulator session has been booked.`,
        variant: "default",
        className: "bg-white dark:bg-gray-800",
      })
      
      onBookingComplete()
      onClose()
    } catch (error) {
      console.error('Booking error:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to book tee time. Please try again.",
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
          <DialogTitle>Book Tee Time</DialogTitle>
          <DialogDescription>
            {format(new Date(teeTime.start_date), 'MMM, d, yyyy')} {formatTo12Hour(teeTime.start_time)}
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

          <div className="space-y-2">
            <Label>Duration</Label>
            <Select
              value={selectedDuration}
              onValueChange={setSelectedDuration}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select duration" />
              </SelectTrigger>
              <SelectContent>
                {getDurationOptions().map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
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