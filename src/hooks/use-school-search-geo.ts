/**
 * Hook: useSchoolSearchGeo
 * 
 * Busca escolas com filtro geográfico hierárquico por CEP.
 * CORRIGIDO: Agora usa hierarquia de proximidade e nunca retorna
 * escolas de outro estado se houver no mesmo estado.
 * 
 * Hierarquia de proximidade:
 * 1. CEP exato
 * 2. CEP com mesmo prefixo de 5 dígitos (mesma região)
 * 3. CEP com mesmo prefixo de 4 dígitos (mesma sub-região)
 * 4. Mesma cidade
 * 5. Mesmo estado
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
  proximity_rank?: number;
  proximity_label?: string;
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
  userLocation: { city: string | null; state: string | null } | null;
  isGeocodingCep: boolean;
  searchMode: 'cep' | 'name' | 'filters';
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

  // Geocode the CEP if it's a CEP search (para obter cidade/estado)
  const {
    coordinates,
    isLoading: isGeocodingCep,
  } = useGeocodeCep({
    cep: cleanCep,
    enabled: enabled && isCep && cleanCep.length >= 5,
  });

  // Determine search mode
  const hasFilters = !!filters.state || !!filters.city || !!filters.network || (filters.educationTypes?.length > 0);
  const hasValidQuery = debouncedQuery.length >= 2;
  const hasCoordinates = coordinates?.latitude && coordinates?.longitude;
  const shouldQuery = enabled && (hasValidQuery || hasFilters);
  
  const searchMode = isCep ? 'cep' : (hasValidQuery ? 'name' : 'filters');

  const { data, isLoading, isFetching, isError, error } = useQuery({
    queryKey: [
      "schools-search-geo",
      debouncedQuery,
      filters,
      page,
      pageSize,
      coordinates?.city,
      coordinates?.state,
      maxDistanceKm,
    ],
    queryFn: async () => {
      // BUSCA POR CEP: Usar nova função com hierarquia de proximidade
      if (isCep && cleanCep.length >= 5) {
        // Usar a nova função search_schools_by_cep_hierarchy
        const { data, error } = await supabase.rpc("search_schools_by_cep_hierarchy", {
          user_cep: cleanCep,
          user_city: coordinates?.city || null,
          user_state: filters.state || coordinates?.state || null,
          filter_network: filters.network || null,
          filter_education: filters.educationTypes?.[0] || null,
          page_number: page,
          page_size: pageSize,
        });

        if (error) {
          console.error("Erro na busca por CEP:", error);
          throw error;
        }

        const results = (data || []).map((school: any) => ({
          ...school,
          latitude: null,
          longitude: null,
          distance_km: null,
        })) as SchoolSearchResult[];
        
        const total = results.length > 0 ? Number(results[0].total_count) : 0;

        return { schools: results, total };
      }

      // BUSCA COM COORDENADAS (fallback geo)
      if (hasCoordinates && isCep) {
        const { data, error } = await supabase.rpc("search_schools_geo", {
          user_lat: coordinates.latitude,
          user_lng: coordinates.longitude,
          search_name: null,
          filter_state: filters.state || coordinates?.state || null,
          filter_city: filters.city || null,
          filter_network: filters.network || null,
          filter_education: filters.educationTypes?.[0] || null,
          max_distance_km: maxDistanceKm,
          page_number: page,
          page_size: pageSize,
        });

        if (error) throw error;

        const results = (data || []) as SchoolSearchResult[];
        const total = results.length > 0 ? Number(results[0].total_count) : 0;

        return { schools: results, total };
      }

      // BUSCA POR NOME ou FILTROS
      const { data, error } = await supabase.rpc("search_schools", {
        search_cep: null,
        search_name: hasValidQuery && !isCep ? debouncedQuery : null,
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
    staleTime: 1000 * 60 * 5, // 5 minute cache - reduced API calls
    gcTime: 1000 * 60 * 10, // Keep in cache for 10 minutes
    enabled: shouldQuery && (!isCep || !isGeocodingCep || cleanCep.length >= 5),
    placeholderData: (prev) => prev,
    refetchOnWindowFocus: false, // Don't refetch on window focus
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
    userLocation: coordinates ? { city: coordinates.city, state: coordinates.state } : null,
    isGeocodingCep,
    searchMode,
  };
}
