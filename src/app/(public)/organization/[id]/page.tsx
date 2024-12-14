export const dynamic = 'force-dynamic'

import { Separator } from "@/components/ui/separator"
import Image from 'next/image'
import TeeTimesList from '@/components/Teesheets/publicTeeTimesList'
import SimulatorTimesList from '@/components/Teesheets/publicSimulatorTimesList'
import { Skeleton } from "@/components/ui/skeleton"
import { getSimulatorTimes } from '@/actions/getSimulatorTimes'
import { createClient } from '@/lib/supabase/server'
import { getTeeTimes } from '@/actions/getTeeTimes'


const OrganizationSkeleton = () => {
  return (
    <div className="min-h-screen flex flex-col md:flex-row">

      <div className="flex-1 flex py-8 px-4 gap-8 w-full max-w-[1920px] mx-auto">
        <div className="w-80 flex flex-col gap-6 bg-background overflow-y-auto">
          <Skeleton className="w-full h-48 rounded-lg" />
          
          <div className="flex flex-col gap-1">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-5 w-32" />
          </div>

          <Skeleton className="h-20 w-full" />

          <Separator />

          <div>
            <Skeleton className="h-6 w-24 mb-4" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        </div>

        <div className="flex-1">
          <div className="space-y-4">
            <Skeleton className="h-[500px] w-full" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default async function OrganizationPage({ 
  params,
}: { 
  params: Promise<{ id: string }>;
}) {
  const supabase = await createClient()
  const { id } = await params  // Await the params to extract id

  try {
    const { data: orgData, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !orgData) {
      return <OrganizationSkeleton />
    }

    // Get initial data based on organization type
    const initialData = orgData.golf_course 
      ? await getTeeTimes(new Date(), id)
      : await getSimulatorTimes(new Date(), id)

    return (
      <div className="flex-1 flex flex-col lg:flex-row py-8 px-4 gap-8 w-full max-w-[1920px] mx-auto">
        <div className="flex flex-col md:flow-col gap-6 bg-background overflow-y-auto">
          <Image
            src={orgData.image_url}
            alt="Golf Course"
            width={320}
            height={180}
            className="w-full h-48 object-cover flex rounded-lg"
          />

          <div className="flex flex-col gap-1">
            <span className="text-lg font-semibold">{orgData.name}</span>
            <span className="text-sm text-muted-foreground">{orgData.golf_course ? 'Golf Course' : 'Simulator Facility'}</span>
          </div>

          <p className="text-sm hidden lg:block">Some random description</p>

          <Separator />

          <div className="hidden lg:block">
            <h2 className="font-semibold mb-4">Details</h2>
            <div className="space-y-2 text-sm">
              {/* Add your organization details here */}
            </div>
          </div>
        </div>

        <div className="flex-1">
          <div className="space-y-4">
            {orgData.golf_course ? (
              <TeeTimesList 
                organizationId={orgData.id}
                organizationName={orgData.name}
                organizationImage={orgData.image_url}
                initialTeeTimes={Array.isArray(initialData.teeTimes) ? initialData.teeTimes : []}
              />
            ) : (
              <SimulatorTimesList 
                organizationId={orgData.id} 
                organizationName={orgData.name}
                organizationImage={orgData.image_url}
              />
            )}
          </div>
        </div>
      </div>
    )
  } catch (error) {
    console.error('Error loading organization:', error)
    return <OrganizationSkeleton />
  }
}