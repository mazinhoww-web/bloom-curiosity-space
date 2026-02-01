import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { normalizeCep, isCepSearch } from "@/lib/school-utils";

export interface SchoolSearchFilters {
  state: string;
  city: string;
}

export interface SchoolSearchResult {
  id: string;
  name: string;
  slug: string;
  cep: string;
  address: string | null;
  city: string | null;
  state: string | null;
  logo_url: string | null;
  is_active: boolean;
  total_count: number;
}

export interface UseSchoolSearchOptions {
  query: string;
  filters: SchoolSearchFilters;
  page: number;
  pageSize: number;
  enabled?: boolean;
  debounceMs?: number;
}

export interface UseSchoolSearchReturn {
  schools: SchoolSearchResult[];
  total: number;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  error: Error | null;
  debouncedQuery: string;
}

const DEFAULT_DEBOUNCE_MS = 300;

export function useSchoolSearch({
  query,
  filters,
  page,
  pageSize,
  enabled = true,
  debounceMs = DEFAULT_DEBOUNCE_MS,
}: UseSchoolSearchOptions): UseSchoolSearchReturn {
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const lastQueryRef = useRef(query);

  // Debounce the search query
  useEffect(() => {
    // Skip debounce if query is cleared
    if (query === "") {
      setDebouncedQuery("");
      return;
    }

    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [query, debounceMs]);

  // Determine if we should run the query
  const cleanCep = normalizeCep(debouncedQuery);
  const isCep = isCepSearch(debouncedQuery);
  const hasValidQuery = isCep || debouncedQuery.length >= 2;
  const hasFilters = !!filters.state || !!filters.city;
  const shouldQuery = enabled && (hasValidQuery || hasFilters);

  const { data, isLoading, isFetching, isError, error } = useQuery({
    queryKey: ["schools-search", debouncedQuery, filters, page, pageSize],
    queryFn: async () => {
      // Call the optimized RPC function
      const { data, error } = await supabase.rpc("search_schools", {
        search_cep: isCep ? cleanCep : null,
        search_name: isCep ? null : (debouncedQuery.length >= 2 ? debouncedQuery : null),
        filter_state: filters.state || null,
        filter_city: filters.city || null,
        page_number: page,
        page_size: pageSize,
      });

      if (error) throw error;

      const results = (data || []) as SchoolSearchResult[];
      const total = results.length > 0 ? Number(results[0].total_count) : 0;

      return {
        schools: results,
        total,
      };
    },
    staleTime: 30000, // 30 second cache
    enabled: shouldQuery,
    placeholderData: (prev) => prev,
  });

  return {
    schools: data?.schools || [],
    total: data?.total || 0,
    isLoading,
    isFetching,
    isError,
    error: error as Error | null,
    debouncedQuery,
  };
}
