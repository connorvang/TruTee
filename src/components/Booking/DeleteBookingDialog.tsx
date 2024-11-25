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
  teeTime: { available_spots: number; booked_spots: number }
) => {
  const supabase = createClientComponentClient();

  // Start a transaction
  const { error: bookingError } = await supabase
    .from('bookings')
    .delete()
    .eq('id', bookingId);

  if (bookingError) throw bookingError;

  // Update tee time available spots
  const { error: updateError } = await supabase
    .from('tee_times')
    .update({
      available_spots: teeTime.available_spots + totalSpots,
      booked_spots: teeTime.booked_spots - totalSpots
    })
    .eq('id', teeTimeId);

  if (updateError) throw updateError;
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