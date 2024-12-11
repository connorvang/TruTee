"use client"
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useOrganization } from '@clerk/nextjs'
import { AppSidebar } from "@/components/Sidenav/app-sidebar"
import TeeTimesList from "@/components/Teesheets/admin/teeTimesList"
import SimulatorTimesList from "@/components/Teesheets/admin/simulatorTimesList"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { PlusIcon } from "lucide-react"

export default function Page() {
  const [isGolfCourse, setIsGolfCourse] = useState(true)
  const { organization } = useOrganization()
  const supabase = createClientComponentClient()

  useEffect(() => {
    async function getOrgType() {
      if (!organization?.id) return

      const { data: orgData, error } = await supabase
        .from('organizations')
        .select('golf_course')
        .eq('id', organization.id)
        .single()

      if (error) {
        console.error('Error fetching organization type:', error)
        return
      }

      setIsGolfCourse(orgData.golf_course)
    }

    getOrgType()
  }, [organization?.id, supabase])

  return (
        <SidebarProvider>
          <AppSidebar />
      <SidebarInset>
        <header className="flex h-12 shrink-0 gap-2 border-b border-gray-100">
          <div className="flex flex-1 items-center gap-2 px-6">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbPage>
                    Teesheets
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="flex items-center gap-2 px-6">
            <Button variant="outline" size="sm">Export</Button>
            <Button size="sm"><PlusIcon className="w-4 h-4" />Add</Button>
          </div>
        </header>
        <div className="flex flex-1 flex-col pt-0">
          {isGolfCourse ? (
            <TeeTimesList />
          ) : (
            <SimulatorTimesList />
          )}
        </div>
          </SidebarInset>
        </SidebarProvider>
  )
}
