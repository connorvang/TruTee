import { Input } from "../ui/input";
import { TeeTimeSettings } from "./teeTimesSettings";

interface SimulatorSettingsProps {
    settings: TeeTimeSettings;
    handleChange: (newSettings: TeeTimeSettings) => void;
}

export function SimulatorSettings({ settings, handleChange }: SimulatorSettingsProps) {
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
                                    number_of_simulators: newValue
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