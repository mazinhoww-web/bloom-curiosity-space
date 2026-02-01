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

  // Track store cart section view (when user sees the store comparison)
  const trackStoreCartView = useCallback(async (
    listId: string,
    schoolId: string,
    storeIds: string[]
  ) => {
    // Deduplicate: only track once per list per session
    const eventKey = `storecart_${listId}`;
    if (firedEvents.current.has(eventKey)) return;
    firedEvents.current.add(eventKey);

    try {
      // Track a store click with no item_id to indicate cart view
      // We'll track one event with metadata about stores shown
      await supabase.from("store_click_events").insert({
        store_id: storeIds[0] || null, // Primary store shown
        school_id: schoolId,
        list_id: listId,
        item_id: null, // null item_id indicates cart view, not item click
        session_id: getSessionId(),
        user_agent: navigator.userAgent,
        referrer: document.referrer || null,
      });
    } catch (error) {
      console.error("Failed to track store cart view:", error);
    }
  }, []);

  // Track store click (when user clicks "Buy all" or individual item)
  const trackStoreClick = useCallback(async (
    storeId: string,
    schoolId?: string,
    listId?: string,
    itemId?: string
  ) => {
    // Don't deduplicate clicks - users may click multiple times intentionally
    try {
      await supabase.from("store_click_events").insert({
        store_id: storeId,
        school_id: schoolId || null,
        list_id: listId || null,
        item_id: itemId || null,
        session_id: getSessionId(),
        user_agent: navigator.userAgent,
        referrer: document.referrer || null,
      });
    } catch (error) {
      console.error("Failed to track store click:", error);
    }
  }, []);

  // Track upload completed event
  const trackUploadCompleted = useCallback(async (
    uploadedListId: string,
    metadata?: Record<string, unknown>
  ) => {
    try {
      await supabase.from("upload_events").insert([{
        uploaded_list_id: uploadedListId,
        event_type: "upload_completed",
        session_id: getSessionId(),
        metadata: metadata as Record<string, string | number | boolean | null> | null,
      }]);
    } catch (error) {
      console.error("Failed to track upload completed:", error);
    }
  }, []);

  return {
    trackCepSearch,
    trackSchoolView,
    trackListView,
    trackStoreCartView,
    trackStoreClick,
    trackUploadCompleted,
    getSessionId,
  };
}

// Export session ID getter for use outside React components
export { getSessionId };
