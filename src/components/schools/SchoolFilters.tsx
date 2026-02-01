/**
 * SchoolFilters Component - Filtros avançados para busca de escolas
 * 
 * Filtros disponíveis:
 * - Estado (UF)
 * - Cidade
 * - Rede (Pública / Privada)
 * - Tipo de Ensino (Berçário, Infantil, Fundamental, Médio)
 */

import { useState } from "react";
import { Filter, X, ChevronDown, Building2, GraduationCap, MapPin, Landmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

// Tipos de rede escolar
export const NETWORK_TYPES = [
  { value: "publica", label: "Pública", icon: Landmark },
  { value: "privada", label: "Privada", icon: Building2 },
];

// Tipos de ensino
export const EDUCATION_TYPES = [
  { value: "bercario", label: "Berçário" },
  { value: "infantil", label: "Educação Infantil" },
  { value: "fundamental_1", label: "Fundamental I (1º-5º)" },
  { value: "fundamental_2", label: "Fundamental II (6º-9º)" },
  { value: "medio", label: "Ensino Médio" },
  { value: "tecnico", label: "Ensino Técnico" },
  { value: "eja", label: "EJA" },
];

export interface SchoolFiltersState {
  state: string;
  city: string;
  network: string;
  educationTypes: string[];
}

interface SchoolFiltersProps {
  filters: SchoolFiltersState;
  onFiltersChange: (filters: SchoolFiltersState) => void;
  defaultOpen?: boolean;
}

const BRAZILIAN_STATES = [
  { value: "AC", label: "Acre" },
  { value: "AL", label: "Alagoas" },
  { value: "AP", label: "Amapá" },
  { value: "AM", label: "Amazonas" },
  { value: "BA", label: "Bahia" },
  { value: "CE", label: "Ceará" },
  { value: "DF", label: "Distrito Federal" },
  { value: "ES", label: "Espírito Santo" },
  { value: "GO", label: "Goiás" },
  { value: "MA", label: "Maranhão" },
  { value: "MT", label: "Mato Grosso" },
  { value: "MS", label: "Mato Grosso do Sul" },
  { value: "MG", label: "Minas Gerais" },
  { value: "PA", label: "Pará" },
  { value: "PB", label: "Paraíba" },
  { value: "PR", label: "Paraná" },
  { value: "PE", label: "Pernambuco" },
  { value: "PI", label: "Piauí" },
  { value: "RJ", label: "Rio de Janeiro" },
  { value: "RN", label: "Rio Grande do Norte" },
  { value: "RS", label: "Rio Grande do Sul" },
  { value: "RO", label: "Rondônia" },
  { value: "RR", label: "Roraima" },
  { value: "SC", label: "Santa Catarina" },
  { value: "SP", label: "São Paulo" },
  { value: "SE", label: "Sergipe" },
  { value: "TO", label: "Tocantins" },
];

export function SchoolFilters({ 
  filters, 
  onFiltersChange, 
  defaultOpen = true 
}: SchoolFiltersProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  // Fetch cities using RPC function
  const { data: cities = [] } = useQuery({
    queryKey: ["school-cities-rpc", filters.state],
    queryFn: async () => {
      if (!filters.state) return [];
      
      const { data, error } = await supabase.rpc("get_distinct_school_cities", {
        p_state: filters.state
      });

      if (error) throw error;
      return (data || []).map((row: { city: string }) => row.city);
    },
    enabled: !!filters.state,
  });

  // Fetch available states
  const { data: availableStates = [] } = useQuery({
    queryKey: ["school-states-rpc"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_distinct_school_states");

      if (error) throw error;
      return (data || []).map((row: { state: string }) => row.state);
    },
  });

  const handleStateChange = (value: string) => {
    onFiltersChange({
      ...filters,
      state: value === "all" ? "" : value,
      city: "", // Reset city when state changes
    });
  };

  const handleCityChange = (value: string) => {
    onFiltersChange({
      ...filters,
      city: value === "all" ? "" : value,
    });
  };

  const handleNetworkChange = (value: string) => {
    onFiltersChange({
      ...filters,
      network: value === "all" ? "" : value,
    });
  };

  const handleEducationTypeToggle = (value: string) => {
    const newTypes = filters.educationTypes.includes(value)
      ? filters.educationTypes.filter((t) => t !== value)
      : [...filters.educationTypes, value];
    
    onFiltersChange({
      ...filters,
      educationTypes: newTypes,
    });
  };

  const clearFilters = () => {
    onFiltersChange({ 
      state: "", 
      city: "", 
      network: "", 
      educationTypes: [] 
    });
  };

  const activeFiltersCount = [
    filters.state, 
    filters.city, 
    filters.network,
    ...(filters.educationTypes || [])
  ].filter(Boolean).length;

  const getStateLabel = (value: string) => {
    return BRAZILIAN_STATES.find((s) => s.value === value)?.label || value;
  };

  const getNetworkLabel = (value: string) => {
    return NETWORK_TYPES.find((n) => n.value === value)?.label || value;
  };

  return (
    <div className="w-full rounded-xl border bg-card p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
        >
          <Filter className="h-4 w-4" />
          Filtros
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 min-w-[20px] rounded-full px-1.5 text-xs">
              {activeFiltersCount}
            </Badge>
          )}
          <ChevronDown
            className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
        </button>

        {activeFiltersCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-7 text-xs text-muted-foreground"
          >
            <X className="mr-1 h-3 w-3" />
            Limpar
          </Button>
        )}
      </div>

      {/* Active filter badges */}
      {activeFiltersCount > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {filters.state && (
            <Badge variant="secondary" className="gap-1 pl-2">
              <MapPin className="h-3 w-3" />
              {getStateLabel(filters.state)}
              <button
                onClick={() => onFiltersChange({ ...filters, state: "", city: "" })}
                className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.city && (
            <Badge variant="secondary" className="gap-1 pl-2">
              {filters.city}
              <button
                onClick={() => onFiltersChange({ ...filters, city: "" })}
                className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.network && (
            <Badge variant="secondary" className="gap-1 pl-2">
              {getNetworkLabel(filters.network)}
              <button
                onClick={() => onFiltersChange({ ...filters, network: "" })}
                className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.educationTypes?.map((type) => (
            <Badge key={type} variant="secondary" className="gap-1 pl-2">
              <GraduationCap className="h-3 w-3" />
              {EDUCATION_TYPES.find((e) => e.value === type)?.label || type}
              <button
                onClick={() => handleEducationTypeToggle(type)}
                className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Filter content - Always visible when open */}
      {isOpen && (
        <div className="mt-4 space-y-4">
          {/* Location Row */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* State filter */}
            <div>
              <label className="mb-2 flex items-center gap-1.5 text-sm font-medium text-foreground">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                Estado
              </label>
              <Select value={filters.state || "all"} onValueChange={handleStateChange}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os estados</SelectItem>
                  {BRAZILIAN_STATES.filter((state) =>
                    availableStates.includes(state.value)
                  ).map((state) => (
                    <SelectItem key={state.value} value={state.value}>
                      {state.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* City filter */}
            <div>
              <label className="mb-2 flex items-center gap-1.5 text-sm font-medium text-foreground">
                Cidade
              </label>
              <Select
                value={filters.city || "all"}
                onValueChange={handleCityChange}
                disabled={!filters.state}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue
                    placeholder={filters.state ? "Todas" : "Selecione o estado"}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as cidades</SelectItem>
                  {cities.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Network filter */}
            <div>
              <label className="mb-2 flex items-center gap-1.5 text-sm font-medium text-foreground">
                <Landmark className="h-3.5 w-3.5 text-muted-foreground" />
                Rede
              </label>
              <Select value={filters.network || "all"} onValueChange={handleNetworkChange}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as redes</SelectItem>
                  {NETWORK_TYPES.map((network) => (
                    <SelectItem key={network.value} value={network.value}>
                      {network.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Education Types */}
          <div>
            <label className="mb-3 flex items-center gap-1.5 text-sm font-medium text-foreground">
              <GraduationCap className="h-3.5 w-3.5 text-muted-foreground" />
              Tipo de Ensino
            </label>
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              {EDUCATION_TYPES.map((type) => (
                <div key={type.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`education-${type.value}`}
                    checked={filters.educationTypes?.includes(type.value) || false}
                    onCheckedChange={() => handleEducationTypeToggle(type.value)}
                  />
                  <Label
                    htmlFor={`education-${type.value}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {type.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
