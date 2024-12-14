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
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Badge } from '@/components/ui/badge'

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

const formatTo12Hour = (time24: string) => {
  const [hours, minutes] = time24.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12;
  return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
};

export function BookingModal({ isOpen, onClose, teeTime, onBookingComplete }: BookingModalProps) {
  const { user } = useUser()
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClientComponentClient()
  const { toast } = useToast()
  const [selectedDuration, setSelectedDuration] = useState("30")
  const isMobile = useIsMobile()
  const [numberOfGuests, setNumberOfGuests] = useState(0)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [users, setUsers] = useState<Array<{ id: string, full_name: string }>>([])
  const [isNewUser, setIsNewUser] = useState(false)
  const [newUserName, setNewUserName] = useState('')
  const [newUserEmail, setNewUserEmail] = useState('')
  const [newUserPhone, setNewUserPhone] = useState('')

  const GUEST_FEE = 5.00;
  const maxAvailableSlots = teeTime.consecutive_slots?.length || 1;

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

  const handleBooking = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to book a simulator.",
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
          guests: numberOfGuests,
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
        description: `The ${selectedDuration} minute simulator session has been booked.`,
        variant: "default",
        className: "bg-white dark:bg-gray-800",
      })
      
      onBookingComplete()
      onClose()
    } catch (error) {
      console.error('Booking error:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to book simulator. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const HeaderContent = () => (
    <div className="relative rounded-lg mb-4 border p-4 border-gray-200">
      <div className="relative z-10 text-left">
        <div className="flex justify-between items-center">
          <div className="text-xl font-extrabold">
            {formatTo12Hour(teeTime.start_time)}
          </div>
          <div className="text-xl font-extrabold">
            <Badge variant="outline" className="border-gray-400">Bay {teeTime.simulator}</Badge>
          </div>
        </div>
        <div className="text-sm font-medium opacity-75">
          {format(parse(teeTime.start_date, 'yyyy-MM-dd', new Date()), 'EEEE, MMM d, yyyy')}
        </div>
      </div>
    </div>
  )

  const BookingContent = () => (
    <>
      <div className="space-y-4 pb-12 py-8 gap-4 flex flex-col">
        <div className="flex-row flex justify-between items-center gap-4">
          <div className="flex flex-col gap-2">
            <Label className="flex">Player</Label>
            <span className="text-sm text-gray-600">Select existing or create new</span>
          </div>
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
            <SelectTrigger className="w-48 md:w-[248px]">
              <SelectValue placeholder="Select player" />
            </SelectTrigger>
            <SelectContent>
              {users.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.full_name}
                </SelectItem>
              ))}
              <SelectItem value="new">New player</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isNewUser && (
          <div className="space-y-4">
            <div className="flex-row flex justify-between items-center gap-4">
              <Label className="opacity-0">Full Name</Label>
              <Input
                className="w-48 md:w-[248px]"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                placeholder="Enter full name"
              />
            </div>
            <div className="flex-row flex justify-between items-center gap-4">
              <Label className="opacity-0">Email</Label>
              <Input
                className="w-48 md:w-[248px]"
                type="email"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                placeholder="Enter email"
              />
            </div>
            <div className="flex-row flex justify-between items-center gap-4">
              <Label className="opacity-0">Phone</Label>
              <Input
                className="w-48 md:w-[248px]"
                type="tel"
                value={newUserPhone}
                onChange={(e) => setNewUserPhone(e.target.value)}
                placeholder="Enter phone number"
              />
            </div>
          </div>
        )}

        <div className="flex-row flex justify-between items-center gap-4">
          <div className="flex flex-col gap-2">
            <Label className="flex">Duration</Label>
            <span className="text-sm text-gray-600">How long would you like to play?</span>
          </div>
          <Select
            value={selectedDuration}
            onValueChange={setSelectedDuration}
          >
            <SelectTrigger className="w-32 md:w-[248px]">
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

        <div className="flex-row flex justify-between items-center gap-4">
          <div className="flex flex-col gap-2">
            <Label className="flex">Guests</Label>
            <span className="text-sm text-gray-600">Bringing others?</span>
          </div>
          <Select
            value={numberOfGuests.toString()}
            onValueChange={(value) => setNumberOfGuests(parseInt(value))}
          >
            <SelectTrigger className="w-48 md:w-[248px]">
              <SelectValue placeholder="Select guests" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">No guests</SelectItem>
              <SelectItem value="1">1 guest (${GUEST_FEE.toFixed(2)})</SelectItem>
              <SelectItem value="2">2 guests (+${(GUEST_FEE * 2).toFixed(2)})</SelectItem>
              <SelectItem value="3">3 guests (+${(GUEST_FEE * 3).toFixed(2)})</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator />

      <div className="space-y-4 py-12">
        <h3 className="text-md font-medium">Pricing details</h3>
        
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">
              Price (${teeTime.price.toFixed(2)} × {parseInt(selectedDuration) / 30})
            </span>
            <span>
              ${(teeTime.price * (parseInt(selectedDuration) / 30)).toFixed(2)}
            </span>
          </div>

          {numberOfGuests > 0 && (
            <div className="flex justify-between pb-2">
              <span className="text-gray-600">
                Guest fee
              </span>
              <span>
                ${(GUEST_FEE * numberOfGuests).toFixed(2)}
              </span>
            </div>
          )}

          <Separator />
          
          <div className="flex justify-between pt-2 font-medium">
            <span>Subtotal (USD)</span>
            <span>
              ${(
                (teeTime.price * (parseInt(selectedDuration) / 30)) + 
                (GUEST_FEE * numberOfGuests)
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
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle className="hidden">Book simulator</DrawerTitle>
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
          <SheetTitle className="mb-2 font-medium">Book tee time</SheetTitle>
          <HeaderContent />
        </SheetHeader>
        <BookingContent />
      </SheetContent>
    </Sheet>
  )
} 