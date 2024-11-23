"use client"

import { ChevronLeft, ChevronRight, PlusCircle, Users, SunIcon, CloudIcon, CloudRainIcon, CloudSnowIcon, CloudLightningIcon, CloudFogIcon, MoonIcon, CloudMoonIcon, CloudSunIcon, ChevronDown, CircleDollarSign, CarFront, Circle } from 'lucide-react'
import { useEffect, useState, Suspense } from 'react'
import { format, isSameDay } from "date-fns";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { getTeeTimes } from './teeTimesList.server'
import { useCourse } from '@/contexts/CourseContext'

// Helper function to get week number - move this OUTSIDE and BEFORE the component
const getWeekNumber = (date: Date) => {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
};

export default function TeeTimesList() {
  const [currentWeek, setCurrentWeek] = useState(47);
  const [currentYear, setCurrentYear] = useState(2024);
  const [weather, setWeather] = useState({
    current: 66,
    high: 66,
    low: 32,
    weatherCode: 1100,
    isDay: true,
  });
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedDay, setSelectedDay] = useState<string>("");
  const { activeCourse, isLoading } = useCourse()

  // Update week and selected day when date changes
  useEffect(() => {
    if (date) {
      setCurrentWeek(getWeekNumber(date));
      setCurrentYear(date.getFullYear());
      setSelectedDay(format(date, "EEE"));
    }
  }, [date]); // Add date as dependency

  useEffect(() => {
    const controller = new AbortController();
    
    async function fetchWeather() {
      try {
        const lat = 37.1305;
        const lon = -113.5083;
        
        const [currentResponse, forecastResponse] = await Promise.all([
          fetch(
            `https://api.tomorrow.io/v4/weather/realtime?location=${lat},${lon}&apikey=${process.env.NEXT_PUBLIC_WEATHER_API_KEY}&units=imperial`,
            { signal: controller.signal }
          ),
          fetch(
            `https://api.tomorrow.io/v4/weather/forecast?location=${lat},${lon}&apikey=${process.env.NEXT_PUBLIC_WEATHER_API_KEY}&units=imperial`,
            { signal: controller.signal }
          )
        ]);

        const currentData = await currentResponse.json();
        const forecastData = await forecastResponse.json();

        setWeather({
          current: Math.round(currentData.data.values.temperature),
          high: Math.round(forecastData.timelines.daily[0].values.temperatureMax),
          low: Math.round(forecastData.timelines.daily[0].values.temperatureMin),
          weatherCode: currentData.data.values.weatherCode,
          isDay: currentData.data.values.isDay,
        });
      } catch (error: unknown) {
        if (error instanceof Error && error.name === 'AbortError') return;
        console.error('Error fetching weather:', error);
      }
    }

    fetchWeather();
    const interval = setInterval(fetchWeather, 1800000); // 30 minutes

    return () => {
      clearInterval(interval);
      controller.abort();
    };
  }, []); // Empty dependency array

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

  // Helper function to get the appropriate weather icon
  const getWeatherIcon = (code: number, isDay: boolean = true) => {
    // Tomorrow.io weather codes: https://docs.tomorrow.io/reference/data-layers-weather-codes
    switch (code) {
      // Clear
      case 1000:
        return isDay ? <SunIcon className="w-4 h-4 text-yellow-500" /> : 
                      <MoonIcon className="w-4 h-4 text-gray-400" />;
      // Partly Cloudy
      case 1100:
      case 1101:
      case 1102:
        return isDay ? <CloudSunIcon className="w-4 h-4 text-gray-400" /> : 
                      <CloudMoonIcon className="w-4 h-4 text-gray-400" />;
      // Mostly Cloudy, Cloudy
      case 1001:
        return <CloudIcon className="w-4 h-4 text-gray-500" />;
      // Rain, Drizzle
      case 4000:
      case 4001:
      case 4200:
      case 4201:
        return <CloudRainIcon className="w-4 h-4 text-blue-500" />;
      // Snow
      case 5000:
      case 5001:
      case 5100:
      case 5101:
        return <CloudSnowIcon className="w-4 h-4 text-blue-300" />;
      // Thunderstorm
      case 8000:
        return <CloudLightningIcon className="w-4 h-4 text-yellow-500" />;
      // Fog, Mist
      case 2000:
      case 2100:
        return <CloudFogIcon className="w-4 h-4 text-gray-400" />;
      default:
        return <SunIcon className="w-4 h-4 text-yellow-500" />;
    }
  };

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

  // Remove the tee times fetching useEffect and replace with server data
  const TeeTimes = async ({ date }: { date: Date }) => {
    const { activeCourse } = useCourse()
    
    // Prevent fetching if no active course
    if (!activeCourse?.id) {
      return (
        <div className="flex items-center justify-center py-8 text-gray-500">
          Please select a course to view tee times.
        </div>
      )
    }

    const MAX_RETRIES = 3;
    const RETRY_DELAY = 1000;

    const fetchTeeTimes = async (retryCount = 0) => {
      try {
        const teeTimes = await getTeeTimes(date.toISOString(), activeCourse.id)
        if (!teeTimes) throw new Error('No tee times returned')
        return teeTimes
      } catch (error) {
        if (retryCount >= MAX_RETRIES) throw error
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY))
        return fetchTeeTimes(retryCount + 1)
      }
    }

    try {
      const teeTimes = await fetchTeeTimes()
      
      return (
        <>
          {teeTimes.map((item) => (
            <div key={item.id} className="flex items-center border-b px-6 py-2 border-gray-100">
              <div className="w-24 pr-4 text-sm font-small text-right">
                {format(new Date(item.start_time), 'h:mm a')}
              </div>
              <div className="w-20 pr-4 text-sm font-small text-gray-600 text-right">
                ${item.price}
              </div>
              <div className="flex flex-1 space-x-2">
                {renderSpots(item.available_spots, item.booked_spots).map((spot, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center ${
                      spot.isBooked ? "justify-start" : "justify-center"
                    } flex-1 p-2 h-8 rounded-md ${
                      spot.isBooked
                        ? "bg-gray-900 text-white"
                        : "bg-gray-100 border border-gray-200"
                    }`}
                  >
                    {spot.isBooked ? (
                      <>
                        <CarFront className="mr-2" size={16} />
                        <CircleDollarSign className="mr-2" size={16} />
                        <span className="text-xs font-semibold mr-4 w-2 text-center">18</span>
                        <span className="text-sm font-medium">Player name</span>
                      </>
                    ) : (
                      <PlusCircle className="text-gray-500" size={16} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </>
      )
    } catch (error) {
      console.error('Error fetching tee times:', error)
      return (
        <div className="flex items-center justify-center py-8 text-gray-500">
          Unable to load tee times. Please try again later.
        </div>
      )
    }
  }

  // Helper function to render spots
  const renderSpots = (availableSpots: number, bookedSpots: number) => {
    const totalSpots = availableSpots + bookedSpots
    return Array.from({ length: totalSpots }, (_, index) => {
      const isBooked = index < bookedSpots
      return { isBooked }
    })
  }

  // Helper function to get a date from a day in the current week
  const getDateFromDay = (dayShort: string) => {
    // Calculate the first day of the year
    const firstDayOfYear = new Date(currentYear, 0, 1);
    // Calculate the first day of the current week
    const firstDayOfWeek = new Date(currentYear, 0, 1 + (currentWeek - 1) * 7 - firstDayOfYear.getDay());
    
    const daysMap: { [key: string]: number } = {
      "Sun": 0, "Mon": 1, "Tue": 2, "Wed": 3, 
      "Thu": 4, "Fri": 5, "Sat": 6
    };
    
    const newDate = new Date(firstDayOfWeek);
    newDate.setDate(firstDayOfWeek.getDate() + daysMap[dayShort]);
    return newDate;
  };

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
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-lg font-semibold">
            {getWeatherIcon(weather.weatherCode, weather.isDay)}
            {weather.current}°
          </span>
          <div className="flex flex-col items-center gap-0">
            <span className="text-xs font-medium text-gray-800">{weather.high}°</span>
            <span className="text-xs text-gray-800">{weather.low}°</span>
          </div>
        </div>

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
      {weekdays.map((day) => (
        <TabsContent key={day.dayShort} value={day.dayShort}>
          <div className="relative">
            {date && isSameDay(new Date(), date)}
            
            <Suspense fallback={
              <div className="flex items-center justify-center py-8">
                Loading tee times...
              </div>
            }>
              {date && <TeeTimes date={date} />}
            </Suspense>
          </div>
        </TabsContent>
      ))}
    </Tabs>
  </div>
  )
}

