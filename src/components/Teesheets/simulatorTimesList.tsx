"use client"

import { ChevronLeft, ChevronRight, ChevronDown, LandPlot, PlusCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { format } from "date-fns"
import { BookingModal } from '../Booking/simulatorBookingModal'
import { DeleteBookingDialog } from '../Booking/DeleteBookingDialog'

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import WeatherInfo from '../getWeather'
import { useSimulatorTimes } from '@/hooks/useSimulatorTimes'

// Helper function to get week number
const getWeekNumber = (date: Date) => {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
};

interface Booking {
  id: string;
  user_id: string;
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
  available_spots: number;
  booked_spots: number;
  simulator: number;
  consecutive_slots?: TeeTime[];
  tee_time_bookings: {
    id: string;
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

export default function TeeTimesList() {
  const [currentWeek, setCurrentWeek] = useState(47);
  const [currentYear, setCurrentYear] = useState(2024);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedDay, setSelectedDay] = useState<string>("");
  const [selectedTeeTime, setSelectedTeeTime] = useState<TeeTime | null>(null)
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false)
  const [selectedBookedTeeTime, setSelectedBookedTeeTime] = useState<TeeTime | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [nowPosition, setNowPosition] = useState<number | null>(null);
  const [intervalMinutes, setIntervalMinutes] = useState<number>(30);
  const { teeTimes, loading: loadingTeeTimes } = useSimulatorTimes(date);

  useEffect(() => {
    setIntervalMinutes(30);
  }, []);
  
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
      if (!date || Object.keys(teeTimes).length === 0) {
        setNowPosition(null);
        return;
      }

      const now = new Date();
      const firstTeeTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0); // 12:00 AM
      const lastTeeTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 30, 0); // 11:30 PM

      if (now < firstTeeTime || now > lastTeeTime) {
        setNowPosition(null);
        return;
      }

      const minutesSinceFirstTeeTime = (now.getTime() - firstTeeTime.getTime()) / 60000;
      setNowPosition(minutesSinceFirstTeeTime * 1.6);
    };

    updateNowPosition();
    const interval = setInterval(updateNowPosition, 60000);

    return () => clearInterval(interval);
  }, [date, teeTimes, intervalMinutes]);

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
      newDate.setDate(date.getDate() - 7);
      setDate(newDate);
    }
  };

  const handleNextWeek = () => {
    if (date) {
      const newDate = new Date(date);
      newDate.setDate(date.getDate() + 7);
      setDate(newDate);
    }
  };

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

  const handleBookingClick = (item: TeeTime) => {
    const availableSlots: TeeTime[] = [];
    let totalDuration = 0;
    const startIndex = teeTimes[item.simulator].findIndex(slot => slot.id === item.id);

    for (let i = startIndex; i < teeTimes[item.simulator].length; i++) {
      const slot = teeTimes[item.simulator][i];
      if (totalDuration >= 180) break; // Stop if we reach 3 hours
      if (slot.tee_time_bookings.length > 0) break; // Stop if there's a booking

      availableSlots.push(slot as TeeTime);
      totalDuration += (new Date(slot.end_time).getTime() - new Date(slot.start_time).getTime()) / 60000;
    }

    console.log('Booking clicked:', {
      simulator: item.simulator,
      time: format(new Date(item.start_time), 'h:mm a'),
      startTime: item.start_time,
      endTime: item.end_time,
      availableSlots
    });

    setSelectedTeeTime({ ...item, consecutive_slots: availableSlots });
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
          <Button 
            variant="outline" 
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
                    />
                  </PopoverContent>
                </Popover>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="flex items-center gap-8">

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
        <div className="flex pl-6 h-10 baysHeader">
          <div className="w-20 pr-4 text-sm font-small text-right"></div>
          <div className="flex flex-1 text-sm font-medium text-gray-800 justify-center items-center">Bay 1</div>
          <div className="flex flex-1 text-sm font-medium text-gray-800 justify-center items-center">Bay 2</div>
          
        </div>

        <div className="relative timeSlots">
          {loadingTeeTimes ? (
            <div className="flex flex-col">
              {Array.from({ length: 10 }).map((_, idx) => (
                <Skeleton key={idx} />
              ))}
            </div>
          ) : Object.keys(teeTimes).length === 0 ? (
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
            </>
          )}

          <div className="grid grid-cols-[auto_repeat(2,_1fr)]">

            {/* Time slots on the left */}
            <div className="flex flex-col">
              {Array.from({ length: 48 }, (_, index) => {
                const hour = Math.floor(index / 2);
                const minutes = index % 2 === 0 ? '00' : '30';
                return (
                  <div key={index} className="h-[49px] border-b w-26 pl-6 pr-4 border-gray-100 flex items-center justify-end text-sm font-small text-right">
                    {`${hour % 12 === 0 ? 12 : hour % 12}:${minutes} ${hour < 12 ? 'AM' : 'PM'}`}
                  </div>
                );
              })}
            </div>

  {/* Simulator columns */}
  {Object.entries(teeTimes).map(([simulator, times]) => (
    <div key={simulator} className="grid grid-rows-12 grid-flow-row">
      {times.map((item: TeeTime) => {
        const startTime = new Date(item.start_time);
        const endTime = new Date(item.end_time);
        const durationInMinutes = (endTime.getTime() - startTime.getTime()) / 60000;
        const slotSpan = Math.ceil(durationInMinutes / 30); // Calculate number of 30-minute slots

        return (
          <div
            key={item.id}
            className={`row-span-${slotSpan} border-b p-2 border-gray-100`}
          >
            <div className="flex-1">
              {(() => {
                const bookingData = item.tee_time_bookings[0]?.bookings;
                const isBooked = bookingData !== undefined;

                return (
                  <div
                    className={`h-8 rounded-md overflow-hidden ${
                      isBooked ? "bg-gray-900" : "bg-gray-100 border border-gray-200"
                    }`}
                  >
                    {isBooked ? (
                      <button
                        className="w-full h-full px-2 text-white hover:bg-gray-700 flex items-center content-start min-w-0"
                        onClick={() => {
                          if (bookingData) {
                            const booking: Booking = {
                              ...bookingData,
                              guests: 0, // or the appropriate number of guests
                            };
                            handleDeleteBookingClick(item, booking);
                          }
                        }}
                      >
                        <span className="text-sm text-left font-medium truncate ml-2 flex-1">
                          {`${bookingData?.users.first_name} ${bookingData?.users.last_name} (${
                            bookingData?.users.handicap < 0 
                              ? `+${Math.abs(bookingData.users.handicap)}` 
                              : bookingData?.users.handicap
                          })`}
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
              })()}
            </div>
          </div>
        );
      })}
    </div>
  ))}
</div>

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

