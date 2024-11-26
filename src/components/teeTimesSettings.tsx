"use client"

import { useState, useEffect, useCallback } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { useCourse } from '@/contexts/CourseContext'
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { useToast } from '@/hooks/use-toast'
import { addDays, startOfDay } from 'date-fns'

interface TeeTimeSettings {
  id?: string
  interval_minutes: number
  first_tee_time: string
  last_tee_time: string
  booking_days_in_advance: number
  price: number
}

export default function TeeTimeSettings() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const { toast } = useToast()
  const { activeCourse } = useCourse()
  
  const [settings, setSettings] = useState<TeeTimeSettings>({
    interval_minutes: 10,
    first_tee_time: '06:00',
    last_tee_time: '18:00',
    booking_days_in_advance: 7,
    price: 69.00,
  })

  const [priceInput, setPriceInput] = useState(settings.price.toFixed(2))

  useEffect(() => {
    async function loadSettings() {
      if (!activeCourse?.id) return;

      const { data } = await supabase
        .from('tee_time_settings')
        .select('*')
        .eq('course_id', activeCourse.id)
        .single();

      if (data) {
        setSettings({
          ...data,
          first_tee_time: data.first_tee_time?.substring(0, 5) || '06:00',
          last_tee_time: data.last_tee_time?.substring(0, 5) || '18:00',
          interval_minutes: data.interval_minutes || 10,
          booking_days_in_advance: data.booking_days_in_advance || 7,
          price: data.price || 69.00,
        });
        setPriceInput(data.price.toFixed(2));
      }
    }

    loadSettings();
  }, [activeCourse?.id, supabase]);

  const generateTeeTimes = useCallback(async () => {
    if (!activeCourse?.id) return;
    
    const daysToGenerate = settings.booking_days_in_advance;
    const startDate = addDays(startOfDay(new Date()), 1);
    const teeTimesToInsert = [];

    // Generate for each day (starting from tomorrow)
    for (let day = 0; day < daysToGenerate; day++) {
      const currentDate = addDays(startDate, day);
      
      // Convert time strings to Date objects for comparison
      const startTime = new Date(`${currentDate.toDateString()} ${settings.first_tee_time}`);
      const endTime = new Date(`${currentDate.toDateString()} ${settings.last_tee_time}`);
      
      // Generate times for this day
      for (let time = startTime; time <= endTime; time.setMinutes(time.getMinutes() + settings.interval_minutes)) {
        teeTimesToInsert.push({
          course_id: activeCourse.id,
          start_time: new Date(time).toISOString(),
          available_spots: 4,
          booked_spots: 0,
          price: 69.00,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
    }

    // Delete existing future tee times (from tomorrow onwards)
    const tomorrow = addDays(startOfDay(new Date()), 1);
    const { error: deleteError } = await supabase
      .from('tee_times')
      .delete()
      .eq('course_id', activeCourse.id)
      .gte('start_time', tomorrow.toISOString());

    if (deleteError) {
      throw new Error('Failed to delete existing tee times');
    }

    // Insert new tee times in batches
    for (let i = 0; i < teeTimesToInsert.length; i += 1000) {
      const batch = teeTimesToInsert.slice(i, i + 1000);
      const { error: insertError } = await supabase
        .from('tee_times')
        .insert(batch);

      if (insertError) {
        throw new Error('Failed to insert tee times');
      }
    }
  }, [activeCourse?.id, settings, supabase]);

  const handleSave = async () => {
    if (!activeCourse?.id) {
      toast({
        title: "Error saving settings",
        description: "No active course selected",
        variant: "destructive",
      });
      return;
    }

    const price = parseFloat(priceInput);
    if (isNaN(price)) {
      toast({
        title: "Invalid Price",
        description: "Please enter a valid price.",
        variant: "destructive",
      });
      return;
    }

    try {
      const tzOffset = -(new Date().getTimezoneOffset() / 60);
      const tzString = tzOffset >= 0
        ? `-${tzOffset.toString().padStart(2, '0')}`
        : `+${Math.abs(tzOffset).toString().padStart(2, '0')}`;

      const settingsToSave = {
        interval_minutes: settings.interval_minutes,
        first_tee_time: `${settings.first_tee_time}:00${tzString}`,
        last_tee_time: `${settings.last_tee_time}:00${tzString}`,
        booking_days_in_advance: settings.booking_days_in_advance,
        price: price,
        updated_at: new Date().toISOString(),
      };

      const { error, data } = await supabase
        .from('tee_time_settings')
        .update(settingsToSave)
        .eq('course_id', activeCourse.id)
        .select();

      if (error) {
        console.error('Save error:', error);
        toast({
          title: "Error saving settings",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      if (data && data.length > 0) {
        toast({
          title: "Success",
          description: "Your tee time settings have been updated successfully.",
          variant: "default",
        });
      } else {
        toast({
          title: "Warning",
          description: "No changes were made to the settings.",
          variant: "default",
        });
      }

      // Generate tee times after saving settings
      await generateTeeTimes();

      // Update future tee times with the new price
      const tomorrow = addDays(startOfDay(new Date()), 1);
      const { error: updateError } = await supabase
        .from('tee_times')
        .update({ price: price })
        .eq('course_id', activeCourse.id)
        .gte('start_time', tomorrow.toISOString());

      if (updateError) {
        console.error('Update error:', updateError);
        toast({
          title: "Error updating tee times",
          description: updateError.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Settings saved and tee times generated successfully.",
        variant: "default",
      });

    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while saving settings.",
        variant: "destructive",
      });
    }

    router.refresh();
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="font-bold text-2xl">Settings</div>
        <div className="space-y-2">
          <Label htmlFor="interval">Tee Time Interval</Label>
          <Select
            value={settings.interval_minutes.toString()}
            onValueChange={(value) => 
              setSettings(s => ({ ...s, interval_minutes: parseInt(value) }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select interval" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10 minutes</SelectItem>
              <SelectItem value="12">12 minutes</SelectItem>
              <SelectItem value="15">15 minutes</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="firstTime">First Tee Time</Label>
            <input
              type="time"
              id="firstTime"
              value={settings.first_tee_time}
              onChange={(e) => 
                setSettings(s => ({ ...s, first_tee_time: e.target.value }))
              }
              className="w-full flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastTime">Last Tee Time</Label>
            <input
              type="time"
              id="lastTime"
              value={settings.last_tee_time}
              onChange={(e) => 
                setSettings(s => ({ ...s, last_tee_time: e.target.value }))
              }
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="daysInAdvance">Days in Advance</Label>
          <Select
            value={settings.booking_days_in_advance?.toString() || '7'}
            onValueChange={(value) => 
              setSettings(s => ({ ...s, booking_days_in_advance: parseInt(value) }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select days" />
            </SelectTrigger>
            <SelectContent>
              {[1, 3, 5, 7, 14, 30].map((days) => (
                <SelectItem key={days} value={days.toString()}>
                  {days} days
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="price">Tee Time Price</Label>
          <input
            type="text"
            id="price"
            value={priceInput}
            onChange={(e) => setPriceInput(e.target.value)}
            className="w-full flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>

        <Button onClick={handleSave}>Save Settings</Button>
    </div>
  )
}