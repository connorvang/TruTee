"use client"

import { LandPlot, PlusCircle, Lock } from 'lucide-react'
import { useEffect, useState } from 'react'
import { format } from "date-fns"
import { BookingModal } from '../Booking/simulatorBookingModal'
import { useUser } from '@clerk/nextjs'
import { DeleteBookingDialog } from '../Booking/DeleteBookingDialog'
import { getSimulatorTimes } from '@/actions/getSimulatorTimes'
import DateNavigation from '../dateNavigation'

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
  guests: number;
  users: {
    handicap: number;
    first_name: string;
    last_name: string;
  }
}

interface TeeTime {
  id: string;
  start_date: string;
  start_time: string;
  end_date: string;
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
  <div className="flex items-center border-b pl-6 pr-4 py-2 border-gray-100 animate-pulse">
    <div className="w-26 pr-4 text-sm font-small text-right">
      <div className="h-4 bg-gray-100 rounded w-full"></div>
    </div>
    <div className="flex flex-1 space-x-2">
      {Array.from({ length: 4 }).map((_, idx) => (
        <div key={idx} className="flex-1 h-8 bg-gray-100 border border-gray-200 rounded-md"></div>
      ))}
    </div>
  </div>
);

interface SimulatorTimesListProps {
  organizationId: string
  organizationName: string
  organizationImage: string
}

export default function SimulatorTimesList({ 
  organizationId,
  organizationName,
  organizationImage
}: SimulatorTimesListProps) {
  const [date, setDate] = useState<Date>(new Date())
  const [teeTimes, setTeeTimes] = useState<{ [key: number]: TeeTime[] }>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [selectedDay, setSelectedDay] = useState<string>("");
  const [selectedTeeTime, setSelectedTeeTime] = useState<TeeTime | null>(null)
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false)
  const [selectedBookedTeeTime, setSelectedBookedTeeTime] = useState<TeeTime | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [nowPosition, setNowPosition] = useState<number | null>(null);
  const [intervalMinutes, setIntervalMinutes] = useState<number>(30);
  const { user } = useUser();
  const currentDateTime = new Date();

  useEffect(() => {
    setIntervalMinutes(30);
  }, []);
  
  useEffect(() => {
    if (date) {
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
      const isToday = now.toDateString() === date.toDateString();

      if (!isToday) {
        setNowPosition(null);
        return;
      }

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

  useEffect(() => {
    if (!date || !organizationId) {
      setLoading(false);
      return;
    }

    const fetchSimulatorTimes = async () => {
      setLoading(true);
      try {
        const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const response = await getSimulatorTimes(localDate, organizationId);
        setTeeTimes(response.teeTimes);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch simulator times'));
      } finally {
        setLoading(false);
      }
    };

    fetchSimulatorTimes();
  }, [date, organizationId]);




  const handleBookingClick = (item: TeeTime) => {
    const availableSlots: TeeTime[] = [];
    let totalDuration = 0;
    const startIndex = teeTimes[item.simulator].findIndex(slot => slot.id === item.id);

    for (let i = startIndex; i < teeTimes[item.simulator].length; i++) {
      const slot = teeTimes[item.simulator][i];
      if (totalDuration >= 180 || availableSlots.length >= 6) break; // Limit to 3 hours or 6 slots
      if (slot.tee_time_bookings.length > 0) break; // Stop if there's a booking

      availableSlots.push(slot as TeeTime);
      totalDuration += (new Date(slot.end_time).getTime() - new Date(slot.start_time).getTime()) / 60000;
    }

    setSelectedTeeTime({ ...item, consecutive_slots: availableSlots });
    setIsBookingModalOpen(true);
  };

  const handleDeleteBookingClick = (teeTime: TeeTime, booking: Booking) => {
    // Find consecutive slots that belong to this booking
    const startIndex = teeTimes[teeTime.simulator].findIndex(slot => slot.id === teeTime.id);
    const consecutiveSlots = [];
    
    // Look for consecutive slots with the same booking
    for (let i = startIndex; i < teeTimes[teeTime.simulator].length; i++) {
      const slot = teeTimes[teeTime.simulator][i];
      if (slot.tee_time_bookings[0]?.bookings.id === booking.id) {
        consecutiveSlots.push(slot);
      } else {
        break; // Stop when we find a slot that doesn't belong to this booking
      }
    }

    // Add consecutive slots to the teeTime object
    const teeTimeWithSlots = {
      ...teeTime,
      consecutive_slots: consecutiveSlots.length > 1 ? consecutiveSlots.slice(1) : undefined
    };

    setSelectedBookedTeeTime(teeTimeWithSlots as TeeTime);
    setSelectedBooking(booking);
    setIsDeleteDialogOpen(true);
  };

  const simulatorCount = Object.keys(teeTimes).length;

  return (
    <div className="p-0">

      <DateNavigation
        variant="compact"
        date={date}
        setDate={setDate}
        selectedDay={selectedDay}
        setSelectedDay={setSelectedDay}
        showWeather={false}
      />

      <div className="flex flex-col p-1 bg-gray-100 rounded-lg">

      <div className="flex flex-1 items-center flex-col justify-between px-1 py-1 bg-gray-100 rounded-lg">  
        {simulatorCount > 0 && (
          <div className="flex w-full pl-6 h-10 baysHeader">
            <div className="w-20 pr-4 text-sm font-small text-right"></div>
            {Object.keys(teeTimes).map((simulator, index) => (
              <div
                key={simulator}
                className="flex flex-1 text-sm font-medium text-gray-900 justify-center items-center"
              >
                {`Bay ${index + 1}`}
              </div>
            ))}
          </div>
        )}
        </div>

        <div className="relative w-full bg-white rounded-md shadow-sm timeSlots">
          {loading ? (
            <div className="flex flex-col">
              {Array.from({ length: 10 }).map((_, idx) => (
                <Skeleton key={idx} />
              ))}
            </div>
          ) : !teeTimes || Object.keys(teeTimes).length === 0 || Object.values(teeTimes).every(times => !times || times.length === 0) ? (
            <div className="flex flex-col items-center justify-center gap-4 py-16 text-gray-500">
              <LandPlot size={32} />
              No sim times available for this date.
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
              <div className="flex flex-row">
                <div className="flex flex-col w-26">
                  {Array.from({ length: 48 }, (_, index) => {
                    const hour = Math.floor(index / 2);
                    const minutes = index % 2 === 0 ? '00' : '30';
                    return (
                      <div key={index} className="h-12 border-b w-26 pl-6 pr-4 border-gray-100 flex items-center justify-end text-sm font-small text-right">
                        {`${hour % 12 === 0 ? 12 : hour % 12}:${minutes} ${hour < 12 ? 'AM' : 'PM'}`}
                      </div>
                    );
                  })}
                </div>

                {Object.entries(teeTimes).map(([simulator, times]) => {
                  if (!Array.isArray(times)) return null;
                  if (times.length === 0) return null;

                  let skipSlots = 0;

                  return (
                    <div key={simulator} className="flex flex-1 flex-col">
                      {times.map((item: TeeTime, index: number) => {
                        if (skipSlots > 0) {
                          skipSlots--;
                          return null;
                        }

                        const bookingData = item.tee_time_bookings[0]?.bookings;
                        const isBooked = bookingData !== undefined;

                        // Create a Date object for the start time using the item's date and time
                        const [startYear, startMonth, startDay] = item.start_date.split('-').map(Number);
                        const [hours, minutes, seconds] = item.start_time.split(':').map(Number);
                        const startTime = new Date(startYear, startMonth - 1, startDay, hours, minutes, seconds);

                        // Check if the time is more than 30 minutes in the past
                        const isPast = (currentDateTime.getTime() - startTime.getTime()) > 30 * 60 * 1000;

                        if (isBooked) {
                          let consecutiveCount = 1;
                          for (let i = index + 1; i < times.length; i++) {
                            const nextBookingData = times[i].tee_time_bookings[0]?.bookings;
                            if (nextBookingData && nextBookingData.id === bookingData.id) {
                              consecutiveCount++;
                            } else {
                              break;
                            }
                          }
                          skipSlots = consecutiveCount - 1;
                        }

                        return (
                          <div
                            key={item.id}
                            className={`h-${isBooked ? 12 * (skipSlots + 1) : 12} min-h-12 py-2 border-b p-2 border-gray-100`}
                          >
                            <div className="flex-1 h-full">
                              {isBooked ? (
                                <button
                                  className={`w-full h-full px-2 py-[5px] rounded-md text-white bg-gray-900 border border-gray-500 hover:bg-gray-700 flex min-w-0 disabled:bg-gray-600 disabled:cursor-not-allowed disabled:hover:bg-gray-600 ${isPast ? 'bg-gray-300 cursor-not-allowed' : ''}`}
                                  onClick={() => {
                                    if (bookingData && bookingData.user_id === user?.id) {
                                      const booking: Booking = {
                                        ...bookingData,
                                        guests: 0,
                                      };
                                      handleDeleteBookingClick(item, booking);
                                    }
                                  }}
                                  disabled={bookingData.user_id !== user?.id || isPast}
                                >
                                  <span className="text-sm font-medium">
                                    {bookingData.user_id === user?.id ? (
                                      <div className="flex flex-col items-start">
                                        <span className="text-white">{user?.fullName}</span>
                                      </div>
                                    ) : (
                                      `Booked`
                                    )}
                                  </span>
                                </button>
                              ) : (
                                <button
                                  className={`w-full h-full flex items-center justify-center rounded-md border border-gray-200 bg-gray-100 ${isPast ? 'bg-gray-100 cursor-not-allowed hover:none' : 'hover:bg-gray-200'}`}
                                  onClick={() => handleBookingClick(item)}
                                  disabled={isPast}
                                >
                                  {isPast ? (
                                    <Lock className="text-gray-300" size={16} />
                                  ) : (
                                    <PlusCircle className="text-gray-500" size={16} />
                                  )}
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {selectedTeeTime && (
            <BookingModal
              isOpen={isBookingModalOpen}
              onClose={() => setIsBookingModalOpen(false)}
              teeTime={selectedTeeTime} 
              organizationId={organizationId}
              organizationName={organizationName}
              organizationImage={organizationImage}
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
    </div>
  )
}

