import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { format } from 'date-fns'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useUser } from "@clerk/nextjs"

interface BookingModalProps {
  isOpen: boolean
  onClose: () => void
  teeTime: {
    id: string
    start_time: string
    start_date: string
    green_fee_18: number
    cart_fee_18: number
    available_spots: number
    booked_spots: number
    end_time: string
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
  const [numberOfSpots, setNumberOfSpots] = useState(1)
  const [numberOfHoles, setNumberOfHoles] = useState<9 | 18>(18)
  const [hasCart, setHasCart] = useState("true")
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClientComponentClient()
  const { toast } = useToast()

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
      
      const guests = Math.max(0, numberOfSpots - 1)

      // Create the booking with the Clerk user's ID
      const { data: newBooking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          user_id: user.id, // Use Clerk user ID directly
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
          booked_spots: teeTime.booked_spots + numberOfSpots
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
            {format(new Date(teeTime.start_date), 'MMM, d, yyyy')} {formatTo12Hour(teeTime.start_time)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
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
            Total Price: ${(teeTime.green_fee_18 * numberOfSpots).toFixed(2)}
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