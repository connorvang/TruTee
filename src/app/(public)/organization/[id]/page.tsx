"use client"

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useParams } from 'next/navigation'
import { SignInButton, useUser } from '@clerk/nextjs'
import { Button } from '@components/ui/button'
import TeeTimesList from '@/components/Teesheets/teeTimesList'
import SimulatorTimesList from '@/components/Teesheets/simulatorTimesList'

interface Organization {
  id: string;
  name: string;
  golf_course: boolean;
}

export default function OrganizationPage() {
  const { id } = useParams() as { id: string }
  const { user, isLoaded } = useUser()
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [isGolfCourse, setIsGolfCourse] = useState(true)
  const supabase = createClientComponentClient()

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
      setIsGolfCourse(data.golf_course)
    }

    if (id) {
      fetchOrganization()
    }
  }, [id, supabase])

  if (!organization) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">{organization.name}</h1>
            {!isLoaded ? null : !user ? (
              <SignInButton mode="modal">
                <Button>Sign in to book</Button>
              </SignInButton>
            ) : (
              <div className="text-sm text-gray-500">
                Signed in as {user.firstName}
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isGolfCourse ? (
          <TeeTimesList organizationId={id} isAuthenticated={!!user} />
        ) : (
          <SimulatorTimesList organizationId={id} isAuthenticated={!!user} />
        )}
      </main>
    </div>
  )
}