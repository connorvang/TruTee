"use client"

import * as React from "react"
import {
  AudioWaveform,
  CalendarIcon,
  ChartBar,
  CircleDollarSign,
  Command,
  GalleryVerticalEnd,
  HelpCircle,
  LandPlot,
  MessagesSquare,
  SettingsIcon,
  TagIcon,
  UsersIcon,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

// This is sample data.
const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      name: "Green Spring Golf Club",
      logo: GalleryVerticalEnd,
      plan: "Professional",
    },
    {
      name: "Acme Corp.",
      logo: AudioWaveform,
      plan: "Startup",
    },
    {
      name: "Evil Corp.",
      logo: Command,
      plan: "Free",
    },
  ],
  navMain: [
    {
      title: "Teesheets",
      url: "#",
      icon: LandPlot,
      isActive: true,
    },
    {
      title: "Events",
      url: "#",
      icon: CalendarIcon,
    },
    {
      title: "Customers",
      url: "#",
      icon: UsersIcon,
    },
    {
      title: "Pricing",
      url: "#",
      icon: CircleDollarSign,
    },
    {
      title: "Promotions",
      url: "#",
      icon: TagIcon,
    },
    {
      title: "Messages",
      url: "#",
      icon: MessagesSquare,
    },
    {
      title: "Reports",
      url: "#",
      icon: ChartBar,
    },
  ],
  projects: [
    {
      name: "Settings",
      url: "#",
      icon: SettingsIcon,
    },
    {
      name: "Help",
      url: "#",
      icon: HelpCircle,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavProjects projects={data.projects} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
