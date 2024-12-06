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
interface Organization {
  id: string
  name: string
  golf_course: boolean
}

export default function OrganizationPage() {
  const { id } = useParams() as { id: string }
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [date, setDate] = useState<Date>(new Date())
  const supabase = createClientComponentClient()
  const { teeTimes, loading } = usePublicTeeTimes(date, id)

  useEffect(() => {
    async function fetchOrganization() {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        console.error('Error fetching organization:', error)
        return
      }

      setOrganization(data)
    }

    if (id) {
      fetchOrganization()
    }
  }, [id, supabase])

  if (!organization) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b h-16">
        <div className="px-4 w-full max-w-[1920px] mx-auto">
          <div className="h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Link href="/" className="font-semibold text-xl">
                <img src="/trutee_logo.svg" alt="TruTee" width={100} height={32} />
              </Link>
            </div>
            <div className="flex items-center gap-2">
              <SignedOut>
                <SignInButton>
                  <Button variant="outline" size="sm">Sign in</Button>
                </SignInButton>
            <SignUpButton>
                  <Button variant="default" size="sm">Sign up</Button>
                </SignUpButton>
              </SignedOut>
              <SignedIn>
                <UserButton />
              </SignedIn>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex py-8 px-4 gap-8 w-full max-w-[1920px] mx-auto">
        <div className="w-80 flex flex-col gap-6 bg-background overflow-y-auto">
          <div className="relative">
            <Image
              src="/golfCourse.jpg"
              alt="Golf Course"
              width={320}
              height={180}
              className="w-full h-48 object-cover rounded-lg"
            />
            <Button size="icon" variant="secondary" className="absolute top-4 right-4">
              <Heart className="h-4 w-4" />
            </Button>
          </div>

          <div>
            <h1 className="text-xl font-semibold">{organization.name}</h1>
            <p className="text-sm text-muted-foreground">Location</p>
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