import { AppSidebar } from "@/components/Sidenav/app-sidebar"
import TeeTimesList from "@/components/Teesheets/teeTimesList"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { PlusIcon } from "lucide-react"

export const metadata = {
  title: "Teesheets - TruTee",
  description: "The main page for managing tee times",
}

export default function Page() {
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
                  <BreadcrumbLink href="#">
                    Teesheets
                  </BreadcrumbLink>
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
          <TeeTimesList />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
