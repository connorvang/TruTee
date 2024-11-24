'use client'

import { AppSidebar } from "@/components/Sidenav/app-sidebar"
import TeeTimeSettings from "@/components/teeTimesSettings"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { useCourse } from '@/contexts/CourseContext'

interface TeeTimeSettings {
  id: string;
  course_id: string;
  interval_minutes: number;
  first_tee_time: string;
  last_tee_time: string;
  days_in_advance: number;
}

export default function SettingsPage() {
  const { activeCourse } = useCourse()

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-gray-100 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-6">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/settings">
                    Settings
                  </BreadcrumbLink>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        
        <div className="flex-1 space-y-6 p-10 pb-16">
          <div className="space-y-0.5 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold tracking-tight">
              Settings
            </h2>
            <p className="text-muted-foreground">
              Manage your tee time settings.
            </p>
          </div>
          <Separator className="max-w-2xl mx-auto"/>
          {!activeCourse ? (
            <p className="text-muted-foreground max-w-2xl mx-auto">Please select a course to view settings.</p>
          ) : (
            <TeeTimeSettings />
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}