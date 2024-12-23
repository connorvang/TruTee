import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator, BreadcrumbLink } from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/Sidenav/app-sidebar"
import { getUser } from "@/actions/getUser"

export default async function CustomerDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params
  
  const user = await getUser(id)

  if (!user) {
    return <div>User not found</div>
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
                  <BreadcrumbLink href="/admin/customers">Customers</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{user.first_name} {user.last_name}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="pt-8 px-6">
          <div className="space-y-4">
            <div>
              <h2 className="font-semibold">Email</h2>
              <p>{user.email}</p>
            </div>
            {user.first_name && (
              <div>
                <h2 className="font-semibold">Name</h2>
                <p>{`${user.first_name} ${user.last_name || ''}`}</p>
              </div>
            )}
            {user.organizations && (
              <div>
                <h2 className="font-semibold">Organization</h2>
                <p>{user.organizations.name}</p>
              </div>
            )}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
