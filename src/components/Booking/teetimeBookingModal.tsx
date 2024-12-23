import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { format, parse } from 'date-fns'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useUser } from "@clerk/nextjs"
import { useIsMobile } from "@/hooks/use-mobile"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { addOrganizationUser } from '@/actions/addOrganizationUser'

interface BookingModalProps {
  isOpen: boolean
  onClose: () => void
  teeTime: {
    id: string
    start_time: string
    start_date: string
    green_fee_18: number
    green_fee_9: number
    cart_fee_18: number
    cart_fee_9: number
    available_spots: number
    booked_spots: number
    end_time: string
  }
  onBookingComplete: () => void
  organizationName: string
  organizationImage: string
  organizationId: string
}

// Add this helper function to convert 24h to 12h format
const formatTo12Hour = (time24: string) => {
  const [hours, minutes] = time24.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12; // Convert 0 to 12 for midnight
  return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
};

export function BookingModal({ isOpen, onClose, teeTime, onBookingComplete, organizationName, organizationImage, organizationId }: BookingModalProps) {
  const { user } = useUser()
  const [numberOfSpots, setNumberOfSpots] = useState(1)
  const [numberOfHoles, setNumberOfHoles] = useState<9 | 18>(18)
  const [hasCart, setHasCart] = useState("true")
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClientComponentClient()
  const { toast } = useToast()
  const isMobile = useIsMobile()

  useEffect(() => {
    console.log('Tee Time Start Date:', teeTime.start_date);
    console.log('Formatted Date:', format(new Date(teeTime.start_date), 'EEEE, MMM d, yyyy'));
    console.log('Selected Tee Time:', teeTime);
  }, [teeTime.start_date, teeTime]);

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
          user_id: user.id,
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

      await addOrganizationUser(user.id, organizationId)

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

  const HeaderContent = () => (
    <div className="relative p-4 rounded-lg shadow-md mb-4 bg-cover bg-center"
      style={{ backgroundImage: `url(${organizationImage})` }}
    >
      <div className="absolute inset-0 from-black to-transparent bg-gradient-to-t rounded-lg"></div>
      <div className="relative z-10 text-white text-left">
        <div className="flex justify-between items-center">
          <div className="text-xl font-extrabold">
            {formatTo12Hour(teeTime.start_time)}
          </div>
        </div>
        <div className="text-sm font-medium mt-4 opacity-75">
          {format(parse(teeTime.start_date, 'yyyy-MM-dd', new Date()), 'EEEE, MMM d, yyyy')}
        </div>
        <div className="text-sm font-bold mt-1 opacity-90">
          {organizationName}
        </div>
      </div>
    </div>
  )

  const BookingContent = () => (
    <>
      <div className="space-y-4 pb-12 py-8 gap-4 flex flex-col">


        <div className="flex-row flex justify-between items-center gap-4">
          <div className="flex flex-col gap-2">
            <Label className="flex">Players</Label>
            <span className="text-sm text-gray-600">Must be 13 years or older</span>
          </div>
          <Select 
            value={numberOfSpots.toString()} 
            onValueChange={(value) => setNumberOfSpots(parseInt(value))}
          >
            <SelectTrigger className="w-40 md:w-[248px]">
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
                    ? '1 Player' 
                    : `${num} Players`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-row flex justify-between items-center gap-4">
          <div className="flex flex-col gap-2">
            <Label className="flex">Holes</Label>
            <span className="text-sm text-gray-600">How many holes will you be playing?</span>
          </div>
          <Tabs value={numberOfHoles.toString()} onValueChange={(value) => setNumberOfHoles(parseInt(value) as 9 | 18)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="18">18</TabsTrigger>
              <TabsTrigger value="9">9</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="flex-row flex justify-between items-center gap-4">
          <div className="flex flex-col gap-2">
            <Label className="flex">Cart</Label>
            <span className="text-sm text-gray-600">Are you going to be using a cart?</span>
          </div>
          <Tabs defaultValue={hasCart} onValueChange={(value) => setHasCart(value)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="true">Yes</TabsTrigger>
              <TabsTrigger value="false">No</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <Separator />

      {/* Purchase Details Section */}
      <div className="space-y-4 py-12">
        <h3 className="text-md font-medium">Pricing details</h3>
        
        <div className="space-y-2 text-sm">
          {/* Green fees row */}
          <div className="flex justify-between">
            <span className="text-gray-600">
              Green fees (${(numberOfHoles === 18 ? teeTime.green_fee_18 : teeTime.green_fee_9).toFixed(2)} × {numberOfSpots})
            </span>
            <span>
              ${((numberOfHoles === 18 ? teeTime.green_fee_18 : teeTime.green_fee_9) * numberOfSpots).toFixed(2)}
            </span>
          </div>


          {/* Cart fee row */}
          <div className="flex justify-between pb-2">
            <span className="text-gray-600">Cart fee</span>
            <span>
              {hasCart === "true" ? (
                `$${((numberOfHoles === 18 ? teeTime.cart_fee_18 : teeTime.cart_fee_9) * numberOfSpots).toFixed(2)}`
              ) : (
                "$0.00"
              )}
            </span>
          </div>

          <Separator />
          {/* Total row */}
          <div className="flex justify-between pt-2 font-medium">
            <span>Subtotal (USD)</span>
            <span>
              ${(
                (numberOfHoles === 18 ? teeTime.green_fee_18 : teeTime.green_fee_9) * numberOfSpots +
                (hasCart === "true" ? (numberOfHoles === 18 ? teeTime.cart_fee_18 : teeTime.cart_fee_9) * numberOfSpots : 0)
              ).toFixed(2)}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-500 text-xs">*Sales tax will be calculated at checkout if applicable.</span>
          </div>

        </div>
      </div>

      <div className="flex flex-col gap-2 pb-12">
        <Button size="lg" onClick={handleBooking} disabled={isLoading}>
          {isLoading ? "Booking..." : "Confirm booking"}
        </Button>
        <Button size="lg" variant="outline" onClick={onClose}>Cancel</Button>
      </div>
    </>
  )

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={onClose}>
        <DrawerContent className='h-full max-h-[90vh]'>
        <ScrollArea>
          <DrawerHeader>
            <DrawerTitle className="hidden">Book tee time</DrawerTitle>
              <HeaderContent />
          </DrawerHeader>
          <div className="px-4 py-0">
              <BookingContent />
          </div>
          </ScrollArea>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="bg-white dark:bg-gray-900 sm:min-w-[560px] h-full max-h-[100vh] px-0 py-0">
        <ScrollArea className="h-full">
        <SheetHeader className="pt-8 px-8">
          <SheetTitle className="mb-2 font-medium">Book tee time</SheetTitle>
            <HeaderContent />
        </SheetHeader>
        <div className="px-8 py-0">
          <BookingContent />
        </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
} 