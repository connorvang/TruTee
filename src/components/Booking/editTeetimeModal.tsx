import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { format } from 'date-fns'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useUser } from "@clerk/nextjs"

interface EditModalProps {
  isOpen: boolean
  onClose: () => void
  booking: {
    id: string
    number_of_holes: number
    has_cart: boolean
    guests: number
  }
  teeTime: {
    id: string
    start_date: string
    start_time: string
    available_spots: number
    booked_spots: number
  }
  onEditComplete: () => void
}

// Add this helper function to convert 24h to 12h format
const formatTo12Hour = (time24: string) => {
  const [hours, minutes] = time24.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12; // Convert 0 to 12 for midnight
  return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
};

export function EditTeetimeModal({ isOpen, onClose, booking, teeTime, onEditComplete }: EditModalProps) {
  const { user } = useUser()
  const [numberOfSpots, setNumberOfSpots] = useState(booking.guests + 1)
  const [numberOfHoles, setNumberOfHoles] = useState<9 | 18>(booking.number_of_holes as 9 | 18)
  const [hasCart, setHasCart] = useState(booking.has_cart.toString())
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClientComponentClient()
  const { toast } = useToast()

  const handleEdit = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to edit a tee time.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsLoading(true)
      
      const guests = Math.max(0, numberOfSpots - 1)
      const spotsDifference = numberOfSpots - (booking.guests + 1)

      // Update the booking
      const { error: bookingError } = await supabase
        .from('bookings')
        .update({
          number_of_holes: numberOfHoles,
          has_cart: hasCart === "true",
          guests: guests,
        })
        .eq('id', booking.id)

      if (bookingError) {
        throw new Error('Failed to update booking')
      }

      // Update available spots if the number of players changed
      if (spotsDifference !== 0) {
        const { error: updateError } = await supabase
          .from('tee_times')
          .update({
            available_spots: teeTime.available_spots - spotsDifference,
            booked_spots: teeTime.booked_spots + spotsDifference
          })
          .eq('id', teeTime.id)

        if (updateError) throw updateError
      }

      toast({
        title: "Success!",
        description: "Your tee time has been updated.",
        variant: "default",
        className: "bg-white dark:bg-gray-800",
      })
      
      onEditComplete()
      onClose()
    } catch (error) {
      console.error('Edit error:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update tee time. Please try again.",
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
          <DialogTitle>Edit Tee Time</DialogTitle>
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
                    disabled={num > (teeTime.available_spots + booking.guests + 1)}
                  >
                    {num === 1 
                      ? '1 Player' 
                      : `${num} Players`}
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
              <Select value={hasCart} onValueChange={(value) => setHasCart(value)}>
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
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleEdit} disabled={isLoading}>
            {isLoading ? "Updating..." : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 