"use client"

import * as React from "react"
import { usePathname } from "next/navigation"

import { NavMain } from "@/components/Sidenav/nav-main"
import { NavProjects } from "@/components/Sidenav/nav-projects"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  useSidebar
} from "@/components/ui/sidebar"
import { sidebarConfig } from "@/config/sidebar-nav"
import { OrganizationSwitcher, UserButton } from "@clerk/nextjs"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const { state, isMobile } = useSidebar()
  const isCollapsed = state === "collapsed"

  const activeNavMain = sidebarConfig.navMain.map(item => ({
    ...item,
    isActive: 'matchExact' in item
      ? pathname === item.url
      : pathname.startsWith(item.url)
  }))

  const activeProjects = sidebarConfig.projects.map(item => ({
    ...item,
    isActive: pathname.startsWith(item.url)
  }))

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <OrganizationSwitcher 
          hidePersonal={true}
          appearance={{
            elements: {
              rootBox: {
                width: isCollapsed || isMobile ? "40px" : "100%",
              },
              organizationSwitcherTrigger: {
                padding: isCollapsed || isMobile ? "0" : undefined,
              },
              organizationPreviewTextContainer: 
                "[&:not(.cl-organizationSwitcherPopoverCard_*)]:flex text-sm font-medium " + 
                (isCollapsed ? "[&:not(.cl-organizationSwitcherPopoverCard_*)]:hidden" : ""),
              organizationSwitcherTriggerIcon: 
                "[&:not(.cl-organizationSwitcherPopoverCard_*)]:flex " + 
                (isCollapsed ? "[&:not(.cl-organizationSwitcherPopoverCard_*)]:hidden" : ""),
            }
          }}
        />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={activeNavMain} />
        <NavProjects projects={activeProjects} />
      </SidebarContent>
      <SidebarFooter>
        <UserButton />
      </SidebarFooter>
      <SidebarRail/>
    </Sidebar>
  )
}
