'use client'

import { Trophy, Calendar, LandPlot, Users } from "lucide-react"
import { Separator } from "@/components/ui/separator"

interface CustomerStatsPanelProps {
  handicapIndex: string
  clubName: string
  associationName: string
  ghinNumber: string
  state: string
  country: string
}

export default function CustomerStatsPanel({
  handicapIndex,
  clubName,
  associationName,
  ghinNumber,
  state,
  country
}: CustomerStatsPanelProps) {
  return (
    <div className="space-y-6 max-w-[320px]">
      <div className="space-y-2">
        <h3 className="text-sm text-gray-600">Handicap Index</h3>
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-gray-600" />
          <span className="text-sm font-medium">{handicapIndex}</span>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm text-gray-600">Club</h3>
        <div className="flex items-center gap-2">
          <LandPlot className="w-4 h-4 text-gray-600" />
          <span className="text-sm">{clubName}</span>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm text-gray-600">Association</h3>
        <div className="flex items-center gap-2 text-sm">{associationName}</div>
      </div>
    
      <Separator />

      <div className="space-y-2">
        <h3 className="text-sm text-gray-600">GHIN Number</h3>
        <div className="text-sm break-all">{ghinNumber}</div>
      </div>

      <Separator />

      <div className="space-y-2">
        <h3 className="text-sm text-gray-600">Location</h3>
        <div className="flex items-center gap-2">
          <span className="text-sm">{state}, {country}</span>
        </div>
      </div>
    </div>
  )
}
