"use client";

import { useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { getReservations } from '@/actions/getReservations';
import { format, differenceInMinutes, parse } from 'date-fns';
import { Users, CarFront, Footprints, Flag } from 'lucide-react';
import Image from 'next/image';
import { DeleteBookingDialog } from '@/components/Booking/DeleteBookingDialog';
import { Button } from '../ui/button';
import { EditTeetimeModal } from '@/components/Booking/editTeetimeModal';

interface Booking {
  id: string;
  number_of_holes: number;
  has_cart: boolean;
  guests: number;
  created_at: string;
  updated_at: string;
  tee_time_bookings: {
    teetime_id: string;
    tee_times: {
      id: string;
      start_time: string;
      start_date: string;
      end_time: string;
      end_date: string;
      price: number;
      simulator: number;
      available_spots: number;
      booked_spots: number;
      green_fee_18: number;
      green_fee_9: number;
      cart_fee_18: number;
      cart_fee_9: number;
      organizations: {
        id: string;
        name: string;
        golf_course: boolean;
        image_url: string;
      };
      consecutive_slots?: {
        id: string;
        available_spots: number;
        booked_spots: number;
      }[];
    };
  }[];
}

// Add this helper function to convert 24h to 12h format
const formatTo12Hour = (time24: string) => {
  const [hours, minutes] = time24.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12; // Convert 0 to 12 for midnight
  return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
};

export default function UserBookingsClient() {
  const { user } = useUser();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  useEffect(() => {
    if (user) {
      getReservations(user.id)
        .then((data) => setBookings(data as Booking[]))
        .catch((err) => setError(err.message));
    }
  }, [user]);


  // Add these filtering functions
  const simulatorBookings = bookings.filter(booking => 
    booking.tee_time_bookings?.[0]?.tee_times?.simulator
  );
  
  const courseBookings = bookings.filter(booking => 
    booking.tee_time_bookings?.[0]?.tee_times && !booking.tee_time_bookings[0].tee_times.simulator
  );

  const handleDeleteComplete = () => {
    // Refresh the bookings list
    if (user) {
      getReservations(user.id)
        .then((data) => setBookings(data as Booking[]))
        .catch((err) => setError(err.message));
    }
  };

  return (
    <div className="p-4 pt-12 flex justify-center">
      <div className="max-w-7xl w-full">
        <h1 className="text-2xl font-bold mb-8">My reservations</h1>
          <div className="flex flex-col gap-12">

            {/* Simulator Bookings Section */}
            <div>
              <h2 className="text-xl font-semibold mb-3">Simulator sessions</h2>
              <div className="flex flex-col bg-gray-100 p-0.5 rounded-lg">
                <div className='flex flex-row px-6 py-4 text-sm font-medium text-gray-700'>
                  <div className='w-56 pr-4'>Time</div>
                  <div className='flex-1'>Location</div>
                  <div className='flex gap-4'>
                    <div className='w-32 px-4'>Duration</div>
                    <div className='w-32 px-4'></div>
                  </div>
                </div>

                <div className="flex flex-col bg-white border border-black/10 rounded-lg shadow-sm">
                  {simulatorBookings.length === 0 ? (
                    <p className="p-4 text-gray-500">No simulator bookings found.</p>
                  ) : (
                    simulatorBookings.map((booking) => {
                      const startTime = new Date(
                        `${booking.tee_time_bookings[0].tee_times.start_date}T${booking.tee_time_bookings[0].tee_times.start_time}`
                      );
                      const endTime = new Date(
                        `${booking.tee_time_bookings[booking.tee_time_bookings.length - 1].tee_times.end_date}T${booking.tee_time_bookings[booking.tee_time_bookings.length - 1].tee_times.end_time}`
                      );
                      const duration = differenceInMinutes(endTime, startTime);

                      return (
                        <div key={booking.id} className="flex w-full items-center border-b px-6 py-4 border-gray-100">
                          <div className="w-56 pr-4 text-sm font-medium">
                            {booking.tee_time_bookings?.[0]?.tee_times?.start_time ? 
                              format(parse(booking.tee_time_bookings[0].tee_times.start_date, 'yyyy-MM-dd', new Date()), 'MMM d, yyyy') + ' @ ' + formatTo12Hour(booking.tee_time_bookings[0].tee_times.start_time)
                              : 'Time not available'
                            }
                          </div>
                          
                          <div className="flex-1 flex items-center gap-4">
                            <Image 
                              src={booking.tee_time_bookings?.[0]?.tee_times?.organizations?.image_url || ''} 
                              alt={booking.tee_time_bookings?.[0]?.tee_times?.organizations?.name || ''} 
                              width={100} 
                              height={100} 
                              className='rounded-lg w-8 h-8 border border-black/10 shadow-sm' 
                            />
                            <span className="text-black">
                              {booking.tee_time_bookings?.[0]?.tee_times?.organizations?.name || 'Loading...'}
                            </span>
                          </div>

                          <div className='flex gap-4'>
                            <div className='w-32 px-4'>
                              {duration / 60} hours
                            </div>
                            <div className='w-32 px-4 flex justify-end'>
                            <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              console.log('Selected Booking:', booking);
                              console.log('Tee Time Details:', {
                                id: booking.tee_time_bookings[0].teetime_id,
                                available_spots: booking.tee_time_bookings[0].tee_times.available_spots,
                                booked_spots: booking.tee_time_bookings[0].tee_times.booked_spots,
                                consecutive_slots: booking.tee_time_bookings[0].tee_times.consecutive_slots,
                              });
                              setSelectedBooking(booking);
                              setIsDeleteDialogOpen(true);
                            }}
                            className="text-sm"
                          >
                            Cancel
                          </Button>
                            </div>
                          </div>

                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Course Bookings Section */}
            <div>
              <h2 className="text-xl font-semibold mb-3">Tee times</h2>
              <div className="flex flex-col bg-gray-100 p-0.5 rounded-lg">

                <div className='flex flex-row px-6 py-4 text-sm font-medium text-gray-700'>
                  <div className='w-56 pr-4'>Time</div>
                  <div className='flex-1'>Course</div>
                  <div className='flex gap-4'>
                    <div className='w-32 px-4'>Holes</div>
                    <div className='w-32 px-4'>Players</div>
                    <div className='w-32 px-4'>Cart</div>
                    <div className='w-32 px-4'></div>
                  </div>
                </div>

                <div className="flex flex-col bg-white border border-black/10 rounded-lg shadow-sm">
                  {courseBookings.length === 0 ? (
                    <p className="p-4 text-gray-500">No course bookings found.</p>
                  ) : (
                    courseBookings.map((booking) => (
                      <div key={booking.id} className="flex w-full items-center border-b px-6 py-4 border-gray-100">
                        <div className="w-56 pr-4 text-sm font-medium">
                          {booking.tee_time_bookings?.[0]?.tee_times?.start_time ? 
                              format(parse(booking.tee_time_bookings[0].tee_times.start_date, 'yyyy-MM-dd', new Date()), 'MMM d, yyyy') + ' @ ' + formatTo12Hour(booking.tee_time_bookings[0].tee_times.start_time)
                              : 'Time not available'
                          }
                        </div>
                        
                        <div className="flex-1 flex justify-between items-center">
                          {booking.tee_time_bookings.some(tb => tb.tee_times.simulator) ? (
                            // Simulator booking display
                            <div className="flex items-center gap-4">
                              <span className="text-blue-600">
                                Simulator {booking.tee_time_bookings[0].tee_times.simulator}
                              </span>
                              <span>
                                {format(new Date(booking.tee_time_bookings[booking.tee_time_bookings.length - 1].tee_times.end_time), 'h:mm a')}
                              </span>
                            </div>
                          ) : (

                            // Golf course booking display
                            <div className="flex items-center gap-4">
                              <Image src={booking.tee_time_bookings?.[0]?.tee_times?.organizations?.image_url || ''} alt={booking.tee_time_bookings?.[0]?.tee_times?.organizations?.name || ''} width={100} height={100} className='rounded-lg w-8 h-8 border border-black/10 shadow-sm' />
                              <span className="text-black">
                                {booking.tee_time_bookings?.[0]?.tee_times?.organizations?.name || 'Loading...'}
                              </span>
                            </div>

                          )}
                        </div>

                        <div className="flex items-center gap-4">

                          <div className="flex items-start gap-2 w-32 px-4 text-sm text-black">
                            <Flag size={16} /> {booking.number_of_holes} holes
                          </div>

                          <div className="flex items-start gap-2 w-32 px-4 text-sm text-black">
                            <Users size={16} /> {booking.guests + 1} players
                          </div>
                          <div className="flex items-start gap-2 w-32 px-4 text-sm text-black">
                            {booking.has_cart ? (
                              <CarFront size={16} className="text-gray-600" />
                            ) : (
                              <Footprints size={16} className="text-gray-600" />
                            )}
                            {booking.has_cart ? 'Cart' : 'Walking'}
                          </div>
                          <div className='w-32 px-4 flex justify-end gap-2'>
                            {!booking.tee_time_bookings[0].tee_times.simulator && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedBooking(booking);
                                  setIsEditDialogOpen(true);
                                }}
                                className="text-sm"
                              >
                                Edit
                              </Button>
                            )}
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                setSelectedBooking(booking);
                                setIsDeleteDialogOpen(true);
                              }}
                              className="text-sm"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

          </div>
      </div>
      {selectedBooking && (
        <DeleteBookingDialog
          isOpen={isDeleteDialogOpen}
          onClose={() => {
            setIsDeleteDialogOpen(false);
            setSelectedBooking(null);
          }}
          teeTime={{
            ...selectedBooking.tee_time_bookings[0].tee_times,
            id: selectedBooking.tee_time_bookings[0].teetime_id
          }}
          booking={selectedBooking}
          onDeleteComplete={handleDeleteComplete}
        />
      )}
      {selectedBooking && (
        <EditTeetimeModal
          isOpen={isEditDialogOpen}
          onClose={() => {
            setIsEditDialogOpen(false);
            setSelectedBooking(null);
          }}
          booking={selectedBooking}
          teeTime={{
            ...selectedBooking.tee_time_bookings[0].tee_times,
            id: selectedBooking.tee_time_bookings[0].teetime_id
          }}
          onEditComplete={handleDeleteComplete}
        />
      )}
    </div>
  );
} 