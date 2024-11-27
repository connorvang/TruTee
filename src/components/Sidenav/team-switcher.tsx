"use client"

import * as React from "react"
import { ChevronsUpDown, LandPlot, Plus } from "lucide-react"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

interface Organization {
  id: string
  name: string
  location: string
}

export function TeamSwitcher() {
  const { isMobile } = useSidebar()
  const [activeOrganization, setActiveOrganization] = React.useState<Organization>({
    id: "1",
    name: "Hardcoded Organization",
    location: "Hardcoded Location"
  })
  const [organizations, setOrganizations] = React.useState<Organization[]>([])
  const supabase = createClientComponentClient()

  // Fetch all golf courses
  React.useEffect(() => {
    async function loadOrganizations() {
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name, location')

      if (error) {
        console.error('Error loading organizations:', error)
        return
      }

      if (data) {
        setOrganizations(data)
      }
    }

    loadOrganizations()
  }, [supabase])

  if (!activeOrganization) {
    return null
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
                <LandPlot size={16} />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">
                  {activeOrganization.name}
                </span>
                <span className="truncate text-xs">{activeOrganization.location}</span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Your Courses
            </DropdownMenuLabel>
            {organizations.map((organization) => (
              <DropdownMenuItem
                key={organization.id}
                onClick={() => setActiveOrganization(organization)}
                className="gap-2 p-2"
              >
                <div className="flex size-6 items-center justify-center rounded-sm border">
                  <LandPlot size={16} />
                </div>
                <div className="flex flex-col">
                  <span>{organization.name}</span>
                  <span className="text-xs text-muted-foreground">{organization.location}</span>
                </div>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 p-2">
              <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                <Plus className="size-4" />
              </div>
              <div className="font-medium text-muted-foreground">Add course</div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
