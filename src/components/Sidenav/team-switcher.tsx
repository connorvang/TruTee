"use client"

import * as React from "react"
import { ChevronsUpDown, LandPlot, Plus } from "lucide-react"
import { useCourse } from '@/contexts/CourseContext'
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

interface GolfCourse {
  id: string
  name: string
  location: string
}

export function TeamSwitcher() {
  const { isMobile } = useSidebar()
  const { activeCourse, setActiveCourse } = useCourse()
  const [courses, setCourses] = React.useState<GolfCourse[]>([])
  const supabase = createClientComponentClient()

  // Fetch all golf courses
  React.useEffect(() => {
    async function loadCourses() {
      const { data, error } = await supabase
        .from('golf_courses')
        .select('id, name, location')

      if (error) {
        console.error('Error loading courses:', error)
        return
      }

      if (data) {
        setCourses(data)
      }
    }

    loadCourses()
  }, [])

  if (!activeCourse) {
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
                  {activeCourse.name}
                </span>
                <span className="truncate text-xs">{activeCourse.location}</span>
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
            {courses.map((course) => (
              <DropdownMenuItem
                key={course.id}
                onClick={() => setActiveCourse(course)}
                className="gap-2 p-2"
              >
                <div className="flex size-6 items-center justify-center rounded-sm border">
                  <LandPlot size={16} />
                </div>
                <div className="flex flex-col">
                  <span>{course.name}</span>
                  <span className="text-xs text-muted-foreground">{course.location}</span>
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
