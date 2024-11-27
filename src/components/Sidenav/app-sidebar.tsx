"use client"

import * as React from "react"
import { usePathname } from "next/navigation"

import { NavMain } from "@/components/Sidenav/nav-main"
import { NavProjects } from "@/components/Sidenav/nav-projects"
import { TeamSwitcher } from "@/components/Sidenav/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { sidebarConfig } from "@/config/sidebar-nav"
import { UserButton } from "@clerk/nextjs"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()

  const activeNavMain = sidebarConfig.navMain.map(item => ({
    ...item,
    isActive: 'matchExact' in item
      ? pathname === item.url
      : pathname.startsWith(item.url) && item.url !== "#"
  }))

  const activeProjects = sidebarConfig.projects.map(item => ({
    ...item,
    isActive: item.url !== "#" && pathname.startsWith(item.url)
  }))

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={activeNavMain} />
        <NavProjects projects={activeProjects} />
      </SidebarContent>
      <SidebarFooter>
        <UserButton />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
