import { Input } from "../ui/input";
import { TeeTimeSettings } from "./teeTimesSettings";

interface SimulatorSettingsProps {
    settings: TeeTimeSettings;
    handleChange: (newSettings: TeeTimeSettings) => void;
  }
 // This component can be expanded with specific settings for simulators if needed
 export function SimulatorSettings({ settings, handleChange }: SimulatorSettingsProps) {
    console.log("SimulatorSettings props:", settings);

    const generateTimesForSimulators = () => {
        const times = [];
        const startTime = new Date();
        startTime.setHours(0, 0, 0, 0);
        const endTime = new Date();
        endTime.setHours(23, 59, 0, 0);

        for (let sim = 1; sim <= settings.number_of_simulators; sim++) {
            const currentTime = new Date(startTime);
            
            while (currentTime <= endTime) {
                const endTimeSlot = new Date(currentTime);
                // Ensure the end time is always 30 minutes after the start time
                endTimeSlot.setMinutes(currentTime.getMinutes() + 30);
                
                times.push({
                    start_time: currentTime.toISOString(),
                    end_time: endTimeSlot.toISOString(),
                    available_spots: 1,
                    booked_spots: 0,
                    simulator: sim,
                    price: settings.price
                });
                currentTime.setMinutes(currentTime.getMinutes() + 30);
            }
        }
        
        return times;
    };

    return (
        <>
            <li className="p-5 border-b border-gray-100">
                <div className="flex items-start justify-between gap-16">
                    <div className="flex-1">
                        <div className="font-medium text-md">Price</div>
                        <div className="text-gray-600 text-sm">Enter the price it costs per 30 minute booking.</div>
                    </div>
                    <div className="flex-1">
                        <Input
                            type="text"
                            id="price"
                            value={settings.price.toFixed(2)}
                            onChange={(e) => {
                                handleChange({ ...settings, price: parseFloat(e.target.value) || 0 });
                            }}
                            className="w-40"
                        />
                    </div>
                </div>
            </li>
            
            <li className="p-5">
                <div className="flex items-start justify-between gap-16">
                    <div className="flex-1">
                        <div className="font-medium text-md">Number of Simulators</div>
                        <div className="text-gray-600 text-sm">Enter the total number of simulators available.</div>
                    </div>
                    <div className="flex-1">
                        <Input
                            type="number"
                            id="number_of_simulators"
                            value={settings.number_of_simulators}
                            onChange={(e) => {
                                const newValue = parseInt(e.target.value) || 0;
                                handleChange({ 
                                    ...settings, 
                                    number_of_simulators: newValue,
                                    simulatorTimes: generateTimesForSimulators()
                                });
                            }}
                            className="w-40"
                        />
                    </div>
                </div>
            </li>
        </>
    );
  }