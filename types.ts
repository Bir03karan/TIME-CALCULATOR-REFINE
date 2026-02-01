
export interface UserProfile {
  name: string;
  role: string;
  avatarEmoji: string;
  avatarImage?: string; // Base64 or URL for custom avatar
  email?: string;
}

export interface TimeCalculation {
  id: string;
  date: string;
  input: string;
  durations: CalculatedDuration[];
  totalMinutes: number;
}

export interface CalculatedDuration {
  line: string;
  minutes: number;
  label: string;
  date?: string;
  error?: string;
}

export interface AppSettings {
  defaultWorkDayMinutes: number;
  autoSave: boolean;
  theme: 'light' | 'dark';
  profile: UserProfile;
  isOnboarded: boolean;
  isAuthenticated: boolean;
}
