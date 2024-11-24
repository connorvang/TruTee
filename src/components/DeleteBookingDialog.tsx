import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useToast } from "@/hooks/use-toast"
import { useState } from "react"

interface DeleteBookingDialogProps {
  isOpen: boolean
  onClose: () => void
  teeTime: {
    id: string
    available_spots: number
    booked_spots: number
  }
  onDeleteComplete: () => void
}

export function DeleteBookingDialog({ isOpen, onClose, teeTime, onDeleteComplete }: DeleteBookingDialogProps) {
  const [isCancelling, setIsCancelling] = useState(false)
  const supabase = createClientComponentClient()
  const { toast } = useToast()

  const handleCancelBookings = async () => {
    try {
      setIsCancelling(true)

      // Delete all bookings for this tee time
      const { error: deleteError } = await supabase
        .from('bookings')
        .delete()
        .eq('teetime_id', teeTime.id)

      if (deleteError) throw deleteError

      // Update tee time to reset booked spots
      const { error: updateError } = await supabase
        .from('tee_times')
        .update({
          available_spots: teeTime.available_spots + teeTime.booked_spots,
          booked_spots: 0
        })
        .eq('id', teeTime.id)

      if (updateError) throw updateError

      toast({
        title: "Success!",
        description: "Bookings have been cancelled.",
        variant: "default",
        className: "bg-white dark:bg-gray-900",
      })

      onDeleteComplete()
      onClose()
    } catch (error) {
      console.error('Cancel booking error:', error)
      toast({
        title: "Error",
        description: "Failed to cancel bookings. Please try again.",
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
            Are you sure you want to cancel all bookings for this tee time? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleCancelBookings} disabled={isCancelling}>
            {isCancelling ? "Cancelling..." : "Confirm"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}