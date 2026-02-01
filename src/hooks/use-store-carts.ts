import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface StoreCartItem {
  item_id: string;
  name: string;
  quantity: number;
  unit: string | null;
  price_estimate: number | null;
  url: string;
}

interface StoreCart {
  store_id: string;
  store_name: string;
  logo_url: string | null;
  cart_strategy: string;
  items: StoreCartItem[];
  total_estimate: number | null;
  items_with_price: number;
  items_without_price: number;
}

interface StoreCartsResponse {
  store_carts: StoreCart[];
  total_items: number;
  school_id: string;
}

interface StoreRecommendation {
  store_id: string;
  store_name: string;
  score: number;
  reason: string;
  cart_clicks: number;
  item_clicks: number;
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

export function useStoreCarts(listId: string | null | undefined) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["store-carts", listId],
    queryFn: async () => {
      if (!listId) return null;

      const params = new URLSearchParams({
        list_id: listId,
        session_id: getSessionId(),
      });

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/store-carts?${params.toString()}`,
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
        throw new Error(errorData.error || "Failed to fetch store carts");
      }

      return response.json() as Promise<StoreCartsResponse>;
    },
    enabled: !!listId,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  return {
    storeCarts: data?.store_carts || [],
    totalItems: data?.total_items || 0,
    schoolId: data?.school_id,
    isLoading,
    error,
  };
}

export function useStoreRecommendation(listId: string | null | undefined, schoolId: string | undefined) {
  const { data, isLoading } = useQuery({
    queryKey: ["store-recommendation", listId, schoolId],
    queryFn: async () => {
      if (!listId) return null;

      const { data, error } = await supabase.rpc("get_recommended_store", {
        _list_id: listId,
        _school_id: schoolId || null,
      });

      if (error) {
        console.error("Failed to get store recommendation:", error);
        return null;
      }

      // RPC returns array, get first result
      if (data && data.length > 0) {
        return data[0] as StoreRecommendation;
      }

      return null;
    },
    enabled: !!listId,
    staleTime: 1000 * 60 * 10, // Cache for 10 minutes
  });

  return {
    recommendation: data,
    isLoading,
  };
}

export function useStoreCartActions() {
  const [isOpening, setIsOpening] = useState(false);

  const trackStoreClick = useCallback(async (
    storeId: string,
    schoolId?: string,
    listId?: string
  ) => {
    try {
      const { supabase } = await import("@/integrations/supabase/client");
      await supabase.from("store_click_events").insert({
        store_id: storeId,
        school_id: schoolId || null,
        list_id: listId || null,
        session_id: getSessionId(),
        user_agent: navigator.userAgent,
        referrer: document.referrer || null,
      });
    } catch (error) {
      console.error("Failed to track store click:", error);
    }
  }, []);

  const openAllItemsInStore = useCallback(async (
    storeCart: StoreCart,
    schoolId?: string,
    listId?: string
  ) => {
    setIsOpening(true);

    // Track the click
    await trackStoreClick(storeCart.store_id, schoolId, listId);

    // Open all item links (browser may block popups for more than 1)
    // For SEARCH strategy, we open each item in a new tab
    if (storeCart.cart_strategy === 'SEARCH') {
      // Open first link immediately (less likely to be blocked)
      if (storeCart.items.length > 0) {
        window.open(storeCart.items[0].url, "_blank");
      }

      // For remaining items, open with small delay to avoid popup blockers
      for (let i = 1; i < storeCart.items.length; i++) {
        setTimeout(() => {
          window.open(storeCart.items[i].url, "_blank");
        }, i * 300); // 300ms delay between each
      }
    }

    setIsOpening(false);
  }, [trackStoreClick]);

  const openSingleItem = useCallback(async (
    url: string,
    storeId: string,
    itemId: string,
    schoolId?: string,
    listId?: string
  ) => {
    // Track the item click
    try {
      const { supabase } = await import("@/integrations/supabase/client");
      await supabase.from("store_click_events").insert({
        store_id: storeId,
        item_id: itemId,
        school_id: schoolId || null,
        list_id: listId || null,
        session_id: getSessionId(),
        user_agent: navigator.userAgent,
        referrer: document.referrer || null,
      });
    } catch (error) {
      console.error("Failed to track item click:", error);
    }

    window.open(url, "_blank");
  }, []);

  return {
    openAllItemsInStore,
    openSingleItem,
    trackStoreClick,
    isOpening,
  };
}
