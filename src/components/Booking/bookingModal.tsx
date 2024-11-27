import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { format } from 'date-fns'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

interface BookingModalProps {
  isOpen: boolean
  onClose: () => void
  teeTime: {
    id: string
    start_time: string
    price: number
    available_spots: number
  }
  onBookingComplete: () => void
}

export function BookingModal({ isOpen, onClose, teeTime, onBookingComplete }: BookingModalProps) {
  const [numberOfSpots, setNumberOfSpots] = useState(1)
  const [numberOfHoles, setNumberOfHoles] = useState<9 | 18>(18)
  const [hasCart, setHasCart] = useState<'walking' | 'cart'>('cart')
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClientComponentClient()
  const { toast } = useToast()

  const handleBooking = async () => {
    try {
      setIsLoading(true)
      const TEMP_GOLFER_ID = 'f342ec32-e010-4eb8-9d13-d8a4429d5d2b'
      const guests = numberOfSpots - 1

      // Insert booking with golfer and guests
      const { error: bookingError } = await supabase
        .from('bookings')
        .insert({
          teetime_id: teeTime.id,
          user_id: TEMP_GOLFER_ID,
          booked_spots: numberOfSpots,
          number_of_holes: numberOfHoles,
          has_cart: hasCart,
          guests: guests,
        })

      if (bookingError) throw bookingError

      // Update tee time available spots
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
        description: "Failed to book tee time. Please try again.",
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
            <Label>Players</Label>
            <Select 
              value={numberOfSpots.toString()} 
              onValueChange={(value) => setNumberOfSpots(parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select players" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: teeTime.available_spots }, (_, i) => i + 1).map((num) => (
                  <SelectItem key={num} value={num.toString()}>
                    {num} {num === 1 ? 'Player' : 'Players'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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