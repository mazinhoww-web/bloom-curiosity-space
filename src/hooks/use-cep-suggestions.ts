import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { normalizeCep, formatCep } from "@/lib/school-utils";

interface CepSuggestion {
  cep: string;
  city: string | null;
  state: string | null;
  school_count: number;
  search_count: number;
}

interface UseCepSuggestionsOptions {
  prefix: string;
  enabled?: boolean;
  maxResults?: number;
}

export function useCepSuggestions({
  prefix,
  enabled = true,
  maxResults = 5,
}: UseCepSuggestionsOptions) {
  const [debouncedPrefix, setDebouncedPrefix] = useState("");

  // Debounce the prefix
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedPrefix(prefix);
    }, 150); // Faster debounce for autocomplete
    return () => clearTimeout(timer);
  }, [prefix]);

  const cleanPrefix = normalizeCep(debouncedPrefix);

  const { data, isLoading, error } = useQuery({
    queryKey: ["cep-suggestions", cleanPrefix],
    queryFn: async () => {
      if (cleanPrefix.length < 2) {
        return [];
      }

      const { data, error } = await supabase.rpc("get_cep_suggestions", {
        cep_prefix: cleanPrefix,
        max_results: maxResults,
      });

      if (error) {
        console.error("Error fetching CEP suggestions:", error);
        throw error;
      }

      return (data as CepSuggestion[]).map((item) => ({
        ...item,
        formattedCep: formatCep(item.cep),
      }));
    },
    enabled: enabled && cleanPrefix.length >= 2,
    staleTime: 60000, // Cache for 1 minute
    gcTime: 300000, // Keep in cache for 5 minutes
  });

  return {
    suggestions: data || [],
    isLoading,
    error,
    debouncedPrefix,
  };
}
