
import { CalculatedDuration } from '../types';

/**
 * Parses a string into minutes. Supports: "9", "9am", "5:30pm", "14:00", "9.45"
 */
export const parseToMinutes = (timeStr: string): number | null => {
  const cleanStr = timeStr.trim().toLowerCase();
  if (!cleanStr) return null;

  // Detect AM/PM
  const isPM = cleanStr.includes('p');
  const isAM = cleanStr.includes('a');
  
  // Extract digits
  const match = cleanStr.match(/(\d+)(?::(\d+))?(?:\.(\d+))?/);
  if (!match) return null;

  let h = parseInt(match[1], 10);
  let m = match[2] ? parseInt(match[2], 10) : (match[3] ? parseInt(match[3], 10) : 0);

  if (isNaN(h) || isNaN(m) || m > 59) return null;

  // Normalize 12-hour clock
  if (isPM && h < 12) h += 12;
  if (isAM && h === 12) h = 0;
  
  // Basic validation
  if (h > 23) return null;

  return h * 60 + m;
};

/**
 * Calculates the duration between two times.
 * Intelligently wraps around 12h for ambiguous formats (9-5) 
 * or 24h for clearly defined late shifts.
 */
export const parseTimeRangeDetailed = (range: string): { minutes: number | null, error?: string } => {
  const parts = range.split(/\s*-\s*|\s+to\s+/i).map(p => p.trim());
  
  if (parts.length === 1 && parts[0] === '') return { minutes: null };
  if (parts.length !== 2) return { minutes: null, error: 'Expected: 9am-5pm' };

  const start = parseToMinutes(parts[0]);
  const end = parseToMinutes(parts[1]);

  if (start === null) return { minutes: null, error: `Invalid start` };
  if (end === null) return { minutes: null, error: `Invalid end` };

  let diff = end - start;

  // Wrap logic:
  // If end is before start, it's likely a wrap-around.
  if (diff < 0) {
    // If input was ambiguous (no AM/PM), we assume a 12h wrap (e.g., 11 to 2)
    const isAmbiguous = !range.toLowerCase().match(/[ap]/);
    if (isAmbiguous && diff + 12 * 60 > 0) {
      diff += 12 * 60;
    } else {
      // Otherwise assume 24h wrap (e.g., 10pm to 2am)
      diff += 24 * 60;
    }
  }
  
  return { minutes: diff };
};

export const formatMinutesToHM = (minutes: number): string => {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
};

export const formatMinutesToHHMM = (minutes: number): string => {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

export const calculateLineDurations = (input: string): CalculatedDuration[] => {
  const lines = input.split('\n').filter(l => l.trim().length > 0);
  return lines.map(line => {
    const { minutes, error } = parseTimeRangeDetailed(line);
    
    if (minutes === null || error) {
      return { 
        line, 
        minutes: 0, 
        label: 'Range',
        error: error || 'Invalid'
      };
    }
    
    return {
      line,
      minutes,
      label: 'Range'
    };
  });
};
