import { useEffect, useState } from "react";
import { groups as seedGroups, type Group } from "./mockData";

const KEY = "sc_groups";
const JOINED_KEY = "sc_joined_groups";
const EVT = "sc_groups_change";

function read<T>(k: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(k);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(k: string, v: T) {
  localStorage.setItem(k, JSON.stringify(v));
  window.dispatchEvent(new Event(EVT));
}

export function getGroups(): Group[] {
  const custom = read<Group[]>(KEY, []);
  return [...custom, ...seedGroups];
}

export function addGroup(g: Group) {
  const custom = read<Group[]>(KEY, []);
  write(KEY, [g, ...custom]);
}

export function getJoinedGroups(): string[] {
  return read<string[]>(JOINED_KEY, ["g1"]);
}

export function toggleJoinedGroup(id: string): boolean {
  const cur = getJoinedGroups();
  const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
  write(JOINED_KEY, next);
  return next.includes(id);
}

function useStoreValue<T>(getter: () => T): T {
  const [v, setV] = useState<T>(getter);
  useEffect(() => {
    setV(getter());
    const h = () => setV(getter());
    window.addEventListener(EVT, h);
    window.addEventListener("storage", h);
    return () => {
      window.removeEventListener(EVT, h);
      window.removeEventListener("storage", h);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return v;
}

export function useGroups() {
  return useStoreValue(getGroups);
}
export function useJoinedGroups() {
  return useStoreValue(getJoinedGroups);
}
