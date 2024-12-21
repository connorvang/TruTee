import { Battery, Lock, LockOpen } from "lucide-react"

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
    <div className="p-6 space-y-6">
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
          <Battery className="w-4 h-4" />
          <span>{battery}%</span>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm text-gray-600">Lock status</h3>
        <div className="flex items-center gap-2">
          {lockStatus === 'Locked' ? (
            <Lock className="w-4 h-4" />
          ) : (
            <LockOpen className="w-4 h-4" />
          )}
          <span>{lockStatus}</span>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm text-gray-600">Device ID</h3>
        <div className="text-sm break-all">{deviceId}</div>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm text-gray-600">Paired</h3>
        <div className="text-sm">{pairedDate}</div>
      </div>
    </div>
  )
}