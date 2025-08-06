import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatDate = (
    timestamp: number | null, 
    locale: string = 'ja-JP',
    timeZone: string = 'Asia/Tokyo'
) => {
    if (!timestamp) return "N/A";
    const date = new Date(timestamp * 1000);
    
    return date.toLocaleString(locale, {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    }).replace(/\//g, '-');
};