import { useEffect, useState } from "react";
import { events as seedEvents, type EventItem } from "./mockData";

const KEY = "sc_events";
const JOINED_KEY = "sc_joined_events";

function read(): EventItem[] {
  if (typeof window === "undefined") return seedEvents;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return seedEvents;
}

function write(list: EventItem[]) {
  localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new Event("sc_events_change"));
}

export function useEvents() {
  const [list, setList] = useState<EventItem[]>(seedEvents);
  useEffect(() => {
    setList(read());
    const h = () => setList(read());
    window.addEventListener("sc_events_change", h);
    return () => window.removeEventListener("sc_events_change", h);
  }, []);
  return list;
}

export function addEvent(e: EventItem) {
  const list = read();
  write([e, ...list]);
}

export function getJoined(): string[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(JOINED_KEY) || "[]"); } catch { return []; }
}

export function toggleJoined(id: string): boolean {
  const cur = getJoined();
  const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
  localStorage.setItem(JOINED_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event("sc_joined_change"));
  return next.includes(id);
}

export function useJoined() {
  const [j, setJ] = useState<string[]>([]);
  useEffect(() => {
    setJ(getJoined());
    const h = () => setJ(getJoined());
    window.addEventListener("sc_joined_change", h);
    return () => window.removeEventListener("sc_joined_change", h);
  }, []);
  return j;
}
