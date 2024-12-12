"use client";

import { useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { getReservations } from '@/actions/getReservations';
import { format, differenceInMinutes } from 'date-fns';
import { Users, CarFront, Footprints, Flag, Pencil } from 'lucide-react';
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
      end_time: string;
      price: number;
      simulator: number;
      organizations: {
        id: string;
        name: string;
        golf_course: boolean;
        image_url: string;
      };
      available_spots: number;
      booked_spots: number;
      consecutive_slots?: {
        id: string;
        available_spots: number;
        booked_spots: number;
      }[];
    };
  }[];
}

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
        .then((data) => setBookings(data))
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
        .then((data) => setBookings(data))
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
                      const startTime = new Date(booking.tee_time_bookings[0].tee_times.start_time);
                      const endTime = new Date(booking.tee_time_bookings[booking.tee_time_bookings.length - 1].tee_times.end_time);
                      const duration = differenceInMinutes(endTime, startTime);

                      return (
                        <div key={booking.id} className="flex w-full items-center border-b px-6 py-4 border-gray-100">
                          <div className="w-56 pr-4 text-sm font-medium">
                            {booking.tee_time_bookings?.[0]?.tee_times?.start_time ? 
                              format(new Date(booking.tee_time_bookings[0].tee_times.start_time), 'EEE, MMM do @ h:mmaa')
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
                            format(new Date(booking.tee_time_bookings[0].tee_times.start_time), 'EEE, MMM do @ h:mmaa')
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
            id: selectedBooking.tee_time_bookings[0].teetime_id,
            available_spots: selectedBooking.tee_time_bookings[0].tee_times.available_spots,
            booked_spots: selectedBooking.tee_time_bookings[0].tee_times.booked_spots,
            consecutive_slots: selectedBooking.tee_time_bookings[0].tee_times.consecutive_slots,
          }}
          booking={{
            id: selectedBooking.id,
            guests: selectedBooking.guests,
          }}
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
          booking={{
            id: selectedBooking.id,
            number_of_holes: selectedBooking.number_of_holes,
            has_cart: selectedBooking.has_cart,
            guests: selectedBooking.guests,
          }}
          teeTime={{
            id: selectedBooking.tee_time_bookings[0].teetime_id,
            start_time: selectedBooking.tee_time_bookings[0].tee_times.start_time,
            available_spots: selectedBooking.tee_time_bookings[0].tee_times.available_spots,
            booked_spots: selectedBooking.tee_time_bookings[0].tee_times.booked_spots,
          }}
          onEditComplete={handleDeleteComplete}
        />
      )}
    </div>
  );
} 