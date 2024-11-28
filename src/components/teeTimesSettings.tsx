"use client"

import { useState, useEffect, useCallback } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useOrganization } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from '@/hooks/use-toast'
import { addDays, startOfDay } from 'date-fns'
import { ArrowRight } from 'lucide-react'

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

  const { organization } = useOrganization()
  const activeOrganization = organization?.id

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
      if (!activeOrganization) return;

      const { data } = await supabase
        .from('tee_time_settings')
        .select('*')
        .eq('organization_id', activeOrganization)
        .single();

      if (data) {
        const loadedSettings = {
          ...data,
          first_tee_time: data.first_tee_time?.substring(0, 5) || '06:00',
          last_tee_time: data.last_tee_time?.substring(0, 5) || '18:00',
          interval_minutes: data.interval_minutes || 10,
          booking_days_in_advance: data.booking_days_in_advance || 7,
          price: data.price || 69.00,
        };
        setSettings(loadedSettings);
        setPriceInput(data.price.toFixed(2));
      }
    }

    loadSettings();
  }, [activeOrganization, supabase]);

  const handleChange = (newSettings: TeeTimeSettings) => {
    setSettings(newSettings);
  };

  const generateTeeTimes = useCallback(async () => {
    if (!activeOrganization) return;
    
    const daysToGenerate = settings.booking_days_in_advance;
    const startDate = addDays(startOfDay(new Date()), 1);
    
    // First, fetch existing booked tee times
    const { data: existingTeeTimes, error: fetchError } = await supabase
      .from('tee_times')
      .select('start_time')
      .eq('organization_id', activeOrganization)
      .gte('start_time', startDate.toISOString())
      .gt('booked_spots', 0);

    if (fetchError) {
      console.error('Error fetching existing tee times:', fetchError);
      return;
    }

    // Create a Set of existing tee time strings for efficient lookup
    const existingTeeTimeSet = new Set(
      existingTeeTimes?.map(tt => new Date(tt.start_time).toISOString()) || []
    );

    const teeTimesToInsert = [];

    for (let day = 0; day < daysToGenerate; day++) {
      const currentDate = addDays(startDate, day);
      
      const startTime = new Date(`${currentDate.toDateString()} ${settings.first_tee_time}`);
      const endTime = new Date(`${currentDate.toDateString()} ${settings.last_tee_time}`);
      
      for (let time = startTime; time <= endTime; time.setMinutes(time.getMinutes() + settings.interval_minutes)) {
        const timeString = new Date(time).toISOString();
        
        // Skip this time slot if it already exists
        if (!existingTeeTimeSet.has(timeString)) {
          teeTimesToInsert.push({
            organization_id: activeOrganization,
            start_time: timeString,
            available_spots: 4,
            booked_spots: 0,
            price: parseFloat(priceInput),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        }
      }
    }

    // Insert in batches of 1000
    for (let i = 0; i < teeTimesToInsert.length; i += 1000) {
      const batch = teeTimesToInsert.slice(i, i + 1000);
      const { error: insertError } = await supabase
        .from('tee_times')
        .insert(batch);

      if (insertError) {
        throw new Error('Failed to insert tee times');
      }
    }
  }, [activeOrganization, settings, supabase, priceInput]);

  const handleSave = async () => {
    if (!activeOrganization) {
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
        .eq('organization_id', activeOrganization)
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

      const tomorrow = addDays(startOfDay(new Date()), 1);
      const { error: deleteError } = await supabase
        .from('tee_times')
        .delete()
        .eq('organization_id', activeOrganization)
        .gte('start_time', tomorrow.toISOString())
        .eq('booked_spots', 0);

      if (deleteError) {
        console.error('Delete error:', deleteError);
        toast({
          title: "Error clearing existing tee times",
          description: deleteError.message,
          variant: "destructive",
        });
        return;
      }

      const { error: updateError } = await supabase
        .from('tee_times')
        .update({ 
          price: price,
          updated_at: new Date().toISOString()
        })
        .eq('organization_id', activeOrganization)
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

      await generateTeeTimes();

      toast({
        title: "Success",
        description: "Settings saved and future tee times updated successfully.",
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
      <div className="max-w-3xl mx-auto bg-gray-50 rounded-xl">
        <div className="p-6">
          <div className="text-lg font-semibold">Configure tee times</div>
          <div className="text-gray-600 text-sm">Adjust the basic settings for your tee times.</div>
        </div>
        <div className="p-1">
          <ul className="bg-white shadow-md rounded-lg">
            <li className="p-5 border-b border-gray-100">
              <div className="flex items-start justify-between gap-16">
                <div className="flex-1">
                  <div className="font-medium text-md">Tee time interval</div>
                  <div className="text-gray-600 text-sm">Choose the spacing between tee times that should be used for your course.</div>
                </div>
                <div className="flex-1">
                  <Select
                    value={settings.interval_minutes.toString()}
                    onValueChange={(value) => 
                      handleChange({ ...settings, interval_minutes: parseInt(value) })
                    }
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Select interval" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10 minutes</SelectItem>
                      <SelectItem value="12">12 minutes</SelectItem>
                      <SelectItem value="15">15 minutes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </li>
            <li className="p-5 border-b border-gray-100">
              <div className="flex items-start justify-between gap-16">
                <div className="flex-1">
                  <div className="font-medium text-md">Timeframe</div>
                  <div className="text-gray-600 text-sm">Choose when the first and last tee times are available for players to book.</div>
                </div>
                <div className="flex flex-1 items-center gap-2">
                  <Input
                    type="time"
                    id="firstTime"
                    value={settings.first_tee_time}
                    onChange={(e) => 
                      handleChange({ ...settings, first_tee_time: e.target.value })
                    }
                    className="w-auto"
                  />
                  <ArrowRight className="text-gray-500" size={16} />
                  <Input
                    type="time"
                    id="lastTime"
                    value={settings.last_tee_time}
                    onChange={(e) => 
                      handleChange({ ...settings, last_tee_time: e.target.value })
                    }
                    className="w-auto"
                  />
                </div>
              </div>
            </li>
            <li className="p-5 border-b border-gray-100">
              <div className="flex items-start justify-between gap-16">
                <div className="flex-1">
                  <div className="font-medium text-md">Booking days in advance</div>
                    <div className="text-gray-600 text-sm">Select how many days early players can book their tee times.</div>
                </div>
                <div className="flex-1">
                  <Select
                    value={settings.booking_days_in_advance?.toString() || '7'}
                    onValueChange={(value) => 
                      handleChange({ ...settings, booking_days_in_advance: parseInt(value) })
                    }
                  >
                    <SelectTrigger className="w-24 border rounded-md p-2">
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
              </div>
            </li>
            <li className="p-5">
              <div className="flex items-start justify-between gap-16">
                <div className="flex-1">
                  <div className="font-medium text-md">Price</div>
                  <div className="text-gray-600 text-sm">Enter the price it costs to play 18 holes with a cart included.</div>
                </div>
                <div className="flex-1">
                <Input
                  type="text"
                  id="price"
                  value={priceInput}
                  onChange={(e) => {
                    setPriceInput(e.target.value);
                    handleChange({ ...settings, price: parseFloat(e.target.value) || 0 });
                  }}
                  className="w-40"
                  />
                </div>
              </div>
            </li>
          </ul>
        </div>
        <div className="p-6 flex justify-end">
              <Button onClick={handleSave} className="ml-2">
                Save Settings
              </Button>
        </div>
      </div>
  )
}