import { supabase } from "@/integrations/supabase/client";

type EventType =
  | "view"
  | "click_phone"
  | "click_email"
  | "click_website"
  | "click_contact"
  | "lead_brochure"
  | "lead_visit"
  | "lead_callback";

const SESSION_KEY = "sc_session_id";
function getSessionId() {
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

// Dedupe consecutive views per residence per session
const VIEWED_KEY = "sc_viewed";
function alreadyViewed(rid: string) {
  try {
    const arr: string[] = JSON.parse(sessionStorage.getItem(VIEWED_KEY) ?? "[]");
    return arr.includes(rid);
  } catch { return false; }
}
function markViewed(rid: string) {
  try {
    const arr: string[] = JSON.parse(sessionStorage.getItem(VIEWED_KEY) ?? "[]");
    if (!arr.includes(rid)) {
      arr.push(rid);
      sessionStorage.setItem(VIEWED_KEY, JSON.stringify(arr.slice(-50)));
    }
  } catch { /* ignore */ }
}

export async function trackResidenceEvent(residenceId: string, eventType: EventType) {
  if (!residenceId) return;
  if (eventType === "view") {
    if (alreadyViewed(residenceId)) return;
    markViewed(residenceId);
  }
  const { data: { user } } = await supabase.auth.getUser();
  await supabase.from("residence_events").insert({
    residence_id: residenceId,
    event_type: eventType,
    user_id: user?.id ?? null,
    session_id: getSessionId(),
    user_agent: navigator.userAgent.slice(0, 200),
    referrer: document.referrer.slice(0, 200) || null,
  });
}
