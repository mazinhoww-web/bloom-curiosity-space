import { useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

// Simple session ID generator (persists for browser session)
function getSessionId(): string {
  let sessionId = sessionStorage.getItem("analytics_session_id");
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem("analytics_session_id", sessionId);
  }
  return sessionId;
}

export function useAnalytics() {
  // Track which events have been fired to avoid duplicates
  const firedEvents = useRef<Set<string>>(new Set());

  const trackCepSearch = useCallback(async (cep: string, resultsCount: number) => {
    // Only track CEP searches with at least 5 digits
    const cleanCep = cep.replace(/\D/g, "");
    if (cleanCep.length < 5) return;

    // Deduplicate: don't fire same CEP search twice in same session
    const eventKey = `cep_${cleanCep}`;
    if (firedEvents.current.has(eventKey)) return;
    firedEvents.current.add(eventKey);

    try {
      await supabase.from("cep_search_events").insert({
        cep: cleanCep,
        results_count: resultsCount,
        session_id: getSessionId(),
        user_agent: navigator.userAgent,
        referrer: document.referrer || null,
      });
    } catch (error) {
      console.error("Failed to track CEP search:", error);
    }
  }, []);

  const trackSchoolView = useCallback(async (schoolId: string) => {
    // Deduplicate: only track once per school per session
    const eventKey = `school_${schoolId}`;
    if (firedEvents.current.has(eventKey)) return;
    firedEvents.current.add(eventKey);

    try {
      await supabase.from("school_view_events").insert({
        school_id: schoolId,
        session_id: getSessionId(),
        user_agent: navigator.userAgent,
        referrer: document.referrer || null,
      });
    } catch (error) {
      console.error("Failed to track school view:", error);
    }
  }, []);

  const trackListView = useCallback(async (
    listId: string, 
    schoolId: string, 
    gradeId: string
  ) => {
    // Deduplicate: only track once per list per session
    const eventKey = `list_${listId}`;
    if (firedEvents.current.has(eventKey)) return;
    firedEvents.current.add(eventKey);

    try {
      await supabase.from("list_view_events").insert({
        list_id: listId,
        school_id: schoolId,
        grade_id: gradeId,
        session_id: getSessionId(),
        user_agent: navigator.userAgent,
        referrer: document.referrer || null,
      });
    } catch (error) {
      console.error("Failed to track list view:", error);
    }
  }, []);

  return {
    trackCepSearch,
    trackSchoolView,
    trackListView,
  };
}
