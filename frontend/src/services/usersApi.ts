import { apiRequest } from "@/lib/api";
import { saveUser } from "@/lib/auth";

export type UserProfile = {
  id: string;
  name: string;
  email?: string;
  country?: string;
  language?: string;
  major?: string;
  interests?: string[];
  bio?: string;
  avatar?: string;
  role?: string;
  updatedAt?: unknown;
};

export type UserProfileUpdate = {
  name?: string;
  country?: string;
  language?: string;
  major?: string;
  interests?: string[];
  bio?: string;
  avatar?: string;
};

export function getMe() {
  return apiRequest<UserProfile>("/users/me");
}

export function getUserById(id: string) {
  return apiRequest<UserProfile>(`/users/${id}`);
}

export async function updateMe(updates: UserProfileUpdate) {
  const response = await apiRequest<{ message: string; updates: UserProfileUpdate }>("/users/me", {
    method: "PUT",
    body: JSON.stringify(updates),
  });
  const current = await getMe();
  saveUser({
    ...current,
    nationality: current.country,
    field: current.major,
    isMentor: current.role === "mentor",
  });
  return { ...response, user: current };
}
export async function uploadAvatar(file: File) {
  const formData = new FormData();
  formData.append("avatar", file);

  const response = await apiRequest<{ message: string; avatarUrl: string }>("/users/me/avatar", {
    method: "POST",
    body: formData,
  });

  return response;
}

export function getStats() {
  return apiRequest<{ matches: number; groups: number; events: number; totalActivities: number }>("/users/me/stats");
}

export function searchUsers(q: string) {
  return apiRequest<{ users: any[] }>(`/users/search?q=${encodeURIComponent(q)}`);
}
