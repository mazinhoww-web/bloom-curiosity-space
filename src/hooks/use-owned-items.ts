import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";

const OWNED_KEY = "listinha_owned_items";

function loadOwned(): Set<string> {
  try {
    const stored = localStorage.getItem(OWNED_KEY);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch {
    return new Set();
  }
}

function saveOwned(items: Set<string>) {
  localStorage.setItem(OWNED_KEY, JSON.stringify([...items]));
}

export function useOwnedItems() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [ownedIds, setOwnedIds] = useState<Set<string>>(() => {
    // Check URL params first, then localStorage
    const urlOwned = searchParams.get("owned");
    if (urlOwned) {
      return new Set(urlOwned.split(",").filter(Boolean));
    }
    return loadOwned();
  });

  // Sync URL params to localStorage on mount
  useEffect(() => {
    const urlOwned = searchParams.get("owned");
    if (urlOwned) {
      const urlSet = new Set(urlOwned.split(",").filter(Boolean));
      // Merge URL with localStorage
      const localSet = loadOwned();
      const merged = new Set([...localSet, ...urlSet]);
      setOwnedIds(merged);
      saveOwned(merged);
    }
  }, []);

  // Persist to localStorage whenever owned items change
  useEffect(() => {
    saveOwned(ownedIds);
  }, [ownedIds]);

  const toggleOwned = useCallback((itemId: string) => {
    setOwnedIds((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  }, []);

  const isOwned = useCallback(
    (itemId: string) => ownedIds.has(itemId),
    [ownedIds]
  );

  const clearOwned = useCallback(() => {
    setOwnedIds(new Set());
  }, []);

  const ownedCount = ownedIds.size;

  // Generate shareable URL with owned items
  const getShareableUrl = useCallback(
    (baseUrl: string) => {
      if (ownedIds.size === 0) return baseUrl;
      const url = new URL(baseUrl);
      url.searchParams.set("owned", [...ownedIds].join(","));
      return url.toString();
    },
    [ownedIds]
  );

  // Update URL with current owned state
  const updateUrlWithOwned = useCallback(() => {
    if (ownedIds.size > 0) {
      setSearchParams(
        (prev) => {
          prev.set("owned", [...ownedIds].join(","));
          return prev;
        },
        { replace: true }
      );
    } else {
      setSearchParams(
        (prev) => {
          prev.delete("owned");
          return prev;
        },
        { replace: true }
      );
    }
  }, [ownedIds, setSearchParams]);

  return {
    ownedIds,
    toggleOwned,
    isOwned,
    clearOwned,
    ownedCount,
    getShareableUrl,
    updateUrlWithOwned,
  };
}
