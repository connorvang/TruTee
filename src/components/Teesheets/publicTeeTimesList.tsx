"use client"

import { ChevronLeft, ChevronRight, PlusCircle, Users, ChevronDown, CarFront, Circle, LandPlot, Footprints } from 'lucide-react'
import { useEffect, useState } from 'react'
import { format } from "date-fns"
import { BookingModal } from '../Booking/teetimeBookingModal'
import { DeleteBookingDialog } from '../Booking/DeleteBookingDialog'

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { usePublicTeeTimes } from '@/hooks/usePublicTeeTimes'
import WeatherInfo from '../getWeather'

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


interface TeeTime {
  id: string;
  start_time: string;
  end_time: string;
  price: number;
  available_spots: number;
  booked_spots: number;
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

interface TeeTimesListProps {
  organizationId: string;
}

export default function TeeTimesList({ organizationId }: TeeTimesListProps) {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedDay, setSelectedDay] = useState<string>("");
  const [selectedTeeTime, setSelectedTeeTime] = useState<TeeTime | null>(null)
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false)
  const { teeTimes, loading: loadingTeeTimes } = usePublicTeeTimes(date, organizationId)



  useEffect(() => {
    if (date) {
      setSelectedDay(format(date, "EEE"));
    }
  }, [date]);


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


  return (
    <div className="p-0">
      <div className="flex items-center justify-between py-2 bg-background border-b border-gray-100">
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
        <TabsList className="flex my-2">
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

        <div className="flex items-center justify-between px-1 py-1 bg-gray-100 rounded-lg">

        <div className="relative flex-1 bg-white rounded-md shadow-sm">
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

              {teeTimes.map((item) => {
                const availableSpots = 4 - item.booked_spots;
                const isAvailable = availableSpots > 0;

                return (
                  <div key={item.id} className="flex items-center border-b px-6 py-2 border-gray-100">
                    <div className="w-20 pr-4 text-sm font-medium text-right">
                      {format(new Date(item.start_time), 'h:mm a')}
                    </div>
                    <div className="w-20 pr-4 text-sm text-gray-600 text-right">
                      ${item.price.toFixed(2)}
                    </div>
                    <div className="flex-1 flex justify-between items-center">
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-600">
                          {isAvailable ? `${availableSpots} spots available` : 'Fully booked'}
                        </span>
                      </div>
                      {isAvailable && (
                        <Button
                          size="sm"
                          variant={"outline"}
                          onClick={() => handleBookingClick(item)}
                        >
                          Book now
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
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
          </div>
        </div>
      </Tabs>
    </div>
  )
}

