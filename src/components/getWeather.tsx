// src/components/WeatherInfo.tsx

import { useEffect, useState } from 'react';
import { SunIcon, CloudIcon, CloudRainIcon, CloudSnowIcon, CloudLightningIcon, CloudFogIcon, MoonIcon, CloudMoonIcon, CloudSunIcon } from 'lucide-react';

interface Weather {
  current: number;
  high: number;
  low: number;
  weatherCode: number;
  isDay: boolean;
}

const getWeatherIcon = (code: number, isDay: boolean = true) => {
  switch (code) {
    case 1000:
      return isDay ? <SunIcon className="w-4 h-4 text-yellow-500" /> : <MoonIcon className="w-4 h-4 text-gray-400" />;
    case 1100:
    case 1101:
    case 1102:
      return isDay ? <CloudSunIcon className="w-4 h-4 text-gray-400" /> : <CloudMoonIcon className="w-4 h-4 text-gray-400" />;
    case 1001:
      return <CloudIcon className="w-4 h-4 text-gray-500" />;
    case 4000:
    case 4001:
    case 4200:
    case 4201:
      return <CloudRainIcon className="w-4 h-4 text-blue-500" />;
    case 5000:
    case 5001:
    case 5100:
    case 5101:
      return <CloudSnowIcon className="w-4 h-4 text-blue-300" />;
    case 8000:
      return <CloudLightningIcon className="w-4 h-4 text-yellow-500" />;
    case 2000:
    case 2100:
      return <CloudFogIcon className="w-4 h-4 text-gray-400" />;
    default:
      return <SunIcon className="w-4 h-4 text-yellow-500" />;
  }
};

export default function WeatherInfo() {
  const [weather, setWeather] = useState<Weather>({
    current: 66,
    high: 66,
    low: 32,
    weatherCode: 1100,
    isDay: true,
  });

  useEffect(() => {
    const controller = new AbortController();

    async function fetchWeather() {
      try {
        const lat = 37.1305;
        const lon = -113.5083;

        const [currentResponse, forecastResponse] = await Promise.all([
          fetch(
            `https://api.tomorrow.io/v4/weather/realtime?location=${lat},${lon}&apikey=${process.env.NEXT_PUBLIC_WEATHER_API_KEY}&units=imperial`,
            { signal: controller.signal }
          ),
          fetch(
            `https://api.tomorrow.io/v4/weather/forecast?location=${lat},${lon}&apikey=${process.env.NEXT_PUBLIC_WEATHER_API_KEY}&units=imperial`,
            { signal: controller.signal }
          )
        ]);

        const currentData = await currentResponse.json();
        const forecastData = await forecastResponse.json();

        setWeather({
          current: Math.round(currentData.data.values.temperature),
          high: Math.round(forecastData.timelines.daily[0].values.temperatureMax),
          low: Math.round(forecastData.timelines.daily[0].values.temperatureMin),
          weatherCode: currentData.data.values.weatherCode,
          isDay: currentData.data.values.isDay,
        });
      } catch (error: unknown) {
        if (error instanceof Error && error.name === 'AbortError') return;
        console.error('Error fetching weather:', error);
      }
    }

    fetchWeather();
    const interval = setInterval(fetchWeather, 1800000); // 30 minutes

    return () => {
      clearInterval(interval);
      controller.abort();
    };
  }, []);

  return (
    <div className="flex items-center gap-2">
      <span className="flex items-center gap-1 text-lg font-semibold">
        {getWeatherIcon(weather.weatherCode, weather.isDay)}
        {weather.current}°
      </span>
      <div className="flex flex-col items-center gap-0">
        <span className="text-xs font-medium text-gray-800">{weather.high}°</span>
        <span className="text-xs text-gray-800">{weather.low}°</span>
      </div>
    </div>
  );
}