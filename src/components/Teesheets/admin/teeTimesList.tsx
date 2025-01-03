"use client"

import { PlusCircle, CarFront, LandPlot, Footprints } from 'lucide-react'
import { useEffect, useState } from 'react'
import { format } from "date-fns"
import { BookingModal } from '@/components/Booking/admin/adminTeetimeBookingModal'
import { DeleteBookingDialog } from '@/components/Booking/DeleteBookingDialog'
import { getTeeTimes, TeeTime } from '@/actions/getTeeTimes'
import { useOrganization } from '@clerk/nextjs'
import DateNavigation from '@/components/dateNavigation'

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

// Add this helper function to convert 24h to 12h format
const formatTo12Hour = (time24: string) => {
  const [hours, minutes] = time24.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12; // Convert 0 to 12 for midnight
  return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
};

export default function TeeTimesList() {
  const [date, setDate] = useState<Date>(new Date())
  const [selectedDay, setSelectedDay] = useState<string>("");
  const [selectedTeeTime, setSelectedTeeTime] = useState<TeeTime | null>(null)
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false)
  const [selectedBookedTeeTime, setSelectedBookedTeeTime] = useState<TeeTime | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [nowPosition, setNowPosition] = useState<number | null>(null);
  const [intervalMinutes, setIntervalMinutes] = useState<number>(10);
  const [teeTimes, setTeeTimes] = useState<TeeTime[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { organization } = useOrganization();
  const activeOrganization = organization?.id;

  useEffect(() => {
    if (!date || !activeOrganization) {
      setLoading(false);
      return;
    }

    const fetchTeeTimes = async () => {
      setLoading(true);
      try {
        const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const { teeTimes } = await getTeeTimes(localDate, activeOrganization);
        setTeeTimes(teeTimes);
        // Optionally handle numberOfSimulators if needed
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch tee times'));
      } finally {
        setLoading(false);
      }
    };

    fetchTeeTimes();
  }, [date, activeOrganization]);

  useEffect(() => {
    if (teeTimes.length < 2) return;
    
    const time1 = new Date(`2000-01-01T${teeTimes[0].start_time}`);
    const time2 = new Date(`2000-01-01T${teeTimes[1].start_time}`);
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
      const firstTeeTime = new Date(`${teeTimes[0].start_date}T${teeTimes[0].start_time}`);
      const lastTeeTime = new Date(`${teeTimes[teeTimes.length - 1].start_date}T${teeTimes[teeTimes.length - 1].start_time}`);

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
      
      <DateNavigation
        variant="default"
        date={date}
        setDate={setDate}
        selectedDay={selectedDay}
        setSelectedDay={setSelectedDay}
        showWeather={false}
      />

        <div className="relative">
          {loading ? (
            <div className="flex flex-col">
              {Array.from({ length: 10 }).map((_, idx) => (
                <Skeleton key={idx} />
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center gap-4 py-16 text-gray-500">
              <LandPlot size={32} />
              Error: {error.message}
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
                    {formatTo12Hour(item.start_time)}
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
    </div>
  )
}

