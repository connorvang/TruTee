'use client'

import { Trophy } from "lucide-react"
import { Separator } from "@/components/ui/separator"

interface CustomerStatsPanelProps {
  handicap: string
  ghinNumber: string
}

export default function CustomerStatsPanel({
  handicap,
  ghinNumber,
}: CustomerStatsPanelProps) {
  return (
    <div className="space-y-6 max-w-[320px]">
      <div className="space-y-2">
        <h3 className="text-sm text-gray-600">Handicap Index</h3>
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-gray-600" />
          <span className="text-sm font-medium">{handicap}</span>
        </div>
      </div>
    
      <Separator />

      <div className="space-y-2">
        <h3 className="text-sm text-gray-600">GHIN Number</h3>
        <div className="text-sm break-all">{ghinNumber}</div>
      </div>
    

    </div>
  )
}
