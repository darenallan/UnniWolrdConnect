export type User = {
  id?: string;
  name: string;
  email: string;
  country?: string;
  major?: string;
  nationality?: string;
  university?: string;
  field?: string;
  bio?: string;
  language?: string;
  languages?: string[];
  interests?: string[];
  isMentor?: boolean;
  role?: string;
};

const TOKEN_KEY = "sc_token";
const USER_KEY = "sc_user";

export function isAuthed(): boolean {
  if (typeof window === "undefined") return false;
  return !!localStorage.getItem(TOKEN_KEY);
}

export function login(user: User) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function saveSession(token: string, user: User) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getUser(): User {
  if (typeof window === "undefined") return { name: "Étudiant", email: "" };
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { name: "Étudiant", email: "" };
}

export function saveUser(u: User) {
  localStorage.setItem(USER_KEY, JSON.stringify(u));
}
