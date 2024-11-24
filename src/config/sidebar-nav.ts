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
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Teesheets",
      url: "/teesheets",
      icon: LandPlot,
      matchExact: true,
    },
    {
      title: "Events",
      url: "/events",
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
      url: "/settings",
      icon: SettingsIcon,
    },
    {
      name: "Help",
      url: "#",
      icon: HelpCircle,
    },
  ],
} as const 