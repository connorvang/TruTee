import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator, BreadcrumbLink } from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/Sidenav/app-sidebar"
import DoorLockDetail from "@/components/Security/DoorLockDetail"
import { Seam } from "seam"

export default async function DoorLockDetailPage({ 
  params 
}: { 
  params: Promise<{ deviceId: string }> 
}) {
  const { deviceId } = await params
  
  // Fetch lock details
  const seam = new Seam()
  const device = await seam.devices.get({ device_id: deviceId })

  if (!device) {
    return <div>Device not found</div>
  }

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
                <BreadcrumbItem>
                  <BreadcrumbLink href="/admin/security">Security</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Door Lock</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="pt-8 px-6">
          <DoorLockDetail device={device} />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
} 