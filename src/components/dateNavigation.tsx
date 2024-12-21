"use client"

import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react'
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import WeatherInfo from '@/components/getWeather'

// Helper functions
const getWeekNumber = (date: Date): number => {
  const target = new Date(date);
  const firstDayOfYear = new Date(target.getFullYear(), 0, 1);
  
  const firstSunday = new Date(firstDayOfYear);
  while (firstSunday.getDay() !== 0) {
    firstSunday.setDate(firstSunday.getDate() + 1);
  }
  
  if (target < firstSunday) {
    return 1;
  }
  
  const daysSinceFirstSunday = Math.floor((target.getTime() - firstSunday.getTime()) / (24 * 60 * 60 * 1000));
  return Math.floor(daysSinceFirstSunday / 7) + 2;
};

const getWeekDates = (currentDate: Date) => {
  const date = new Date(currentDate);
  const day = date.getDay();
  const diff = -day;
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

const getDateFromDay = (dayShort: string, currentDate: Date) => {
  const targetDate = currentDate;
  const day = targetDate.getDay();
  const diff = -day;
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

interface DateNavigationProps {
  date: Date;
  setDate: (date: Date) => void;
  selectedDay: string;
  setSelectedDay: (day: string) => void;
  showWeather?: boolean;
  variant: 'default' | 'compact';
}

export default function DateNavigation({
  date,
  setDate,
  selectedDay,
  setSelectedDay,
  showWeather = true,
  variant = 'default'
}: DateNavigationProps) {
  const weekdays = getWeekDates(date);

  const handlePreviousWeek = () => {
    if (date) {
      const newDate = new Date(date);
      const day = newDate.getDay();
      const daysSinceLastSunday = day === 0 ? 7 : day; // Calculate days since last Sunday
      newDate.setDate(newDate.getDate() - daysSinceLastSunday); // Move to the previous week's Sunday
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

  return (
    <>
      <div className={cn(
        "flex items-center justify-between bg-background border-b border-gray-100",
        variant === 'default' ? 'p-2 px-6' : 'pb-2 px-0 pr-0'
      )}>
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
                <BreadcrumbPage>{format(date, "MMMM yyyy")}</BreadcrumbPage>
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
                      onSelect={(newDate) => newDate && setDate(newDate)}
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
          {showWeather && (
            <>
              <WeatherInfo />
              <Separator orientation="vertical" className="h-4" />
            </>
          )}
          
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

      <Tabs value={selectedDay} className={cn("w-full", variant === 'default' ? 'px-6' : 'px-0')}>
        <TabsList className="flex my-2">
          {weekdays.map((day) => (
            <TabsTrigger 
              key={day.dayShort} 
              value={day.dayShort} 
              className="whitespace-nowrap flex-1"
              onClick={() => {
                setSelectedDay(day.dayShort);
                const newDate = getDateFromDay(day.dayShort, date);
                setDate(newDate);
              }}
            >
              {day.dayShort} {day.date}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </>
  )
}