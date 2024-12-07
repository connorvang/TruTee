"use client"

import { useState, useEffect, useCallback } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useOrganization } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { useToast } from '@/hooks/use-toast'
import { addDays, startOfDay } from 'date-fns'
import { GolfCourseSettings } from './GolfCourseSettings';
import { SimulatorSettings } from './SimulatorSettings';

export interface TeeTimeSettings {
  id?: string
  interval_minutes: number
  first_tee_time: string
  last_tee_time: string
  booking_days_in_advance: number
  organization_type: string
  price: number
  number_of_simulators: number
  green_fee_18: number
  green_fee_9: number
  cart_fee_18: number
  cart_fee_9: number
  simulatorTimes: Array<{
    start_time: string;
    end_time: string;
    available_spots: number;
    booked_spots: number;
    simulator: number;
    price: number;
  }>;
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
    number_of_simulators: 1,
    green_fee_18: 50,
    green_fee_9: 30,
    cart_fee_18: 20,
    cart_fee_9: 10,
    organization_type: 'golf_course',
    simulatorTimes: [],
  })

  const [priceInput, setPriceInput] = useState(settings.price.toFixed(2))


  useEffect(() => {
    async function loadSettings() {
      if (!activeOrganization) return;

      // Fetch organization data first
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('golf_course')
        .eq('id', activeOrganization)
        .single();

      if (orgError || !orgData) {
        console.error('Error fetching organization data:', orgError);
        return;
      }

      // Fetch tee time settings
      const { data: settingsData } = await supabase
        .from('tee_time_settings')
        .select('*')
        .eq('organization_id', activeOrganization)
        .single();

      if (settingsData) {
        const loadedSettings = {
          ...settingsData,
          first_tee_time: settingsData.first_tee_time?.substring(0, 5) || '06:00',
          last_tee_time: settingsData.last_tee_time?.substring(0, 5) || '18:00',
          interval_minutes: settingsData.interval_minutes || 10,
          booking_days_in_advance: settingsData.booking_days_in_advance || 7,
          price: settingsData.price || 69.00,
          green_fee_18: settingsData.green_fee_18 || 50,
          cart_fee_18: settingsData.cart_fee_18 || 20,
          green_fee_9: settingsData.green_fee_9 || 30,
          cart_fee_9: settingsData.cart_fee_9 || 10,
        };
        setSettings(loadedSettings);
        setPriceInput(settingsData.price.toFixed(2));
      }

      // Set organization type and default settings for simulators
      const organizationType = orgData.golf_course ? 'golf_course' : 'simulator';
      setSettings((prevSettings) => ({
        ...prevSettings,
        organization_type: organizationType,
        ...(organizationType === 'simulator' && {
          interval_minutes: 30,
          first_tee_time: '00:00',
          last_tee_time: '23:59',
        }),
      }));
    }

    loadSettings();
  }, [activeOrganization, supabase]);

  const handleChange = (newSettings: TeeTimeSettings) => {
    if (settings.organization_type === 'simulator') {
      // Prevent changes to interval and timeframe for simulators
      newSettings.interval_minutes = 30;
      newSettings.first_tee_time = '00:00';
      newSettings.last_tee_time = '23:59';
    }
    setSettings(newSettings);
  };

  const generateTeeTimes = useCallback(async () => {
    if (!activeOrganization) return;
    
    const daysToGenerate = settings.booking_days_in_advance;
    const startDate = addDays(startOfDay(new Date()), 1);
    
    // First, fetch existing booked tee times
    const { data: existingTeeTimes, error: fetchError } = await supabase
      .from('tee_times')
      .select('start_time, simulator')
      .eq('organization_id', activeOrganization)
      .gte('start_time', startDate.toISOString())
      .gt('booked_spots', 0);

    if (fetchError) {
      console.error('Error fetching existing tee times:', fetchError);
      return;
    }

    // Create a Set of existing tee time strings with simulator number for efficient lookup
    const existingTeeTimeSet = new Set(
      existingTeeTimes?.map(tt => `${new Date(tt.start_time).toISOString()}-${tt.simulator}`) || []
    );

    const teeTimesToInsert = [];

    for (let day = 0; day < daysToGenerate; day++) {
      const currentDate = addDays(startDate, day);
      
      const startTime = new Date(`${currentDate.toDateString()} ${settings.first_tee_time}`);
      const endTime = new Date(`${currentDate.toDateString()} ${settings.last_tee_time}`);
      
      for (let time = startTime; time <= endTime; time.setMinutes(time.getMinutes() + settings.interval_minutes)) {
        const timeString = new Date(time).toISOString();
        const endTimeString = new Date(time.getTime() + settings.interval_minutes * 60000).toISOString();
        
        if (settings.organization_type === 'simulator') {
          // Generate slots for each simulator
          for (let sim = 1; sim <= settings.number_of_simulators; sim++) {
            const timeSimKey = `${timeString}-${sim}`;
            if (!existingTeeTimeSet.has(timeSimKey)) {
              teeTimesToInsert.push({
                organization_id: activeOrganization,
                start_time: timeString,
                end_time: endTimeString,
                available_spots: 1,
                booked_spots: 0,
                simulator: sim,
                price: parseFloat(priceInput),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              });
            }
          }
        } else {
          // Regular golf course tee time
          if (!existingTeeTimeSet.has(`${timeString}-null`)) {
            teeTimesToInsert.push({
              organization_id: activeOrganization,
              start_time: timeString,
              available_spots: 4,
              booked_spots: 0,
              simulator: null,
              green_fee_18: settings.green_fee_18,
              cart_fee_18: settings.cart_fee_18,
              green_fee_9: settings.green_fee_9,
              cart_fee_9: settings.cart_fee_9,
              price: parseFloat(priceInput),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
          }
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
        green_fee_18: settings.green_fee_18,
        cart_fee_18: settings.cart_fee_18,
        green_fee_9: settings.green_fee_9,
        cart_fee_9: settings.cart_fee_9,
        number_of_simulators: settings.number_of_simulators, // Ensure this is included
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

      // Delete existing unbooked tee times
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

      // Update prices ONLY for unbooked tee times
      const { error: updateError } = await supabase
        .from('tee_times')
        .update({ 
          price: price,
          updated_at: new Date().toISOString()
        })
        .eq('organization_id', activeOrganization)
        .gte('start_time', tomorrow.toISOString())
        .eq('booked_spots', 0); // Only update price for unbooked tee times

      if (updateError) {
        console.error('Update error:', updateError);
        toast({
          title: "Error updating tee times",
          description: updateError.message,
          variant: "destructive",
        });
        return;
      }

      // Generate new tee times
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
    <div className="flex flex-col gap-12 max-w-3xl mx-auto">
      <div className="bg-gray-50 rounded-xl">
        <div className="p-6">
          <div className="text-md font-semibold">Configure your organization</div>
          <div className="text-gray-600 text-sm">Select the type of organization you are.</div>
        </div>
        <div className="p-1">
          <ul className="bg-white shadow-md rounded-lg">
            <li className="p-5 border-b border-gray-100">
              <div className="flex items-start justify-between gap-16">
                <div className="flex-1">
                  <div className="font-medium text-md">Type</div>
                  <div className="text-gray-600 text-sm">Choose if you are a golf course or a simulator.</div>
                </div>
                <div className="flex-1">
                  <Select
                    value={settings.organization_type}
                    onValueChange={(value) => 
                      handleChange({ ...settings, organization_type: value })
                    }
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Select organization type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="golf_course">Golf course</SelectItem>
                      <SelectItem value="simulator">Simulator</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </li>
          </ul>
        </div>
      </div>

      <div className="bg-gray-50 rounded-xl">
        <div className="p-6">
          <div className="text-md font-semibold">Configure tee times</div>
          <div className="text-gray-600 text-sm">Adjust the basic settings for your tee times.</div>
        </div>
        <div className="p-1">
          <ul className="bg-white shadow-md rounded-lg">
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

            {settings.organization_type === 'golf_course' ? (
              <GolfCourseSettings settings={settings} handleChange={handleChange} />
            ) : (
              <SimulatorSettings settings={settings} handleChange={handleChange}/>
            )}
          </ul>
        </div>
        <div className="p-6 flex justify-end">
          <Button onClick={handleSave} className="ml-2">
            Save Settings
          </Button>
        </div>
      </div>
    </div>
  )
}