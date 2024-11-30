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
    price: number
    available_spots: number
    end_time: string
  }
  onBookingComplete: () => void
}

export function BookingModal({ isOpen, onClose, teeTime, onBookingComplete }: BookingModalProps) {
  const { user } = useUser()
  const [numberOfSpots, setNumberOfSpots] = useState(1)
  const [numberOfHoles, setNumberOfHoles] = useState<9 | 18>(18)
  const [hasCart, setHasCart] = useState("true")
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

      const guests = Math.max(0, numberOfSpots - 1)

      // First, create the booking
      const { data: newBooking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          user_id: bookingUserId,
          number_of_holes: numberOfHoles,
          has_cart: hasCart === "true",
          guests: guests,
        })
        .select('id')
        .single()

      if (bookingError || !newBooking) {
        throw new Error('Failed to create booking')
      }

      // Then, create the join table entry
      const { error: joinError } = await supabase
        .from('tee_time_bookings')
        .insert({
          teetime_id: teeTime.id,
          booking_id: newBooking.id,
        })

      if (joinError) {
        // If join table creation fails, we should clean up the booking
        await supabase
          .from('bookings')
          .delete()
          .eq('id', newBooking.id)
        throw new Error('Failed to create tee time booking join')
      }

      // Update available spots
      const { error: updateError } = await supabase
        .from('tee_times')
        .update({
          available_spots: teeTime.available_spots - numberOfSpots,
        })
        .eq('id', teeTime.id)

      if (updateError) throw updateError

      toast({
        title: "Success!",
        description: "Your tee time has been booked.",
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
            <Label>Players</Label>
            <Select 
              value={numberOfSpots.toString()} 
              onValueChange={(value) => setNumberOfSpots(parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select players" />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4].map((num) => (
                  <SelectItem 
                    key={num} 
                    value={num.toString()}
                    disabled={num > teeTime.available_spots}
                  >
                    {num === 1 
                      ? '1 Player (No guests)' 
                      : `${num} Players (${num - 1} guest${num - 1 === 1 ? '' : 's'})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="text-sm text-muted-foreground">
              {numberOfSpots > 1 
                ? `Booking for 1 player + ${numberOfSpots - 1} guest${numberOfSpots - 1 === 1 ? '' : 's'}`
                : 'Booking for 1 player'}
            </div>
          </div>

          <div className="space-y-4">
      <div className="space-y-2">
        <Label>Holes</Label>
        <Select value={numberOfHoles.toString()} onValueChange={(value) => setNumberOfHoles(parseInt(value) as 9 | 18)}>
          <SelectTrigger>
            <SelectValue placeholder="Select holes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="9">9 Holes</SelectItem>
            <SelectItem value="18">18 Holes</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Cart</Label>
        <Select value={hasCart} onValueChange={(value) => setHasCart(value as 'walking' | 'cart')}>
          <SelectTrigger>
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="false">Walking</SelectItem>
            <SelectItem value="true">Cart</SelectItem>
          </SelectContent>
        </Select>
      </div>
          </div>
          
          <div className="text-sm text-muted-foreground">
            Total Price: ${(teeTime.price * numberOfSpots).toFixed(2)}
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