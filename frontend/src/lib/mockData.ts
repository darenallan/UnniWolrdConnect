// Ce fichier est déprécié. Utilisez constants.ts pour les listes statiques
// et les services API pour les données dynamiques.

export type Student = {
  id: string;
  name: string;
  nationality: string;
  flag: string;
  field: string;
  university: string;
  languages: string[];
  interests: string[];
  bio: string;
  compatibility: number;
  isMentor?: boolean;
  expertise?: string;
  availability?: string;
};

export type EventItem = {
  id: string;
  title: string;
  date: string;
  location: string;
  category: "Culturel" | "Sportif" | "Académique" | "Social";
  participants: number;
  emoji: string;
};

export type Group = {
  id: string;
  name: string;
  description: string;
  emoji: string;
  language: string;
  members: number;
};
