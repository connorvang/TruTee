"use client"

import { Users, CarFront, LandPlot, FlagIcon, Flag } from 'lucide-react'
import { useEffect, useState } from 'react'
import { format } from "date-fns"
import { BookingModal } from '../Booking/teetimeBookingModal'
import { useAuth, SignInButton, SignedIn, SignedOut } from "@clerk/nextjs";
import { Button } from "@/components/ui/button"
import { getTeeTimes, TeeTime } from '@/actions/getTeeTimes'
import DateNavigation from '@/components/dateNavigation'


interface TeeTimesListProps {
  organizationId: string;
  organizationName: string;
  organizationImage: string;
  initialTeeTimes: TeeTime[];
}

const Skeleton = () => (
  <div className="flex w-full items-center border-b px-6 py-4 border-gray-100 animate-pulse">
    <div className="w-20 pr-4">
      <div className="h-4 bg-gray-100 rounded w-16"></div>
    </div>
    <div className="flex-1 flex justify-between items-center">
      <div className="flex items-center gap-4">
        <div className="h-4 bg-gray-100 rounded w-24"></div>
      </div>
    </div>
    <div className="w-32 px-4">
      <div className="h-4 bg-gray-100 rounded w-20 ml-auto"></div>
    </div>
    <div className="w-32 px-4">
      <div className="h-4 bg-gray-100 rounded w-20 ml-auto"></div>
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

// Add this helper function near the other helper functions
const isTimeValid = (startTime: string, teeTimeDate: Date) => {
  const today = new Date();
  const teeTime = new Date(teeTimeDate);

    // If it's a past date, hide it
    if (teeTime.toDateString() < today.toDateString()) {
      return false;
    }
  
  // If the tee time is not today, show it
  if (teeTime.toDateString() !== today.toDateString()) {
    return true;
  }
  
  // For today's tee times, compare the time
  const [hours, minutes] = startTime.split(':').map(Number);
  const teeTimeHours = hours * 60 + minutes;
  const currentHours = today.getHours() * 60 + today.getMinutes();
  
  return teeTimeHours > currentHours;
};


export default function TeeTimesList({ 
  organizationId, 
  organizationName, 
  organizationImage, 
  initialTeeTimes,
}: TeeTimesListProps) {
  const [date, setDate] = useState<Date>(new Date())
  const [teeTimes, setTeeTimes] = useState<TeeTime[]>(initialTeeTimes)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [selectedDay, setSelectedDay] = useState<string>("");
  const [selectedTeeTime, setSelectedTeeTime] = useState<TeeTime | null>(null)
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false)
  const { isSignedIn } = useAuth();


  useEffect(() => {
    if (!date || !organizationId) {
      setLoading(false);
      return;
    }

    const fetchTeeTimes = async () => {
      setLoading(true);
      try {
        const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const { teeTimes } = await getTeeTimes(localDate, organizationId);
        setTeeTimes(teeTimes);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch tee times'));
      } finally {
        setLoading(false);
      }
    };

    fetchTeeTimes();
  }, [date, organizationId]);

  useEffect(() => {
    if (date) {
      setSelectedDay(format(date, "EEE"));
    }
  }, [date]);




  const handleBookingClick = (item: TeeTime) => {
    // Just log the raw date string from the database
    console.log('Selected Tee Time Date:', item.start_date);

    if (!isSignedIn) {
      const signIn = document.querySelector('[data-clerk-sign-in]');
      (signIn as HTMLElement)?.click();
      return;
    }
    
    setSelectedTeeTime(item);
    setIsBookingModalOpen(true);
  };


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

      <div className="flex items-center justify-between px-1 py-1 bg-gray-100 rounded-lg">

        <div className="relative flex-1 bg-white rounded-md shadow-sm">
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
          ) : (
            <>
              {(() => {
                const validTeeTimes = teeTimes.filter(item => isTimeValid(item.start_time, date));
                
                if (validTeeTimes.length === 0) {
                  return (
                    <div className="flex flex-col items-center justify-center gap-4 py-16 text-gray-500">
                      <LandPlot size={32} />
                      No tee times available for this date.
                    </div>
                  );
                }

                return validTeeTimes.map((item) => {
                  const availableSpots = 4 - item.booked_spots;
                  return (
                    <div key={item.id}>
                      <SignedIn>
                        <Button variant="ghost" size="lg" className="flex w-full items-center rounded-none border-b px-6 py-6 border-gray-100 font-normal" onClick={() => handleBookingClick(item)}>
                          <div className="w-20 pr-4 text-sm font-medium text-right">
                            {formatTo12Hour(item.start_time)}
                          </div>
                          <div className="flex-1 flex justify-between items-center">
                            <div className="flex items-center gap-4">
                              <span className="flex items-center align-middle justify-end gap-2 w-full px-4 text-sm text-black">
                                <Users size={16} /> {availableSpots} players
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center justify-end gap-2 w-32 px-4 text-sm text-black text-right">
                            <CarFront size={16} /> ${item.cart_fee_18?.toFixed(2) ?? 0}
                          </div>
                          <div className="flex items-center justify-end gap-2 w-32 px-4 text-sm text-black text-right">
                            <Flag size={16} /> ${item.green_fee_18?.toFixed(2) ?? 0}
                          </div>
                        </Button>
                      </SignedIn>
                      <SignedOut>
                        <SignInButton mode="modal">
                          <Button variant="ghost" size="lg" className="flex w-full items-center rounded-none border-b px-6 py-4 border-gray-100 font-normal" onClick={() => handleBookingClick(item)}>
                            <div className="w-20 pr-4 text-sm font-medium text-right">
                              {formatTo12Hour(item.start_time)}
                            </div>
                            <div className="flex-1 flex justify-between items-center">
                              <div className="flex items-center gap-4">
                                <span className="flex items-center justify-end gap-2 w-full px-4 text-sm text-black">
                                  <Users size={16} /> {availableSpots} players
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center justify-end gap-2 w-32 px-4 text-sm text-black text-right">
                              <CarFront size={16} /> ${item.cart_fee_18?.toFixed(2) ?? 0}
                            </div>
                            <div className="flex items-center justify-end gap-2 w-32 px-4 text-sm text-black text-right">
                              <FlagIcon size={16} /> ${item.green_fee_18?.toFixed(2) ?? 0}
                            </div>
                          </Button>
                        </SignInButton>
                      </SignedOut>
                    </div>
                  );
                });
              })()}
            </>
          )}

          {selectedTeeTime && (
            <BookingModal
              isOpen={isBookingModalOpen}
              onClose={() => setIsBookingModalOpen(false)}
              teeTime={selectedTeeTime}
              organizationName={organizationName}
              organizationImage={organizationImage}
              onBookingComplete={() => {
                setDate(new Date(date!));
              }}
            />
          )}
        </div>
      </div>
    </div>
  )
}

