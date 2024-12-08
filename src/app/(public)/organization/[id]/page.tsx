"use client"

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useParams } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {  Heart } from 'lucide-react'
import { SignInButton } from '@clerk/nextjs'
import { usePublicTeeTimes } from '@/hooks/usePublicTeeTimes'
import Image from 'next/image'
import TeeTimesList from '@/components/Teesheets/publicTeeTimesList'
import SimulatorTimesList from '@/components/Teesheets/publicSimulatorTimesList'
import { SignUpButton } from '@clerk/nextjs'
import { SignedOut } from '@clerk/nextjs'
import { SignedIn } from '@clerk/nextjs'
import { UserButton } from '@clerk/nextjs'
import Link from 'next/link'
import { Skeleton } from "@/components/ui/skeleton"

interface Organization {
  id: string
  name: string
  golf_course: boolean
  image_url: string
}

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

export default function OrganizationPage() {
  const { id } = useParams() as { id: string }
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [date, setDate] = useState<Date>(new Date())
  const supabase = createClientComponentClient()
  const { teeTimes, loading } = usePublicTeeTimes(date, id)

  useEffect(() => {
    async function getOrgData() {
      if (!id) return

      const { data: orgData, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        console.error('Error fetching organization:', error)
        return
      }

      setOrganization(orgData)
    }

    getOrgData()
  }, [id, supabase])

  if (!organization) {
    return <OrganizationSkeleton />
  }

  return (
    <div className="min-h-screen flex flex-col">

      <div className="flex-1 flex py-8 px-4 gap-8 w-full max-w-[1920px] mx-auto">
        <div className="w-80 flex flex-col gap-6 bg-background overflow-y-auto">
          <div className="relative">
            <Image
              src={organization.image_url}
              alt="Golf Course"
              width={320}
              height={180}
              className="w-full h-48 object-cover rounded-lg"
            />
            <Button size="icon" variant="secondary" className="absolute top-4 right-4">
              <Heart className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-lg font-semibold">{organization.name}</span>
            <span className="text-sm text-muted-foreground">{organization.golf_course ? 'Golf Course' : 'Simulator Facility'}</span>
          </div>

          <p className="text-sm">Some random description</p>

          <Separator />

          <div>
            <h2 className="font-semibold mb-4">Details</h2>
            <div className="space-y-2 text-sm">
              {/* Add your organization details here */}
            </div>
          </div>
        </div>

        <div className="flex-1">
          <div className="space-y-4">
          {organization.golf_course ? (
            <TeeTimesList organizationId={organization.id} />
          ) : (
            <SimulatorTimesList organizationId={organization.id} />
          )}
          </div>
          
        </div>
      </div>
    </div>
  )
}