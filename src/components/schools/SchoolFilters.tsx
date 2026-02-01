import { useState, useEffect } from "react";
import { Filter, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

export interface SchoolFiltersState {
  state: string;
  city: string;
}

interface SchoolFiltersProps {
  filters: SchoolFiltersState;
  onFiltersChange: (filters: SchoolFiltersState) => void;
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

export function SchoolFilters({ filters, onFiltersChange }: SchoolFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Fetch cities using RPC function for efficiency
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

  // Fetch available states using RPC function for efficiency
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

  const clearFilters = () => {
    onFiltersChange({ state: "", city: "" });
  };

  const activeFiltersCount = [filters.state, filters.city].filter(Boolean).length;

  const getStateLabel = (value: string) => {
    return BRAZILIAN_STATES.find((s) => s.value === value)?.label || value;
  };

  return (
    <div className="w-full">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="flex items-center gap-2">
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Filtros
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 text-xs">
                  {activeFiltersCount}
                </Badge>
              )}
              <ChevronDown
                className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
              />
            </Button>
          </CollapsibleTrigger>

          {/* Active filter badges */}
          {activeFiltersCount > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {filters.state && (
                <Badge variant="secondary" className="gap-1 pl-2">
                  {getStateLabel(filters.state)}
                  <button
                    onClick={() => onFiltersChange({ ...filters, state: "", city: "" })}
                    className="ml-1 rounded-full p-0.5 hover:bg-muted"
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
                    className="ml-1 rounded-full p-0.5 hover:bg-muted"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-7 text-xs text-muted-foreground"
              >
                Limpar filtros
              </Button>
            </div>
          )}
        </div>

        <CollapsibleContent className="mt-4">
          <div className="flex flex-wrap gap-4 rounded-lg border bg-card p-4">
            {/* State filter */}
            <div className="min-w-[200px] flex-1">
              <label className="mb-2 block text-sm font-medium text-foreground">
                Estado
              </label>
              <Select value={filters.state || "all"} onValueChange={handleStateChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os estados" />
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
            <div className="min-w-[200px] flex-1">
              <label className="mb-2 block text-sm font-medium text-foreground">
                Cidade
              </label>
              <Select
                value={filters.city || "all"}
                onValueChange={handleCityChange}
                disabled={!filters.state}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      filters.state ? "Selecione a cidade" : "Selecione o estado primeiro"
                    }
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
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
