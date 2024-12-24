'use client'

import { useEffect, useState } from 'react'
import { ArrowLeftIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { fetchGolferScores, fetchGolferDetails } from '@/app/api/ghin'
import RecentScoresList from '@/components/Customers/RecentScoresList'
import CustomerStatsPanel from '@/components/Customers/CustomerStatsPanel'

interface User {
  first_name: string;
  last_name: string;
  email: string;
  ghin: string;
}

interface GolferDetails {
  first_name: string;
  last_name: string;
  handicap_index: string;
  club_name: string;
  association_name: string;
  ghin: string;
  state: string;
  country: string;
}

export default function CustomerDetailContent({ user }: { user: User }) {
  const router = useRouter();
  const [golferDetails, setGolferDetails] = useState<GolferDetails | null>(null)
  const [activeTab, setActiveTab] = useState<'details' | 'scores'>('scores');

  useEffect(() => {
    const loadGolferDetails = async () => {
      if (user?.ghin) {
        const details = await fetchGolferDetails(user.ghin)
        setGolferDetails(details.golfers[0])
      }
    }
    loadGolferDetails()
  }, [user])

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
      <Tabs defaultValue="scores" onValueChange={(value) => setActiveTab(value as 'details' | 'scores')} className="border-b mb-12">
        <TabsList className="bg-transparent border-0">
          <TabsTrigger 
            value="scores" 
            className="border-0 shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none pb-2"
          >
            Recent scores
          </TabsTrigger>
          <TabsTrigger 
            value="details" 
            className="border-0 shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none pb-2"
          >
            Details
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Content */}
      <div className="flex flex-row gap-12">
        <div className="flex flex-1">
          {activeTab === 'scores' ? (
            <RecentScoresList ghinNumber={user.ghin} />
          ) : (
            <div className="w-full space-y-6">
              <div className="rounded-lg border p-4">
                <h3 className="text-lg font-medium mb-4">Contact Information</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Email</span>
                    <span>{user.email}</span>
                  </div>
                </div>
              </div>
              
              {golferDetails && (
                <div className="rounded-lg border p-4">
                  <h3 className="text-lg font-medium mb-4">Golf Information</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Handicap Index</span>
                      <span>{golferDetails.handicap_index}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Club</span>
                      <span>{golferDetails.club_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Association</span>
                      <span>{golferDetails.association_name}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Status Panel */}
        <div className="w-80">
          <CustomerStatsPanel
            handicapIndex={golferDetails?.handicap_index || 'N/A'}
            clubName={golferDetails?.club_name || 'N/A'}
            associationName={golferDetails?.association_name || 'N/A'}
            ghinNumber={user.ghin || 'N/A'}
            state={golferDetails?.state || 'N/A'}
            country={golferDetails?.country || 'N/A'}
          />
        </div>
      </div>
    </div>
  );
} 