
export interface UserData {
  firstName: string;
  lastName: string;
  dob: string;
  specialChars: string;
}

export interface PasswordSuggestion {
  id: string;
  value: string;
  strength: 'weak' | 'medium' | 'strong';
  explanation: string;
  category: string;
  timestamp: number;
  isReused?: boolean;
  isFavorite?: boolean;
  usageLocation?: string;
  accountDetail?: string;
  notes?: string;
  websiteUrl?: string;
}

export interface GenerationState {
  loading: boolean;
  error: string | null;
  suggestions: PasswordSuggestion[];
}
