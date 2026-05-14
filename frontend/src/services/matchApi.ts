import { apiRequest } from "@/lib/api";

export type MatchSuggestion = {
  id: string;
  name: string;
  country?: string;
  language?: string;
  major?: string;
  interests?: string[];
  bio?: string;
  avatar?: string;
  role?: string;
  compatibilityScore: number;
  matchReason?: string;
  isAIRecommended?: boolean;
};

export type StudentCardProfile = {
  id: string;
  name: string;
  nationality: string;
  flag?: string;
  field: string;
  university?: string;
  languages: string[];
  interests: string[];
  bio?: string;
  compatibility: number;
  isMentor?: boolean;
  avatar?: string;
  matchReason?: string;
  isAIRecommended?: boolean;
};

export function toStudentCardProfile(profile: MatchSuggestion): StudentCardProfile {
  return {
    id: profile.id,
    name: profile.name,
    nationality: profile.country || "—",
    field: profile.major || "Étudiant",
    languages: profile.language ? [profile.language] : [],
    interests: profile.interests || [],
    bio: profile.bio,
    compatibility: profile.compatibilityScore || 0,
    isMentor: profile.role === "mentor",
    avatar: profile.avatar,
    matchReason: profile.matchReason,
    isAIRecommended: profile.isAIRecommended,
  };
}

export async function getSuggestions() {
  const data = await apiRequest<{ suggestions: MatchSuggestion[] }>("/match/suggestions");
  return data.suggestions.map(toStudentCardProfile);
}

export async function getAISuggestions() {
  const data = await apiRequest<{ suggestions: MatchSuggestion[] }>("/match/ai-suggestions");
  return data.suggestions.map(toStudentCardProfile);
}

export async function getMentors() {
  const data = await apiRequest<{ mentors: MatchSuggestion[] }>("/match/mentors");
  return data.mentors.map(toStudentCardProfile);
}
