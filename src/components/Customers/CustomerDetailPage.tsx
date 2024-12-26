'use client'

import { useState, useEffect } from 'react'
import { ArrowLeftIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import CustomerStatsPanel from '@/components/Customers/CustomerStatsPanel'
import AccessCodesList from '@/components/Customers/AccessCodesList'
import { getDevices } from '@/actions/security/getDevices'
import { Device } from "seam";

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  ghin: string;
  handicap: string;
}

interface CustomerDetailProps {
  user: User;
}

// Add interface for simplified device format
interface SimpleDevice {
  device_id: string;
  name: string;
}

export default function CustomerDetailContent({ user }: CustomerDetailProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'billing' | 'profile'>('profile');
  const [devices, setDevices] = useState<Device[]>([]);

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const devicesList = await getDevices();
        setDevices(devicesList);
      } catch (error) {
        console.error('Error fetching devices:', error);
      }
    };
    fetchDevices();
  }, []);

  const simplifiedDevices: SimpleDevice[] = devices.map(device => ({
    device_id: device.device_id,
    name: device.properties.name || device.device_type
  }));

  return (
    <div className="container mx-auto max-w-[1440px]">
     {/* Header */}
     <div className="flex w-full items-center mb-8">
        <div className="flex w-full items-start gap-8 flex-col">
          <button onClick={() => router.back()}>
            <span className="flex items-center gap-2 text-sm text-gray-800 hover:text-gray-900">
              <ArrowLeftIcon className="w-4 h-4 text-gray-800 hover:text-gray-900" /> Customers
            </span>
          </button>
          <div className="flex w-full flex-col gap-2">
            <h1 className="text-2xl font-semibold flex-1">{user.first_name} {user.last_name}</h1>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
        </div>
      </div>


      {/* Tabs */}
      <Tabs defaultValue="profile" onValueChange={(value) => setActiveTab(value as 'profile' | 'billing')} className="border-b mb-12">
        <TabsList className="bg-transparent border-0">
          <TabsTrigger 
            value="profile" 
            className="border-0 shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none pb-2"
          >
            Profile
          </TabsTrigger>
          <TabsTrigger 
            value="billing" 
            className="border-0 shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none pb-2"
          >
            Billing
          </TabsTrigger>
        </TabsList>
      </Tabs> 

      {/* Content */}
      <div className="flex flex-row gap-12">
        <div className="flex flex-1">

          {/* Profile */}
          {activeTab === 'profile' ? (
            <div className="w-full space-y-6">
            <AccessCodesList userId={user.id} devices={simplifiedDevices} />
          </div>
          ) : (

            // Billing
            <div className="w-full space-y-6">
              Billing information
            </div>
          )}

        </div>
        
        {/* Status Panel */}
        <div className="w-80">
          <CustomerStatsPanel
            handicap={user.handicap}
            ghinNumber={user.ghin}
          />
        </div>
      </div>
    </div>
  );
} 