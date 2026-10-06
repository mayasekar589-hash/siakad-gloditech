import { announcements } from "../demo/data/announcements";
import { getDemoSession } from "../../lib/auth/demo-auth";

const READ_STATE_EVENT = "siakad:announcement-read-state";

function storageKey() {
  const nim = getDemoSession()?.user.nim ?? "anonymous";
  return `siakad_announcement_reads_v2_${nim}`;
}

function initialReadSlugs() {
  return announcements.slice(3).map(({ slug }) => slug);
}

export function getReadAnnouncementSlugs() {
  if (typeof window === "undefined") return initialReadSlugs();

  try {
    const stored = window.localStorage.getItem(storageKey());
    if (!stored) return initialReadSlugs();
    const parsed: unknown = JSON.parse(stored);
    if (!Array.isArray(parsed) || !parsed.every((slug) => typeof slug === "string")) return initialReadSlugs();
    return parsed.filter((slug) => announcements.some((announcement) => announcement.slug === slug));
  } catch {
    return initialReadSlugs();
  }
}

function saveReadSlugs(slugs: string[]) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(storageKey(), JSON.stringify(slugs));
    window.dispatchEvent(new Event(READ_STATE_EVENT));
  } catch {
    return;
  }
}

export function markAnnouncementRead(slug: string) {
  const readSlugs = getReadAnnouncementSlugs();
  if (!readSlugs.includes(slug)) saveReadSlugs([...readSlugs, slug]);
}

export function markAllAnnouncementsRead() {
  saveReadSlugs(announcements.map(({ slug }) => slug));
}

export function getUnreadAnnouncementCount() {
  const readSlugs = new Set(getReadAnnouncementSlugs());
  return announcements.filter(({ slug }) => !readSlugs.has(slug)).length;
}

export function subscribeToAnnouncementReadState(listener: () => void) {
  if (typeof window === "undefined") return () => undefined;

  window.addEventListener(READ_STATE_EVENT, listener);
  window.addEventListener("storage", listener);
  return () => {
    window.removeEventListener(READ_STATE_EVENT, listener);
    window.removeEventListener("storage", listener);
  };
}
