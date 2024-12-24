'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Calendar, ExternalLink } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { fetchGolferScores } from '@/app/api/ghin'

interface Score {
  id: number;
  course_name: string;
  played_at: string;
  adjusted_gross_score: number;
  course_rating: number;
  slope_rating: number;
  score_type: string;
  score_type_display_full: string;
  tee_name: string;
}

export default function RecentScoresList({ ghinNumber }: { ghinNumber: string }) {
  const { toast } = useToast()
  const [scores, setScores] = useState<Score[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadScores = async () => {
      try {
        setLoading(true)
        const data = await fetchGolferScores(ghinNumber)
        setScores(data.revision_scores.scores || [])
      } catch (error) {
        console.error('Error fetching scores:', error)
        toast({
          title: "Error loading scores",
          description: "Failed to load golf scores. Please try again later.",
          variant: "destructive",
        })
        setScores([])
      } finally {
        setLoading(false)
      }
    }

    if (ghinNumber) {
      loadScores()
    }
  }, [ghinNumber, toast])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const Skeleton = () => (
    <div className="flex flex-col">
      {Array.from({ length: 3 }).map((_, idx) => (
        <div key={idx} className="flex items-center border-b px-6 py-5 border-gray-100">
          <div className="flex-1">
            <div className="h-5 w-32 bg-gray-200 rounded animate-pulse mb-2" />
            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="flex gap-2">
            <div className="w-20 h-8 bg-gray-200 rounded animate-pulse" />
            <div className="w-8 h-8 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  )

  return (
    <div className="space-y-4 w-full pb-12">
      
      <div className="bg-gray-50 p-1 rounded-2xl overflow-hidden">
        <div className="bg-white border border-black/6 rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <Skeleton />
          ) : scores.length === 0 ? (
            <div className="p-6 text-sm text-gray-500">
              No golf scores found for this player.
            </div>
          ) : (
            scores.map((score) => (
              <div 
                key={score.id}
                className="flex items-center px-6 py-4 border-b border-gray-100"
              >
                <div className="space-y-1 pr-3 flex flex-1 flex-col">
                  <div className="text-base font-medium">
                    {score.course_name}
                    <span className="text-sm text-gray-500 ml-2">
                      ({score.tee_name})
                    </span>
                  </div>
                  <div className="text-sm text-gray-500 flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {formatDate(score.played_at)}
                  </div>
                </div>

                <div className="flex items-center px-3 justify-end gap-3">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="secondary" 
                          size="sm"
                          className="text-sm font-medium border bg-gray-50 border-gray-200 py-0 px-2"
                        >
                          <span className="text-sm font-medium">
                            {score.adjusted_gross_score}
                          </span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Score Type: {score.score_type_display_full}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                <div className="flex px-3 items-center gap-2">
                  <div className="text-sm text-gray-500">
                    Rating: {score.course_rating} / Slope: {score.slope_rating}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
