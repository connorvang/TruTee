"use client"

import { ChevronLeft, ChevronRight, PlusCircle, Users, ChevronDown, CarFront, Circle, LandPlot, Footprints } from 'lucide-react'
import { useEffect, useState } from 'react'
import { format } from "date-fns"
import { BookingModal } from '@/components/Booking/admin/adminTeetimeBookingModal'
import { DeleteBookingDialog } from '@/components/Booking/DeleteBookingDialog'

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { useTeeTimes } from '@/hooks/admin/useTeeTimes'
import WeatherInfo from '../../getWeather'

// Helper function to get week number
const getWeekNumber = (date: Date): number => {
  const target = new Date(date);
  const firstDayOfYear = new Date(target.getFullYear(), 0, 1);
  
  // Get the first Sunday of the year
  const firstSunday = new Date(firstDayOfYear);
  while (firstSunday.getDay() !== 0) {
    firstSunday.setDate(firstSunday.getDate() + 1);
  }
  
  // If the date is before the first Sunday, it's week 1
  if (target < firstSunday) {
    return 1;
  }
  
  // Calculate the number of weeks
  const daysSinceFirstSunday = Math.floor((target.getTime() - firstSunday.getTime()) / (24 * 60 * 60 * 1000));
  return Math.floor(daysSinceFirstSunday / 7) + 2; // Add 2 because: +1 for zero-based to one-based, +1 for the partial first week
};

interface Booking {
  id: string;
  user_id: string;
  number_of_holes: number;
  has_cart: boolean;
  guests: number;
  users: {
    handicap: number;
    first_name: string;
    last_name: string;
  }
}

interface TeeTime {
  id: string;
  start_time: string;
  end_time: string;
  price: number;
  green_fee_18: number;
  green_fee_9: number;
  cart_fee_18: number;
  cart_fee_9: number;
  available_spots: number;
  booked_spots: number;
  tee_time_bookings: {
    bookings: {
      id: string;
      guests: number;
      has_cart: boolean;
      number_of_holes: number;
      user_id: string;
      users: {
        handicap: number;
        first_name: string;
        last_name: string;
      }
    }
  }[];
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
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedDay, setSelectedDay] = useState<string>("");
  const [selectedTeeTime, setSelectedTeeTime] = useState<TeeTime | null>(null)
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false)
  const [selectedBookedTeeTime, setSelectedBookedTeeTime] = useState<TeeTime | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [nowPosition, setNowPosition] = useState<number | null>(null);
  const [intervalMinutes, setIntervalMinutes] = useState<number>(10);
  const { teeTimes, loading: loadingTeeTimes } = useTeeTimes(date)

  useEffect(() => {
    if (teeTimes.length < 2) return;
    
    const time1 = new Date(teeTimes[0].start_time);
    const time2 = new Date(teeTimes[1].start_time);
    const actualInterval = (time2.getTime() - time1.getTime()) / 60000;
    
    setIntervalMinutes(actualInterval);
  }, [teeTimes]);

  useEffect(() => {
    if (date) {
      setSelectedDay(format(date, "EEE"));
    }
  }, [date]);

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
    const interval = setInterval(updateNowPosition, 60000);

    return () => clearInterval(interval);
  }, [date, teeTimes, intervalMinutes]);

  const getWeekDates = (currentDate: Date) => {
    // Clone the date to avoid modifying the original
    const date = new Date(currentDate);
    
    // Get Sunday of the current week
    const day = date.getDay();
    const diff = -day; // Adjust to get Sunday (no need for special case now)
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() + diff);
    
    return Array.from({ length: 7 }, (_, i) => {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      return {
        dayShort: day.toLocaleDateString('en-US', { weekday: 'short' }),
        date: day.getDate()
      };
    });
  };

  const weekdays = getWeekDates(date || new Date());

  const handlePreviousWeek = () => {
    if (date) {
      const newDate = new Date(date);
      const day = newDate.getDay();
      const daysSinceLastSunday = day === 0 ? 7 : day; // Calculate days since last Sunday
      newDate.setDate(newDate.getDate() - daysSinceLastSunday - 7); // Move to the previous week's Sunday
      setDate(newDate);
    }
  };

  const handleNextWeek = () => {
    if (date) {
      const newDate = new Date(date);
      const day = newDate.getDay();
      const daysUntilNextMonday = (7 - day) % 7 || 7; // Calculate days until next Monday
      newDate.setDate(newDate.getDate() + daysUntilNextMonday);
      setDate(newDate);
    }
  };

  const getDateFromDay = (dayShort: string) => {
    const targetDate = date || new Date();
    const day = targetDate.getDay();
    const diff = -day; // Adjust to get Sunday
    const startOfWeek = new Date(targetDate);
    startOfWeek.setDate(targetDate.getDate() + diff);
    
    const daysMap: { [key: string]: number } = {
      "Sun": 0, "Mon": 1, "Tue": 2, "Wed": 3, 
      "Thu": 4, "Fri": 5, "Sat": 6
    };
    
    const newDate = new Date(startOfWeek);
    newDate.setDate(startOfWeek.getDate() + daysMap[dayShort]);
    return newDate;
  };

  const handleBookingClick = (item: TeeTime) => {
    setSelectedTeeTime(item);
    setIsBookingModalOpen(true);
  };

  const handleDeleteBookingClick = (teeTime: TeeTime, booking: Booking) => {
    setSelectedBookedTeeTime(teeTime);
    setSelectedBooking(booking);
    setIsDeleteDialogOpen(true);
  };

  return (
    <div className="p-0">
      <div className="flex items-center justify-between px-6 py-2 bg-background border-b border-gray-100">
        <div className="flex items-center gap-4">
          <Button variant="outline" 
            className="h-8" 
            onClick={() => setDate(new Date())}
          >
            Today
          </Button>

          <Separator orientation="vertical" className="h-4" />

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
                      required
                    />
                  </PopoverContent>
                </Popover>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="flex items-center gap-8">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 text-sm font-medium">
              <Circle className="flex text-gray-900" size={16} />
              {teeTimes.reduce((total, item) => {
                const bookedSpots = item.tee_time_bookings.reduce((sum, booking) => 
                  sum + (booking.bookings ? 1 + booking.bookings.guests : 0), 0);
                return total + (4 - bookedSpots);
              }, 0)}
            </div>
            <div className="flex items-center gap-1 text-sm font-medium">
              <Users className="text-gray-900" size={16} />
              {teeTimes.reduce((total, item) => 
                total + item.tee_time_bookings.reduce((sum, booking) => 
                  sum + (booking.bookings ? 1 + booking.bookings.guests : 0), 0), 0)}
            </div>
          </div>

          <WeatherInfo />

          <Separator orientation="vertical" className="h-4" />
          
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
                  <span className="absolute left-8 bg-red-500 border border-red-600 text-white px-2 py-0.5 rounded-md text-xs font-bold">
                    Now
                  </span>
                  <div className="flex-1 ml-8 h-[1px] bg-red-500"></div>
                </div>
              )}

              {teeTimes.map((item) => (
                <div key={item.id} className="flex items-center border-b px-6 py-2 border-gray-100">
                  <div className="w-20 pr-4 text-sm font-small text-right">
                    {format(new Date(item.start_time), 'h:mm a')}
                  </div>
                  <div className="w-20 pr-4 text-sm font-small text-gray-600 text-right">
                    ${item.green_fee_18?.toFixed(2) ?? 0}
                  </div>
                  <div className="grid grid-cols-4 gap-2 flex-1">
                    {(() => {
                      const totalBookedSpots = item.tee_time_bookings.reduce((total, booking) => 
                        total + (booking.bookings ? 1 + booking.bookings.guests : 0), 0);

                      return Array.from({ length: 4 }, (_, idx) => {
                        const isBooked = idx < totalBookedSpots;
                        const booking = item.tee_time_bookings[0]?.bookings;
                        const isGuest = booking ? idx > 0 && idx <= booking.guests : false;

                        return (
                          <div
                            key={idx}
                            className={`h-8 rounded-md overflow-hidden ${
                              isBooked
                                ? isGuest ? "bg-gray-500" : "bg-gray-900"
                                : "bg-gray-100 border border-gray-200"
                            }`}
                          >
                            {isBooked ? (
                              <button
                                className="w-full h-full px-2 text-white hover:bg-gray-700 flex items-center content-start min-w-0"
                                onClick={() => {
                                  if (booking) {
                                    handleDeleteBookingClick(item, booking);
                                  }
                                }}
                              >
                                <div className="flex items-center shrink-0 gap-1">
                                  {booking?.has_cart ? <CarFront size={16} /> : <Footprints size={16} />}
                                  <span className="text-xs font-bold w-4">
                                    {booking?.number_of_holes || 0}
                                  </span>
                                </div>
                                <span className="text-sm text-left font-medium truncate ml-2 flex-1">
                                  {isGuest 
                                    ? `Guest (0)` 
                                    : `${booking?.users.first_name} ${booking?.users.last_name} (${
                                        booking?.users.handicap < 0 
                                          ? `+${Math.abs(booking.users.handicap)}` 
                                          : booking?.users.handicap
                                      })`
                                  }
                                </span>
                              </button>
                            ) : (
                              <button
                                className="w-full h-full flex items-center justify-center hover:bg-gray-200"
                                onClick={() => handleBookingClick(item)}
                              >
                                <PlusCircle className="text-gray-500" size={16} />
                              </button>
                            )}
                          </div>
                        );
                      });
                    })()}
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

