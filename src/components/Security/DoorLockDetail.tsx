'use client'

import { ArrowLeftIcon, LockOpen } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import AccessCodesList from "@/components/Security/AccessCodesList";
import StatusPanel from "@/components/Security/StatusPanel";
import EventsList from "@/components/Security/EventsList";
import { Device } from "@/types/seam";
import { Button } from "../ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Image from "next/image";

interface LockDetailProps {
  device: Device;
}


  const toSentenceCase = (str: string) => {
    return str.toLowerCase().replace(/^\w/, c => c.toUpperCase());
  }

export default function DoorLockDetail({ device }: LockDetailProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'codes' | 'events'>('codes');

  return (
    <div className="container mx-auto max-w-[1440px]">
      {/* Header */}
      <div className="flex w-full items-center mb-8">
        <div className="flex w-full items-start gap-8 flex-col">
          <button onClick={() => router.back()}>
            <span className="flex items-center gap-2">
              <ArrowLeftIcon className="w-5 h-5" /> Security
            </span>
          </button>
          <div className="flex w-full flex-row items-center justify-between gap-2">
          <Image 
            src={device.properties.image_url || '/default-lock.png'} 
            alt={device.display_name}
            width={40}
            height={40}
            className="rounded"
            />
            <h1 className="text-2xl font-semibold flex-1">{toSentenceCase(device.properties.name || '')}</h1>
            <div className="flex flex-1 gap-2 justify-end">
              <Button variant="outline" size="sm">Edit device</Button>
              <Button variant="destructive" size="sm">Remove</Button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="codes" onValueChange={(value) => setActiveTab(value as 'codes' | 'events')} className="border-b mb-12">
        <TabsList className="bg-transparent border-0">
          <TabsTrigger 
            value="codes" 
            className="border-0 shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none pb-2"
          >
            Access codes
          </TabsTrigger>
          <TabsTrigger 
            value="events" 
            className="border-0 shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none pb-2"
          >
            Events
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Content */}
      <div className="flex flex-row gap-12">
        <div className="flex flex-1 ">
          {activeTab === 'codes' ? (
            <AccessCodesList lockId={device.device_id} />
          ) : (
            <EventsList lockId={device.device_id} />
          )}
        </div>
        
        {/* Status Panel */}
        <div className="space-y-4">
          <StatusPanel
            status={device.properties.online ? 'Online' : 'Offline'}
            battery={device.properties.battery_level ? Math.round(device.properties.battery_level * 100) : 0}
            lockStatus={device.properties.locked ? 'Locked' : 'Unlocked'}
            deviceId={device.device_id}
            pairedDate={new Date(device.created_at).toLocaleString()}
          />
        </div>
      </div>
    </div>
  );
}