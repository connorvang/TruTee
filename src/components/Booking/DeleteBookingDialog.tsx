import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

interface DeleteBookingDialogProps {
  isOpen: boolean
  onClose: () => void
  teeTime: {
    id: string
    available_spots: number
    booked_spots: number
    consecutive_slots?: {
      id: string
      available_spots: number
      booked_spots: number
    }[]
  }
  booking: {
    id: string
    guests: number
  }
  onDeleteComplete: () => void
}

const deleteBooking = async (
  teeTimeId: string, 
  bookingId: string, 
  totalSpots: number,
  teeTime: { 
    available_spots: number; 
    booked_spots: number;
    consecutive_slots?: {
      id: string
      available_spots: number
      booked_spots: number
    }[] 
  }
) => {
  const supabase = createClientComponentClient();

  // Delete the booking
  const { error: bookingError } = await supabase
    .from('bookings')
    .delete()
    .eq('id', bookingId);

  if (bookingError) throw bookingError;

  // If there are consecutive slots, update all of them
  if (teeTime.consecutive_slots?.length) {
    const { error: updateError } = await supabase
      .from('tee_times')
      .update({
        available_spots: 1,
        booked_spots: 0
      })
      .in('id', [teeTimeId, ...teeTime.consecutive_slots.map(slot => slot.id)]);

    if (updateError) throw updateError;
  } else {
    // Regular tee time update
    const { error: updateError } = await supabase
      .from('tee_times')
      .update({
        available_spots: teeTime.available_spots + totalSpots,
        booked_spots: teeTime.booked_spots - totalSpots
      })
      .eq('id', teeTimeId);

    if (updateError) throw updateError;
  }
};

export function DeleteBookingDialog({ isOpen, onClose, teeTime, booking, onDeleteComplete }: DeleteBookingDialogProps) {
  const [isCancelling, setIsCancelling] = useState(false)
  const { toast } = useToast()


  const handleDeleteBooking = async () => {
    try {
      setIsCancelling(true)
      const totalSpots = booking.guests + 1; // Total spots = guests + main booker

      await deleteBooking(teeTime.id, booking.id, totalSpots, teeTime)

      toast({
        title: "Success",
        description: "Booking cancelled successfully.",
        variant: "default",
        className: 'bg-white dark:bg-gray-900'
      })
      
      onDeleteComplete()
      onClose()
    } catch (error) {
      console.error('Error deleting booking:', error)
      toast({
        title: "Error",
        description: "Failed to delete booking. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsCancelling(false)
    }
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="bg-white dark:bg-gray-900">
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel Bookings</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to cancel this booking? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Close</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleDeleteBooking} 
            disabled={isCancelling}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isCancelling ? "Deleting..." : "Cancel booking"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}