import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { format, parse } from 'date-fns'
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useUser } from "@clerk/nextjs"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Drawer, DrawerHeader, DrawerContent, DrawerTitle } from '@/components/ui/drawer'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useIsMobile } from "@/hooks/use-mobile"

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
    id: string;
      start_time: string;
      start_date: string;
      end_time: string;
      end_date: string;
      price: number;
      simulator: number;
      available_spots: number;
      booked_spots: number;
      green_fee_18: number;
      green_fee_9: number;
      cart_fee_18: number;
      cart_fee_9: number;
      organizations: {
        id: string;
        name: string;
        golf_course: boolean;
        image_url: string;
      };
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
  const isMobile = useIsMobile()

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

  const HeaderContent = () => (
    <div className="relative p-4 rounded-lg shadow-md mb-4 bg-cover bg-center"
      style={{ backgroundImage: `url(${teeTime.organizations.image_url})` }}
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
          {teeTime.organizations.name}
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
            <SelectTrigger className="w-[248px]">
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
              Green fees (${((numberOfHoles === 18 ? teeTime.green_fee_18 : teeTime.green_fee_9) ?? 0).toFixed(2)} × {numberOfSpots})
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
        <Button size="lg" onClick={handleEdit} disabled={isLoading}>
          {isLoading ? "Saving changes..." : "Confirm booking changes"}
        </Button>
        <Button size="lg" variant="outline" onClick={onClose}>Cancel</Button>
      </div>
    </>
  )

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={onClose}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle className="hidden">Book time</DrawerTitle>
              <HeaderContent />
          </DrawerHeader>
          <div className="px-4">
            <BookingContent />
          </div>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="bg-white dark:bg-gray-900 sm:min-w-[560px]">
        <SheetHeader>
          <SheetTitle className="mb-2 font-medium">Edit tee time</SheetTitle>
            <HeaderContent />
        </SheetHeader>
        <BookingContent />
      </SheetContent>
    </Sheet>
  )
}