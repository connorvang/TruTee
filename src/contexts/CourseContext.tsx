"use client"

import { createContext, useContext, useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { COURSE_ID } from '@/lib/constants'

interface Course {
  id: string
  name: string
  location: string
}

interface CourseContextType {
  activeCourse: Course | null
  setActiveCourse: (course: Course) => void
  isLoading: boolean
}

const CourseContext = createContext<CourseContextType | undefined>(undefined)

export function CourseProvider({ children }: { children: React.ReactNode }) {
  const [activeCourse, setActiveCourse] = useState<Course | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    async function loadCourse() {
      try {
        const { data: course, error } = await supabase
          .from('golf_courses')
          .select('id, name, location')
          .eq('id', COURSE_ID)
          .single()
        
        if (error) {
          console.error('Error fetching course:', error)
          return
        }

        if (course) {
          console.log('Course loaded:', course)
          setActiveCourse(course)
        } else {
          console.log('No course found')
        }
      } catch (error) {
        console.error('Error loading course:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadCourse()
  }, [])

  const value = {
    activeCourse,
    setActiveCourse,
    isLoading
  }

  return (
    <CourseContext.Provider value={value}>
      {children}
    </CourseContext.Provider>
  )
}

export const useCourse = () => {
  const context = useContext(CourseContext)
  if (context === undefined) {
    throw new Error('useCourse must be used within a CourseProvider')
  }
  return context
} 