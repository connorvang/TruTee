export const dynamic = 'force-dynamic'

import { OrganizationCard } from "@/components/OrganizationCard"
import { getOrganizations } from '@/actions/getOrganizations'

export default async function PublicPortal() {
  const organizations = await getOrganizations()

  return (
    <main className="w-full max-w-[1920px] mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {organizations.map((org) => (
          <OrganizationCard key={org.id} organization={org} />
        ))}
      </div>
    </main>
  )
}