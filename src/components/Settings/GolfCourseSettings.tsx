import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { ArrowRight } from 'lucide-react'
import { TeeTimeSettings } from './teeTimesSettings'

interface GolfCourseSettingsProps {
  settings: TeeTimeSettings;
  handleChange: (newSettings: TeeTimeSettings) => void;
}

export function GolfCourseSettings({ settings, handleChange }: GolfCourseSettingsProps) {
  return (
    <>
      <li className="p-5 border-b border-gray-100">
        <div className="flex items-start justify-between gap-16">
          <div className="flex-1">
            <div className="font-medium text-md">Tee time interval</div>
            <div className="text-gray-600 text-sm">Choose the spacing between tee times that should be used for your course.</div>
          </div>
          <div className="flex-1">
            <Select
              value={settings.interval_minutes.toString()}
              onValueChange={(value) => 
                handleChange({
                  ...settings,
                  interval_minutes: parseInt(value),
                })
              }
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Select interval" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 minutes</SelectItem>
                <SelectItem value="12">12 minutes</SelectItem>
                <SelectItem value="15">15 minutes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </li>
      <li className="p-5 border-b border-gray-100">
        <div className="flex items-start justify-between gap-16">
          <div className="flex-1">
            <div className="font-medium text-md">Timeframe</div>
            <div className="text-gray-600 text-sm">Choose when the first and last tee times are available for players to book.</div>
          </div>
          <div className="flex flex-1 items-center gap-2">
            <Input
              type="time"
              id="firstTime"
              value={settings.first_tee_time}
              onChange={(e) => 
                handleChange({ ...settings, first_tee_time: e.target.value })
              }
              className="w-auto"
            />
            <ArrowRight className="text-gray-500" size={16} />
            <Input
              type="time"
              id="lastTime"
              value={settings.last_tee_time}
              onChange={(e) => 
                handleChange({ ...settings, last_tee_time: e.target.value })
              }
              className="w-auto"
            />
          </div>
        </div>
      </li>
      <li className="p-5">
            <div className="flex items-start justify-between gap-16">
                <div className="flex-1">
                  <div className="font-medium text-md">18 holes</div>
                  <div className="text-gray-600 text-sm">Enter the base 18 hole price.</div>
                </div>
                <div className="flex-1">
                  <Input
                    type="text"
                    id="green_fee_18"
                    value={settings.green_fee_18.toFixed(2)}
                    onChange={(e) => {
                      handleChange({ ...settings, green_fee_18: parseFloat(e.target.value) || 0 });
                    }}
              className="w-40"
            />
          </div>
        </div>
      </li>
      <li className="p-5 border-b border-gray-100">
            <div className="flex items-start justify-between gap-16">
                <div className="flex-1">
                  <div className="font-medium text-md">9 holes</div>
                  <div className="text-gray-600 text-sm">Enter the base 9 hole price.</div>
                </div>
                <div className="flex-1">
                  <Input
                    type="text"
                    id="green_fee_9"
                    value={settings.green_fee_9.toFixed(2)}
                    onChange={(e) => {
                      handleChange({ ...settings, green_fee_9: parseFloat(e.target.value) || 0 });
                    }}
              className="w-40"
            />
          </div>
        </div>
      </li>
      <li className="p-5">
            <div className="flex items-start justify-between gap-16">
                <div className="flex-1">
                  <div className="font-medium text-md">18 hole cart fee</div>
                  <div className="text-gray-600 text-sm">Cart fee for 18 holes.</div>
                </div>
                <div className="flex-1">
                  <Input
                    type="text"
                    id="cart_fee_18"
                    value={settings.cart_fee_18.toFixed(2)}
                    onChange={(e) => {
                      handleChange({ ...settings, cart_fee_18: parseFloat(e.target.value) || 0 });
                    }}
              className="w-40"
            />
          </div>
        </div>
      </li>
      <li className="p-5">
            <div className="flex items-start justify-between gap-16">
                <div className="flex-1">
                  <div className="font-medium text-md">9 hole cart fee</div>
                  <div className="text-gray-600 text-sm">Cart fee for 9 holes.</div>
                </div>
                <div className="flex-1">
                  <Input
                    type="text"
                    id="cart_fee_9"
                    value={settings.cart_fee_9.toFixed(2)}
                    onChange={(e) => {
                      handleChange({ ...settings, cart_fee_9: parseFloat(e.target.value) || 0 });
                    }}
              className="w-40"
            />
          </div>
        </div>
      </li>
    </>
  );
}