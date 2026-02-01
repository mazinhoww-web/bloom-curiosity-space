import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface PartnerStore {
  id: string;
  name: string;
  logo_url: string | null;
  order_index: number;
}

interface ResolveLinkResult {
  url: string;
  store_name: string;
  item_name: string;
}

// Get session ID for tracking
function getSessionId(): string {
  let sessionId = sessionStorage.getItem("analytics_session_id");
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem("analytics_session_id", sessionId);
  }
  return sessionId;
}

export function usePartnerStores() {
  const { data: stores, isLoading } = useQuery({
    queryKey: ["partner-stores"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("partner_stores")
        .select("id, name, logo_url, order_index")
        .eq("is_active", true)
        .order("order_index");

      if (error) throw error;
      return data as PartnerStore[];
    },
    staleTime: 1000 * 60 * 10, // Cache for 10 minutes
  });

  return { stores: stores || [], isLoading };
}

export function useLinkResolver() {
  const [isResolving, setIsResolving] = useState(false);

  const resolveLink = useCallback(async (
    itemId: string,
    storeId: string,
    schoolId?: string,
    listId?: string
  ): Promise<ResolveLinkResult | null> => {
    setIsResolving(true);
    
    try {
      const params = new URLSearchParams({
        item_id: itemId,
        store_id: storeId,
        session_id: getSessionId(),
      });
      
      if (schoolId) params.set("school_id", schoolId);
      if (listId) params.set("list_id", listId);

      const { data, error } = await supabase.functions.invoke("resolve-link", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        body: null,
      });

      // Since invoke doesn't support query params well, we'll use fetch directly
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/resolve-link?${params.toString()}`,
        {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error("[useLinkResolver] Error:", errorData);
        return null;
      }

      const result = await response.json();
      return result as ResolveLinkResult;
    } catch (error) {
      console.error("[useLinkResolver] Failed to resolve link:", error);
      return null;
    } finally {
      setIsResolving(false);
    }
  }, []);

  const openPurchaseLink = useCallback(async (
    itemId: string,
    storeId: string,
    schoolId?: string,
    listId?: string
  ) => {
    const result = await resolveLink(itemId, storeId, schoolId, listId);
    if (result?.url) {
      window.open(result.url, "_blank");
    }
    return result;
  }, [resolveLink]);

  return {
    resolveLink,
    openPurchaseLink,
    isResolving,
  };
}
