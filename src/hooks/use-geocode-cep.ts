/**
 * Hook para geocodificar CEP usando a edge function
 * Converte CEP em coordenadas geográficas com cache automático
 */

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { normalizeCep } from "@/lib/school-utils";

export interface GeocodeResult {
  latitude: number;
  longitude: number;
  address: string | null;
  city: string | null;
  state: string | null;
  cep: string;
  cached: boolean;
}

interface UseGeocodeCepOptions {
  cep: string;
  enabled?: boolean;
}

export function useGeocodeCep({ cep, enabled = true }: UseGeocodeCepOptions) {
  const cleanCep = normalizeCep(cep);
  const isValidCep = cleanCep.length >= 5;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["geocode-cep", cleanCep],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("geocode-cep", {
        body: { cep: cleanCep },
      });

      if (error) {
        console.error("Erro ao geocodificar CEP:", error);
        throw error;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      return data as GeocodeResult;
    },
    enabled: enabled && isValidCep,
    staleTime: 1000 * 60 * 60, // 1 hour cache (coordenadas não mudam)
    gcTime: 1000 * 60 * 60 * 24, // 24 hour garbage collection
    retry: 1,
  });

  return {
    coordinates: data,
    isLoading,
    error: error as Error | null,
    refetch,
    isValidCep,
  };
}
