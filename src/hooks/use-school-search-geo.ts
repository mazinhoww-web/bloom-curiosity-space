/**
 * Hook: useSchoolSearchGeo
 * 
 * Busca escolas ordenadas por proximidade geográfica usando a fórmula de Haversine.
 * Integra geocodificação de CEP com cache e busca otimizada no banco.
 */

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { normalizeCep, isCepSearch } from "@/lib/school-utils";
import { useGeocodeCep } from "./use-geocode-cep";

export interface SchoolSearchFilters {
  state: string;
  city: string;
  network: string;
  educationTypes: string[];
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
  network_type: string | null;
  education_types: string[] | null;
  latitude: number | null;
  longitude: number | null;
  distance_km: number | null;
  total_count: number;
}

export interface UseSchoolSearchOptions {
  query: string;
  filters: SchoolSearchFilters;
  page: number;
  pageSize: number;
  maxDistanceKm?: number;
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
  userCoordinates: { lat: number; lng: number } | null;
  isGeocodingCep: boolean;
}

const DEFAULT_DEBOUNCE_MS = 300;
const DEFAULT_MAX_DISTANCE_KM = 100;

export function useSchoolSearchGeo({
  query,
  filters,
  page,
  pageSize,
  maxDistanceKm = DEFAULT_MAX_DISTANCE_KM,
  enabled = true,
  debounceMs = DEFAULT_DEBOUNCE_MS,
}: UseSchoolSearchOptions): UseSchoolSearchReturn {
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  // Debounce the search query
  useEffect(() => {
    if (query === "") {
      setDebouncedQuery("");
      return;
    }

    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [query, debounceMs]);

  // Determine if this is a CEP search
  const cleanCep = normalizeCep(debouncedQuery);
  const isCep = isCepSearch(debouncedQuery);

  // Geocode the CEP if it's a CEP search
  const {
    coordinates,
    isLoading: isGeocodingCep,
  } = useGeocodeCep({
    cep: cleanCep,
    enabled: enabled && isCep,
  });

  // Determine if we should run the query
  const hasFilters = !!filters.state || !!filters.city || !!filters.network || (filters.educationTypes?.length > 0);
  const hasValidQuery = debouncedQuery.length >= 2;
  const hasCoordinates = coordinates?.latitude && coordinates?.longitude;
  const shouldQuery = enabled && (hasValidQuery || hasFilters);

  const { data, isLoading, isFetching, isError, error } = useQuery({
    queryKey: [
      "schools-search-geo",
      debouncedQuery,
      filters,
      page,
      pageSize,
      coordinates?.latitude,
      coordinates?.longitude,
      maxDistanceKm,
    ],
    queryFn: async () => {
      // If we have coordinates (from CEP), use geo search
      if (hasCoordinates && isCep) {
        const { data, error } = await supabase.rpc("search_schools_geo", {
          user_lat: coordinates.latitude,
          user_lng: coordinates.longitude,
          search_name: null,
          filter_state: filters.state || null,
          filter_city: filters.city || null,
          filter_network: filters.network || null,
          filter_education: filters.educationTypes?.[0] || null, // First selected type
          max_distance_km: maxDistanceKm,
          page_number: page,
          page_size: pageSize,
        });

        if (error) throw error;

        const results = (data || []) as SchoolSearchResult[];
        const total = results.length > 0 ? Number(results[0].total_count) : 0;

        return { schools: results, total };
      }

      // Fallback to regular search if no coordinates
      const { data, error } = await supabase.rpc("search_schools", {
        search_cep: isCep ? cleanCep : null,
        search_name: !isCep && debouncedQuery.length >= 2 ? debouncedQuery : null,
        filter_state: filters.state || null,
        filter_city: filters.city || null,
        page_number: page,
        page_size: pageSize,
      });

      if (error) throw error;

      const results = (data || []).map((school: any) => ({
        ...school,
        network_type: null,
        education_types: null,
        latitude: null,
        longitude: null,
        distance_km: null,
      })) as SchoolSearchResult[];
      
      const total = results.length > 0 ? Number(results[0].total_count) : 0;

      return { schools: results, total };
    },
    staleTime: 30000, // 30 second cache
    enabled: shouldQuery && (!isCep || !isGeocodingCep),
    placeholderData: (prev) => prev,
  });

  return {
    schools: data?.schools || [],
    total: data?.total || 0,
    isLoading: isLoading || (isCep && isGeocodingCep),
    isFetching,
    isError,
    error: error as Error | null,
    debouncedQuery,
    userCoordinates: hasCoordinates ? { lat: coordinates.latitude, lng: coordinates.longitude } : null,
    isGeocodingCep,
  };
}
