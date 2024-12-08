'use client'

import { AppSidebar } from "@/components/Sidenav/app-sidebar"
import TeeTimeSettings from "@/components/Settings/teeTimesSettings"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"


interface TeeTimeSettings {
  id: string;
  course_id: string;
  interval_minutes: number;
  first_tee_time: string;
  last_tee_time: string;
  days_in_advance: number;
}

export default function SettingsPage() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-12 shrink-0 gap-2 border-b border-gray-100 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex flex-1 items-center gap-2 px-6">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbPage>
                    Settings
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="pt-16">
          <TeeTimeSettings />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}