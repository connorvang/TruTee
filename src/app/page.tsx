"use client"

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SignedIn, SignedOut, SignUpButton, UserButton } from '@clerk/nextjs'
import Link from 'next/link'
import { SignInButton } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'


interface Organization {
  id: string
  name: string
  golf_course: boolean
  location?: string
  description?: string
}

export default function PublicPortal() {
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    async function fetchOrganizations() {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .order('name')

      if (error) {
        console.error('Error fetching organizations:', error)
        return
      }

      setOrganizations(data || [])
    }

    fetchOrganizations()
  }, [supabase])


  return (
    <div className="min-h-screen bg-gray-50">

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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {organizations.map((org) => (
            <Card 
              key={org.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => router.push(`/organization/${org.id}`)}
            >
              <CardHeader>
                <CardTitle>{org.name}</CardTitle>
                <CardDescription>
                  {org.golf_course ? 'Golf Course' : 'Simulator Facility'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {org.location && <p className="text-sm text-gray-500">{org.location}</p>}
                {org.description && <p className="mt-2 text-sm">{org.description}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  )
}