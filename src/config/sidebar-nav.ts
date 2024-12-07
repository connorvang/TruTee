import {
  CalendarIcon,
  ChartBar,
  CircleDollarSign,
  HelpCircle,
  LandPlot,
  MessagesSquare,
  SettingsIcon,
  TagIcon,
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
      url: "/admin/settings",
      icon: SettingsIcon,
    },
    {
      name: "Help",
      url: "#",
      icon: HelpCircle,
    },
  ],
} as const 