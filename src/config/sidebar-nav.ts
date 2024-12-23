import {
  HomeIcon,
  LandPlot,
  SettingsIcon,
  ShieldCheck,
  UsersIcon,
} from "lucide-react"

export const sidebarConfig = {
  user: {
    name: "Connor Van Gilder",
    email: "cvangilder64@gmail.com",
    avatar: "/avatars/connor.JPG",
  },
  navMain: [
    {
      title: "Teesheets",
      url: "/admin",
      icon: LandPlot,
      matchExact: true,
    },
    {
      title: "Customers",
      url: "/admin/customers",
      icon: UsersIcon,
    },
    {
      title: "Security",
      url: "/admin/security",
      icon: ShieldCheck,
    },
  ],
  projects: [
    {
      name: "Settings",
      url: "/admin/settings",
      icon: SettingsIcon,
    },
    {
      name: "User portal",
      url: "/",
      icon: HomeIcon,
    },
  ],
} as const 