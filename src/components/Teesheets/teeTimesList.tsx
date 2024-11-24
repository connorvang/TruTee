"use client"

import { ChevronLeft, ChevronRight, PlusCircle, Users, ChevronDown, CircleDollarSign, CarFront, Circle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { format } from "date-fns";
import { BookingModal } from '../Booking/bookingModal'
import { DeleteBookingDialog } from '../Booking/DeleteBookingDialog'

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { getTeeTimes } from './teeTimesList.server'
import { useCourse } from '@/contexts/CourseContext'
import WeatherInfo from '../getWeather';


// Helper function to get week number
const getWeekNumber = (date: Date) => {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
};

interface TeeTime {
  id: string;
  start_time: string;
  price: number;
  available_spots: number;
  booked_spots: number;
  has_cart: boolean;
  number_of_holes: number;
}

export default function TeeTimesList() {
  const [currentWeek, setCurrentWeek] = useState(47);
  const [currentYear, setCurrentYear] = useState(2024);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedDay, setSelectedDay] = useState<string>("");
  const { activeCourse, isLoading } = useCourse()
  const [selectedTeeTime, setSelectedTeeTime] = useState<TeeTime | null>(null)
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false)
  const [teeTimes, setTeeTimes] = useState<TeeTime[]>([]);
  const [loadingTeeTimes, setLoadingTeeTimes] = useState<boolean>(true);
  const [selectedBookedTeeTime, setSelectedBookedTeeTime] = useState<TeeTime | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

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
    if (!date || !activeCourse?.id) return;

    const fetchTeeTimes = async () => {
      setLoadingTeeTimes(true);
      try {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);

        const fetchedTeeTimes = await getTeeTimes(startOfDay.toISOString(), activeCourse.id);
        if (!fetchedTeeTimes) throw new Error('No tee times returned');
        setTeeTimes(fetchedTeeTimes);
      } catch (error) {
        console.error('Error fetching tee times:', error);
      } finally {
        setLoadingTeeTimes(false);
      }
    };

    fetchTeeTimes();
  }, [date, activeCourse]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-pulse">Loading course information...</div>
      </div>
    )
  }

  if (!activeCourse) {
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
    if (currentWeek === 1) {
      setCurrentWeek(52);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentWeek(currentWeek - 1);
    }
  };

  const handleNextWeek = () => {
    if (currentWeek === 52) {
      setCurrentWeek(1);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentWeek(currentWeek + 1);
    }
  };

  // Helper function to render spots
  const renderSpots = (availableSpots: number, bookedSpots: number, hasCart: boolean, numberOfHoles: number) => {
    const totalSpots = availableSpots + bookedSpots;
    return Array.from({ length: totalSpots }, (_, index) => {
      const isBooked = index < bookedSpots;
      return { isBooked, hasCart, numberOfHoles };
    });
  }

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

  return (
    <div className="p-0">

    {/* Navigation */}
    <div className="flex items-center justify-between px-6 py-2 bg-background border-b border-gray-100">

      <div className="flex items-center gap-4">
        <Button variant="outline" className="h-8">Today</Button>
        <Separator orientation="vertical" className="h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>November 2024</BreadcrumbPage>
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
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 text-sm font-medium">
            <Circle className="flex text-gray-900" size={16} /> 52
          </div>
          <div className="flex items-center gap-1 text-sm font-medium">
            <Users className="text-gray-900" size={16} /> 24
          </div>
          <div className="flex items-center gap-1 text-sm font-medium">
            <CarFront className="text-gray-900" size={16} /> 2
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
          <Select>
            <SelectTrigger className="flex-1 h-8 gap-2">
              <SelectValue placeholder="Front 9" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="front-9">Front 9</SelectItem>
              <SelectItem value="back-9">Back 9</SelectItem>
            </SelectContent>
          </Select>
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
          <div className="flex items-center justify-center py-8">
            Loading tee times...
          </div>
        ) : (
          teeTimes.map((item) => (
            <div key={item.id} className="flex items-center border-b px-6 py-2 border-gray-100">
              <div className="w-24 pr-4 text-sm font-small text-right">
                {format(new Date(item.start_time), 'h:mm a')}
              </div>
              <div className="w-20 pr-4 text-sm font-small text-gray-600 text-right">
                ${item.price}
              </div>
              <div className="flex flex-1 space-x-2">
                {renderSpots(item.available_spots, item.booked_spots, item.has_cart, item.number_of_holes).map((spot, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center ${
                      spot.isBooked ? "justify-start" : "justify-center"
                    } flex-1 h-8 rounded-md ${
                      spot.isBooked
                        ? "bg-gray-900 text-white"
                        : "bg-gray-100 border border-gray-200"
                    }`}
                  >
                    {spot.isBooked ? (
                      <Button
                        variant="ghost"
                        className="w-full h-full p-2 bg-gray-900 text-white hover:bg-gray-800 hover:text-whiteflex justify-start"
                        onClick={() => {
                          setSelectedBookedTeeTime(item)
                          setIsDeleteDialogOpen(true)
                        }}
                      >
                        <CarFront className="mr-0" size={16} />
                        <CircleDollarSign className="mr-0" size={16} />
                        <span className="text-xs font-semibold mr-4 w-4 text-center">18</span>
                        <span className="text-sm font-medium">Player name</span>
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
                ))}
              </div>
            </div>
          ))
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

        {selectedBookedTeeTime && (
          <DeleteBookingDialog
            isOpen={isDeleteDialogOpen}
            onClose={() => setIsDeleteDialogOpen(false)}
            teeTime={selectedBookedTeeTime}
            onDeleteComplete={() => {
              setDate(new Date(date!))
            }}
          />
        )}
      </div>
    </Tabs>
  </div>
  )
}

