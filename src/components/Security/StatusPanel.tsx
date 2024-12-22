import { Battery, BatteryLow, BatteryMedium, BatteryFull, Lock, LockOpen } from "lucide-react"
import { Separator } from "@/components/ui/separator"

interface StatusPanelProps {
  status: string
  battery: number
  lockStatus: string
  deviceId: string
  pairedDate: string
}

export default function StatusPanel({
  status,
  battery,
  lockStatus,
  deviceId,
  pairedDate
}: StatusPanelProps) {
  return (
    <div className="space-y-6 max-w-[320px]">
      <div className="space-y-2">
        <h3 className="text-sm text-gray-600">Status</h3>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${status === 'Online' ? 'bg-green-500' : 'bg-red-500'}`} />
          <span>{status}</span>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm text-gray-600">Battery</h3>
        <div className="flex items-center gap-2">
          {battery >= 75 ? (
            <BatteryFull className="w-5 h-5 text-green-500" />
          ) : battery >= 50 ? (
            <Battery className="w-5 h-5 text-green-500" />
          ) : battery >= 25 ? (
            <BatteryMedium className="w-5 h-5 text-orange-500" />
          ) : (
            <BatteryLow className="w-5 h-5 text-red-500" />
          )}
          <span className="text-sm text-gray-600">{battery}%</span>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm text-gray-600">Lock status</h3>
        <div className="flex items-center gap-2">
          {lockStatus === 'Locked' ? (
            <Lock className="w-4 h-4 text-gray-600" />
          ) : (
            <LockOpen className="w-4 h-4 text-gray-600" />
          )}
          <span>{lockStatus}</span>
        </div>
      </div>

      <Separator />

      <div className="space-y-2">
        <h3 className="text-sm text-gray-600">Device ID</h3>
        <div className="text-sm break-all">{deviceId}</div>
      </div>

      <Separator />

      <div className="space-y-2">
        <h3 className="text-sm text-gray-600">Paired</h3>
        <div className="text-sm">{pairedDate}</div>
      </div>
    </div>
  )
}