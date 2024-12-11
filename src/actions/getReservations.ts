'use server'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

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
      available_spots: number;
      booked_spots: number;
      organizations: {
        id: string;
        name: string;
        golf_course: boolean;
        image_url: string;
      };
    };
  }[];
}

export async function getReservations(userId: string): Promise<Booking[]> {
  const supabase = createClientComponentClient()
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      tee_time_bookings (
        teetime_id,
        tee_times (
          id, 
          start_time, 
          end_time, 
          price, 
          simulator,
          available_spots,
          booked_spots,
          organizations (
            id,
            name,
            golf_course,
            image_url
          )
        )
      )
    `)
    .eq('user_id', userId)

  if (error) throw error
  return data as Booking[]
}