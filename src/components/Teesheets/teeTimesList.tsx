"use client"

import { ChevronLeft, ChevronRight, PlusCircle, Users, ChevronDown, CarFront, Circle, LandPlot, Footprints } from 'lucide-react'
import { useEffect, useState } from 'react'
import { format } from "date-fns";
import { BookingModal } from '../Booking/bookingModal'
import { DeleteBookingDialog } from '../Booking/DeleteBookingDialog'

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { getTeeTimes } from './teeTimesList.server'
import WeatherInfo from '../getWeather';


// Helper function to get week number
const getWeekNumber = (date: Date) => {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
};

interface Booking {
  id: string;
  user_id: string;
  number_of_holes: number;
  has_cart: boolean;
  guests: number;
  user: {
    handicap: number;
    first_name: string;
    last_name: string;
  }
}

interface TeeTime {
  id: string;
  start_time: string;
  price: number;
  available_spots: number;
  booked_spots: number;
  has_cart: boolean;
  number_of_holes: number;
  bookings: Booking[];
}

// Skeleton component
const Skeleton = () => (
  <div className="flex items-center border-b px-6 py-2 border-gray-100 animate-pulse">
    <div className="w-20 pr-4 text-sm font-small text-right">
      <div className="h-4 bg-gray-100 rounded w-full"></div>
    </div>
    <div className="w-20 pr-4 text-sm font-small text-gray-600 text-right">
      <div className="h-4 bg-gray-100 rounded w-full"></div>
    </div>
    <div className="flex flex-1 space-x-2">
      {Array.from({ length: 4 }).map((_, idx) => (
        <div key={idx} className="flex-1 h-8 bg-gray-100 border border-gray-200 rounded-md"></div>
      ))}
    </div>
  </div>
);

export default function TeeTimesList() {
  const [currentWeek, setCurrentWeek] = useState(47);
  const [currentYear, setCurrentYear] = useState(2024);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedDay, setSelectedDay] = useState<string>("");
  const activeOrganization = 'b4741620-74bc-4364-95c4-3b00be85e7f6';
  const isLoading = false;
  const [selectedTeeTime, setSelectedTeeTime] = useState<TeeTime | null>(null)
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false)
  const [teeTimes, setTeeTimes] = useState<TeeTime[]>([]);
  const [loadingTeeTimes, setLoadingTeeTimes] = useState<boolean>(true);
  const [selectedBookedTeeTime, setSelectedBookedTeeTime] = useState<TeeTime | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [nowPosition, setNowPosition] = useState<number | null>(null);
  const [intervalMinutes, setIntervalMinutes] = useState<number | null>(null);

  // Update week and selected day when date changes
  useEffect(() => {
    if (date) {
      setCurrentWeek(getWeekNumber(date));
      setCurrentYear(date.getFullYear());
      setSelectedDay(format(date, "EEE"));
    }
  }, [date]);



  // Fetch tee times when the date changes
  useEffect(() => {
    if (!date || !activeOrganization) return;

    const fetchTeeTimes = async () => {
      setLoadingTeeTimes(true);
      try {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);

        const fetchedTeeTimes = await getTeeTimes(startOfDay.toISOString());
        if (!fetchedTeeTimes) throw new Error('No tee times returned');
        setTeeTimes(fetchedTeeTimes);

        if (fetchedTeeTimes.length > 1) {
          const firstTeeTime = new Date(fetchedTeeTimes[0].start_time);
          const secondTeeTime = new Date(fetchedTeeTimes[1].start_time);
          const interval = (secondTeeTime.getTime() - firstTeeTime.getTime()) / 60000;
          setIntervalMinutes(interval);
        }
      } catch (error) {
        console.error('Error fetching tee times:', error);
      } finally {
        setLoadingTeeTimes(false);
      }
    };

    fetchTeeTimes();
  }, [date, activeOrganization]);

  useEffect(() => {
    if (intervalMinutes === null) return;

    const updateNowPosition = () => {
      if (!date || !teeTimes.length) {
        setNowPosition(null);
        return;
      }

      const now = new Date();
      const firstTeeTime = new Date(teeTimes[0].start_time);
      const lastTeeTime = new Date(teeTimes[teeTimes.length - 1].start_time);

      if (now < firstTeeTime || now > lastTeeTime) {
        setNowPosition(null);
        return;
      }

      const minutesSinceFirstTeeTime = (now.getTime() - firstTeeTime.getTime()) / 60000;
      const pixelsPerMinute = 49 / intervalMinutes;

      setNowPosition(minutesSinceFirstTeeTime * pixelsPerMinute);
    };

    updateNowPosition();
    const interval = setInterval(updateNowPosition, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [date, teeTimes, intervalMinutes]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-pulse">Loading course information...</div>
      </div>
    )
  }

  if (!activeOrganization) {
    return (
      <div className="flex items-center justify-center py-8 text-gray-500">
        Unable to load course information. Please try again later.
      </div>
    )
  }


  const getWeekDates = (week: number, year: number) => {
    const firstDayOfYear = new Date(year, 0, 1);
    const firstDayOfWeek = new Date(year, 0, 1 + (week - 1) * 7 - firstDayOfYear.getDay());
    
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(firstDayOfWeek);
      date.setDate(firstDayOfWeek.getDate() + i);
      return {
        dayShort: date.toLocaleDateString('en-US', { weekday: 'short' }),
        date: date.getDate()
      };
    });
  };

  const weekdays = getWeekDates(currentWeek, currentYear);

  const handlePreviousWeek = () => {
    if (date) {
      const newDate = new Date(date);
      newDate.setDate(date.getDate() - 7); // Subtract 7 days to go to the previous week
      setDate(newDate);
    }
  };

  const handleNextWeek = () => {
    if (date) {
      const newDate = new Date(date);
      newDate.setDate(date.getDate() + 7); // Add 7 days to go to the next week
      setDate(newDate);
    }
  };

  // Helper function to render spots
  const renderSpots = (availableSpots: number, bookedSpots: number) => {
    const totalSpots = availableSpots + bookedSpots;
    return Array.from({ length: totalSpots }, (_, index) => index < bookedSpots);
  };

  // Helper function to get a date from a day in the current week
  const getDateFromDay = (dayShort: string) => {
    const firstDayOfYear = new Date(currentYear, 0, 1);
    const firstDayOfWeek = new Date(currentYear, 0, 1 + (currentWeek - 1) * 7 - firstDayOfYear.getDay());
    
    const daysMap: { [key: string]: number } = {
      "Sun": 0, "Mon": 1, "Tue": 2, "Wed": 3, 
      "Thu": 4, "Fri": 5, "Sat": 6
    };
    
    const newDate = new Date(firstDayOfWeek);
    newDate.setDate(firstDayOfWeek.getDate() + daysMap[dayShort]);
    return newDate;
  };

  const handleBookingClick = (teeTime: TeeTime) => {
    setSelectedTeeTime(teeTime)
    setIsBookingModalOpen(true)
  }

  const handleDeleteBookingClick = (teeTime: TeeTime, booking: Booking) => {
    setSelectedBookedTeeTime(teeTime);
    setSelectedBooking(booking);
    setIsDeleteDialogOpen(true);
  };

  // Calculate total available and booked spots
  const totalAvailableSpots = teeTimes.reduce((sum, teeTime) => sum + teeTime.available_spots, 0);
  const totalBookedSpots = teeTimes.reduce((sum, teeTime) => sum + teeTime.booked_spots, 0);

  return (
    <div className="p-0">


    <div className="flex items-center justify-between px-6 py-2 bg-background border-b border-gray-100">
      <div className="flex items-center gap-4">
        
        {/* Today button */}
        <Button variant="outline" 
          className="h-8" 
          onClick={() => setDate(new Date())}
        >
          Today
        </Button>

        <Separator orientation="vertical" className="h-4" />

        {/* Date picker */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>{format(date!, "MMMM yyyy")}</BreadcrumbPage>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"ghost"}
                    className={cn(
                      "p-0 h-8 text-left font-normal hover:bg-transparent",
                      !date && "text-muted-foreground"
                    )}
                  >
                    {date ? `Week ${getWeekNumber(date)}` : <span>Pick a date</span>}
                    <ChevronDown size={16} />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Tee times info */}
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 text-sm font-medium">
            <Circle className="flex text-gray-900" size={16} /> {totalAvailableSpots}
          </div>
          <div className="flex items-center gap-1 text-sm font-medium">
            <Users className="text-gray-900" size={16} /> {totalBookedSpots}
          </div>
        </div>

        {/* Weather details */}
        <WeatherInfo />

        <Separator orientation="vertical" className="h-4" />
        
        {/* Week arrows navigation */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" className="w-8 h-8" onClick={handlePreviousWeek}>
              <ChevronLeft className="text-gray-500" size={16} />
            </Button>
            <Button variant="ghost" className="w-8 h-8" onClick={handleNextWeek}>
              <ChevronRight className="text-gray-500" size={16} />
            </Button>
          </div>
        </div>

      </div>
    </div>

    {/* Day tabs */}
    <Tabs value={selectedDay} className="w-full">
      <TabsList className="flex mx-6 my-2">
        {weekdays.map((day) => (
          <TabsTrigger 
            key={day.dayShort} 
            value={day.dayShort} 
            className="whitespace-nowrap flex-1"
            onClick={() => {
              setSelectedDay(day.dayShort);
              const newDate = getDateFromDay(day.dayShort);
              if (newDate) setDate(newDate);
            }}
          >
            {day.dayShort} {day.date}
          </TabsTrigger>
        ))}
      </TabsList>

      {/* Tee times */}
      <div className="relative">
        {loadingTeeTimes ? (
          <div className="flex flex-col">
            {Array.from({ length: 10 }).map((_, idx) => (
              <Skeleton key={idx} />
            ))}
          </div>
        ) : teeTimes.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-16 text-gray-500">
            <LandPlot size={32} />
            No tee times available for this date.
          </div>
        ) : (
          <>
            {nowPosition !== null && (
              <div
                className="absolute left-0 right-0 flex items-center"
                style={{ top: `${nowPosition}px` }}
              >
                <span className="absolute left-8 bg-red-500 text-white px-2 py-1 rounded-md text-xs font-bold">
                  Now
                </span>
                <div className="flex-1 ml-8 h-0.5 bg-red-500"></div>
              </div>
            )}

            {teeTimes.map((item) => (
              <div key={item.id} className="flex items-center border-b px-6 py-2 border-gray-100">
                <div className="w-20 pr-4 text-sm font-small text-right">
                  {format(new Date(item.start_time), 'h:mm a')}
                </div>
                <div className="w-20 pr-4 text-sm font-small text-gray-600 text-right">
                  ${item.price.toFixed(2)}
                </div>
                <div className="flex flex-1 space-x-2">
                  {renderSpots(item.available_spots, item.booked_spots).map((isBooked, idx) => {
                    const bookingIndex = Math.floor(idx / (item.bookings[0]?.guests + 1 || 1));
                    const booking = item.bookings[bookingIndex];
                    const isGuest = booking ? idx % (booking.guests + 1) !== 0 : false;
                    const playerName = booking && booking.user ? booking.user.first_name + " " + booking.user.last_name : "Player name";
                    const rawHandicap = booking && booking.user ? booking.user.handicap : 0.0;
                    const playerHandicap = rawHandicap < 0 ? `+${Math.abs(rawHandicap)}` : rawHandicap.toString();

                    return (
                      <div
                        key={idx}
                        className={`flex items-center ${
                          isBooked ? "justify-start" : "justify-center"
                        } flex-1 h-8 rounded-md ${
                          isBooked
                            ? isGuest ? "bg-gray-600 text-white" : "bg-gray-900 text-white"
                            : "bg-gray-100 border border-gray-200"
                        }`}
                      >
                        {isBooked ? (
                          <Button
                            variant="ghost"
                            className="w-full h-full p-2 hover:bg-gray-700 hover:text-white flex justify-start"
                            onClick={() => {
                              if (booking) {
                                handleDeleteBookingClick(item, booking);
                              }
                            }}
                          >
                            {booking?.has_cart ? <CarFront className="mr-0" size={16} /> : <Footprints className="mr-0" size={16} />}
                            
                            <span className="text-xs font-bold mr-2 w-4 text-center">
                              {booking?.number_of_holes || 0}
                            </span>
                            <span className="text-sm font-medium">
                              {isGuest ? `Guest (0)` : `${playerName} (${playerHandicap})`}
                            </span>
                  
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            className="w-full h-full p-0 hover:bg-gray-200"
                            onClick={() => handleBookingClick(item)}
                          >
                            <PlusCircle className="text-gray-500" size={16} />
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </>
        )}

        {selectedTeeTime && (
          <BookingModal
            isOpen={isBookingModalOpen}
            onClose={() => setIsBookingModalOpen(false)}
            teeTime={selectedTeeTime}
            onBookingComplete={() => {
              setDate(new Date(date!));
            }}
          />
        )}

        {selectedBookedTeeTime && selectedBooking && (
          <DeleteBookingDialog
            isOpen={isDeleteDialogOpen}
            onClose={() => setIsDeleteDialogOpen(false)}
            teeTime={selectedBookedTeeTime}
            booking={selectedBooking}
            onDeleteComplete={() => {
              setDate(new Date(date!));
            }}
          />
        )}
      </div>
    </Tabs>
  </div>
  )
}

