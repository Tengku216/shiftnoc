import { useState, useEffect } from 'react';
import { getWIBNow, formatWIBTime, formatWIBFullDate } from '../utils/dateUtils';

export function useRealtimeWIB() {
  const [wibDate, setWibDate] = useState<Date>(() => getWIBNow());

  useEffect(() => {
    // Tick every second for smooth realtime clock
    const timer = setInterval(() => {
      setWibDate(getWIBNow());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const hours = wibDate.getHours();
  const dayOfWeek = wibDate.getDay(); // 0 = Sunday, 6 = Saturday

  const isNight = hours >= 18 || hours < 6;
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  return {
    wibDate,
    timeString: formatWIBTime(wibDate, true),
    shortTimeString: formatWIBTime(wibDate, false),
    dateString: formatWIBFullDate(wibDate),
    year: wibDate.getFullYear(),
    month: wibDate.getMonth() + 1,
    day: wibDate.getDate(),
    isNight,
    isWeekend,
  };
}
