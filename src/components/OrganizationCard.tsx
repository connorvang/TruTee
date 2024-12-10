'use client'

import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Image from 'next/image'
import type { Organization } from '@/actions/getOrganizations'

interface OrganizationCardProps {
  organization: Organization
}

export function OrganizationCard({ organization: org }: OrganizationCardProps) {
  const router = useRouter()

  return (
    <Card 
      key={org.id}
      className="cursor-pointer border-none shadow-none bg-transparent"
      onClick={() => router.push(`/organization/${org.id}`)}
    >
      <CardHeader className="p-0">
        <Image
          src={org.image_url}
          alt={org.name}
          width={320}
          height={180}
          className="w-full h-48 object-cover rounded-lg"
        />
        <CardTitle className="mt-4 text-lg font-semibold">{org.name}</CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          {org.golf_course ? 'Golf Course' : 'Simulator Facility'}
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        {org.location && <p className="text-sm text-gray-500">{org.location}</p>}
        {org.description && <p className="mt-2 text-sm">{org.description}</p>}
      </CardContent>
    </Card>
  )
} 