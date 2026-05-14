import { apiRequest } from "@/lib/api";

export type Activity = {
  id: string;
  title: string;
  description?: string;
  location?: string;
  startDate?: unknown;
  endDate?: unknown;
  tags?: string[];
  language?: string;
  type?: string;
  organizer?: unknown;
  maxParticipants?: number;
  currentParticipants?: number;
  imageUrl?: string;
  relevanceScore?: number;
};

export function getActivityRecommendations() {
  return apiRequest<{ recommendations: Activity[] }>("/activities/recommendations").then((data) => data.recommendations);
}

export function getActivities() {
  return apiRequest<{ activities: Activity[] }>("/activities").then((data) => data.activities);
}

export function createActivity(activity: Partial<Activity>) {
  return apiRequest<{ activity: Activity }>("/activities", {
    method: "POST",
    body: JSON.stringify(activity),
  }).then((data) => data.activity);
}

export function uploadActivityImage(id: string, file: File) {
  const formData = new FormData();
  formData.append("image", file);
  return apiRequest<{ imageUrl: string }>(`/activities/${id}/image`, {
    method: "POST",
    body: formData,
  });
}

export function joinActivity(id: string) {
  return apiRequest<{ message: string }>(`/activities/${id}/join`, { method: "POST" });
}

export function leaveActivity(id: string) {
  return apiRequest<{ message: string }>(`/activities/${id}/leave`, { method: "POST" });
}

export function formatActivityDate(value: unknown): string {
  if (!value) return "Date à confirmer";
  if (typeof value === "string") return value;
  if (typeof value === "object" && value !== null && "_seconds" in value) {
    return new Date(Number((value as { _seconds: number })._seconds) * 1000).toLocaleDateString("fr-FR");
  }
  if (typeof value === "object" && value !== null && "seconds" in value) {
    return new Date(Number((value as { seconds: number }).seconds) * 1000).toLocaleDateString("fr-FR");
  }
  return "Date à confirmer";
}

export function getActivityCategory(activity: Activity): string {
  return activity.type || activity.tags?.[0] || "Activité";
}
