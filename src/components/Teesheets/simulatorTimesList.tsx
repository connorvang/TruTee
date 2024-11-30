"use client"

import { ChevronLeft, ChevronRight, PlusCircle, Users, ChevronDown, Circle, CarFront, Footprints } from 'lucide-react'
import { useEffect, useState } from 'react'
import { format } from "date-fns";
import { BookingModal } from '../Booking/simulatorBookingModal'
import { DeleteBookingDialog } from '../Booking/DeleteBookingDialog'

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { useTeeTimes } from '@/hooks/useTeeTimes'
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
  simulator: number;
  tee_time_bookings: {
    bookings: {
      id: string;
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

// Update the grouping function
const groupTeeTimesBySimulator = (teeTimes: TeeTime[], numberOfSimulators: number) => {
  const grouped = new Map<number, TeeTime[]>();
  
  // Initialize empty arrays for each simulator
  for (let i = 1; i <= numberOfSimulators; i++) {
    grouped.set(i, []);
  }
  
  // Group tee times by simulator number
  teeTimes.forEach(teeTime => {
    // Check if tee_time_bookings exists and is an array
    if (teeTime.tee_time_bookings && Array.isArray(teeTime.tee_time_bookings)) {
      // For each booking in the tee time, create a copy of the tee time with that booking
      teeTime.tee_time_bookings.forEach(booking => {
        const simulatorNumber = booking.simulator;
        const simulatorTimes = grouped.get(simulatorNumber) || [];
        const teeTimeCopy = {...teeTime, simulator: simulatorNumber};
        simulatorTimes.push(teeTimeCopy);
        grouped.set(simulatorNumber, simulatorTimes.sort((a, b) => 
          new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
        ));
      });
    }
    
    // If no bookings, use the tee time's simulator number
    if (!teeTime.tee_time_bookings?.length) {
      const simulatorTimes = grouped.get(teeTime.simulator) || [];
      simulatorTimes.push(teeTime);
      grouped.set(teeTime.simulator, simulatorTimes);
    }
  });
  
  return grouped;
};

// Function to check if a time slot is within a booking's duration
const isTimeSlotWithinBooking = (timeSlot: TeeTime, booking: Booking) => {
  const slotStart = new Date(timeSlot.start_time).getTime();
  const slotEnd = new Date(timeSlot.end_time).getTime();
  const bookingStart = new Date(booking.start_time).getTime();
  const bookingEnd = new Date(booking.end_time).getTime();

  return slotStart >= bookingStart && slotEnd <= bookingEnd;
};

export default function SimulatorTimesList() {
  const [currentWeek, setCurrentWeek] = useState(47);
  const [currentYear, setCurrentYear] = useState(2024);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedDay, setSelectedDay] = useState<string>("");
  const [selectedTeeTime, setSelectedTeeTime] = useState<TeeTime | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedBookedTeeTime, setSelectedBookedTeeTime] = useState<TeeTime | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [nowPosition, setNowPosition] = useState<number | null>(null);
  const [intervalMinutes, setIntervalMinutes] = useState<number>(30);

  const { teeTimes, loading: loadingTeeTimes, numberOfSimulators } = useTeeTimes(date);

  // Update week and selected day when date changes
  useEffect(() => {
    if (date) {
      setCurrentWeek(getWeekNumber(date));
      setCurrentYear(date.getFullYear());
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
    const interval = setInterval(updateNowPosition, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [date, teeTimes, intervalMinutes]);


  if (loadingTeeTimes) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-pulse">Loading course information...</div>
      </div>
    );
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

  const handleBookingClick = (teeTime: TeeTime, simulatorNumber: number) => {
    const completeTeeTime: Required<TeeTime> = {
      ...teeTime,
      bookings: teeTime.bookings.map(booking => ({
        ...booking,
        start_time: booking.start_time || teeTime.start_time,
        end_time: booking.end_time || teeTime.end_time,
      }))
    };

    // Calculate potential slots for the next 3 hours
    const potentialSlots = uniqueTimeSlots.filter(slot => {
      const slotTime = new Date(slot.start_time).getTime();
      const teeTimeStart = new Date(teeTime.start_time).getTime();
      const threeHoursLater = teeTimeStart + 3 * 60 * 60 * 1000; // 3 hours in milliseconds

      return slotTime >= teeTimeStart && slotTime < threeHoursLater;
    });

    console.log('Potential Slots:', potentialSlots);

    setSelectedTeeTime({ ...completeTeeTime, simulator: simulatorNumber, potentialSlots });
    setIsBookingModalOpen(true);
  };

  const handleDeleteBookingClick = (teeTime: TeeTime, booking: Booking) => {
    const typedTeeTime: TeeTime = {
      ...teeTime,
      bookings: teeTime.bookings.map(b => ({
        ...b,
        simulator: b.simulator || booking.simulator
      }))
    };
    
    setSelectedBookedTeeTime(typedTeeTime);
    setSelectedBooking(booking);
    setIsDeleteDialogOpen(true);
  };

  // Calculate total available and booked spots
  const totalAvailableSpots = teeTimes.reduce((sum, teeTime) => sum + teeTime.available_spots, 0);
  const totalBookedSpots = teeTimes.reduce((sum, teeTime) => sum + teeTime.booked_spots, 0);

  // Group tee times by simulator number
  const groupedTeeTimes = groupTeeTimesBySimulator(teeTimes, numberOfSimulators);
  console.log('Grouped tee times:', Object.fromEntries(groupedTeeTimes));

  // Get unique time slots
  const uniqueTimeSlots = Array.from(new Set(teeTimes.map(t => t.start_time)))
    .map(startTime => teeTimes.find(t => t.start_time === startTime))
    .filter((t): t is TeeTime => t !== undefined)
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

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

      {/* Bay Headers - Single row at the top */}
      <div className="flex px-6 border-b border-gray-100">
          <div className="w-32 pr-4" /> {/* Spacer for time column */}
          <div className={`flex-1 grid grid-cols-${numberOfSimulators} gap-2`}>
            {Array.from({ length: numberOfSimulators }, (_, i) => (
              <div key={i} className="text-sm font-medium text-center py-2">
                Bay {i + 1}
              </div>
            ))}
          </div>
        </div>

      {/* Tee times */}
      <div className="relative px-6">
        <div className="flex-1 flex">
          {/* Time column - Now using uniqueTimeSlots */}
          <div className="w-32 flex-none">
            {uniqueTimeSlots.map((item) => (
              item && (
                <div key={item.id} className="h-12 p-1">
                  <div className="h-full flex items-center justify-end pr-4 text-sm font-medium text-gray-600">
                    {format(new Date(item.start_time), "h:mm a")}
                  </div>
                </div>
              )
            ))}
          </div>

          {/* Bay columns */}
          {Array.from({ length: numberOfSimulators }, (_, bayIndex) => {
            const simulatorNumber = bayIndex + 1;
            const simulatorTeeTimes = groupedTeeTimes.get(simulatorNumber) || [];
            
            return (
              <div key={bayIndex} className="flex-1 flex flex-col">
                {uniqueTimeSlots.map((timeSlot) => {
                  if (timeSlot) {
                    const matchingTeeTime = simulatorTeeTimes.find(t => 
                      t.start_time === timeSlot.start_time
                    );
                    const booking = matchingTeeTime?.tee_time_bookings[0]?.bookings;
                    const isBooked = Boolean(booking);

                    // Check if the current time slot is within any booking's duration
                    const isWithinBooking = booking && isTimeSlotWithinBooking(timeSlot, booking);

                    // Only render the slot if it's not within a booking's duration
                    if (!isWithinBooking) {
                      return (
                        <div key={`${timeSlot.id}-${simulatorNumber}`} className="h-12 p-1">
                          <div className={`h-full rounded-md overflow-hidden ${
                            isBooked ? "bg-gray-900" : "bg-gray-100 border border-gray-200"
                          }`}>
                            {isBooked && booking ? (
                              <button
                                className="w-full h-full px-2 text-white hover:bg-gray-700 flex items-center justify-between min-w-0"
                                onClick={() => handleDeleteBookingClick(matchingTeeTime!, booking)}
                              >
                                <div className="flex items-center shrink-0 gap-1">
                                  {booking.has_cart ? <CarFront size={16} /> : <Footprints size={16} />}
                                  <span className="text-xs font-bold w-4">
                                    {booking.number_of_holes}
                                  </span>
                                </div>
                                <span className="text-sm text-left font-medium truncate flex-1 pl-1">
                                  {`${booking.users.first_name} ${booking.users.last_name} (${
                                    booking.users.handicap < 0 
                                      ? `+${Math.abs(booking.users.handicap)}` 
                                      : booking.users.handicap
                                  })`}
                                </span>
                              </button>
                            ) : (
                              <button
                                className="w-full h-full flex items-center justify-center hover:bg-gray-200"
                                onClick={() => handleBookingClick(timeSlot, simulatorNumber)}
                              >
                                <PlusCircle className="text-gray-500" size={16} />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    }
                  }
                })}
              </div>
            );
          })}
        </div>
      </div>

      {selectedTeeTime && (
        <BookingModal
          isOpen={isBookingModalOpen}
          onClose={() => setIsBookingModalOpen(false)}
          teeTime={selectedTeeTime}
          potentialSlots={selectedTeeTime?.potentialSlots || []}
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
    </Tabs>
  </div>
  )
}

