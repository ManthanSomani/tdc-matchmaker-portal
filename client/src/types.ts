export type Gender = 'Male' | 'Female' | 'Non-binary';

export interface Customer {
  id: number;
  firstName: string;
  lastName: string;
  gender: Gender;
  city: string;
  email: string;
  designation: string;
  income: number;
  religion: string;
  wantKids: string;
  status: string;
  age?: number;
  matchScore?: number;
  scoreBreakdown?: Record<string, number>;
  explanations?: string[];
}

export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AiDraft {
  explanation: string;
  emailDraft: string;
  source: 'groq' | 'template-fallback';
}

export interface MatchPreferences {
  preferredGenders: Gender[];
  weights: { career: number; lifestyle: number; location: number; language: number };
}
