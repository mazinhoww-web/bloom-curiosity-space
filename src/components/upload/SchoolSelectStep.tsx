import { useState, useCallback } from "react";
import { Search, School, MapPin, Plus, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useSchoolSearch } from "@/hooks/use-school-search";
import { cleanSchoolName, formatCep, isCepSearch, normalizeCep } from "@/lib/school-utils";

interface SchoolData {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  cep: string;
}

interface SchoolSelectStepProps {
  onSelect: (school: SchoolData | null, customName: string | null) => void;
  selectedSchool: SchoolData | null;
  customSchoolName: string | null;
}

export function SchoolSelectStep({
  onSelect,
  selectedSchool,
  customSchoolName,
}: SchoolSelectStepProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customName, setCustomName] = useState(customSchoolName || "");

  // Use the optimized search hook
  const { schools, isLoading, isFetching, debouncedQuery } = useSchoolSearch({
    query: searchQuery,
    filters: { state: "", city: "", network: "", educationTypes: [] },
    page: 0,
    pageSize: 10,
  });

  // Determine if we have valid search criteria
  const hasValidSearch = debouncedQuery.length >= 2 || isCepSearch(debouncedQuery);

  const handleSelectSchool = useCallback((school: SchoolData) => {
    onSelect(school, null);
    setShowCustomInput(false);
    setSearchQuery("");
  }, [onSelect]);

  const handleCustomSchool = useCallback(() => {
    if (customName.trim()) {
      onSelect(null, customName.trim());
    }
  }, [customName, onSelect]);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <School className="h-8 w-8 text-primary" />
        </div>
        <h2 className="font-display text-2xl font-bold">Qual escola?</h2>
        <p className="mt-2 text-muted-foreground">
          Busque pelo nome ou CEP (mínimo 5 dígitos)
        </p>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Nome da escola ou CEP..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 pr-10"
        />
        {isFetching && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>

      {/* Search hint for CEP */}
      {searchQuery && !isCepSearch(searchQuery) && normalizeCep(searchQuery).length > 0 && normalizeCep(searchQuery).length < 5 && (
        <p className="text-sm text-muted-foreground text-center">
          Digite pelo menos 5 dígitos do CEP para buscar
        </p>
      )}

      {/* Search Results */}
      {isLoading && hasValidSearch && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      )}

      {hasValidSearch && !isLoading && schools.length > 0 && (
        <div className="space-y-2">
          {schools.map((school) => (
            <Card
              key={school.id}
              className={`cursor-pointer transition-all hover:border-primary ${
                selectedSchool?.id === school.id ? "border-primary bg-primary/5" : ""
              }`}
              onClick={() => handleSelectSchool({
                id: school.id,
                name: school.name,
                city: school.city,
                state: school.state,
                cep: school.cep,
              })}
            >
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  <School className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{cleanSchoolName(school.name)}</p>
                  <p className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    {school.city && school.state 
                      ? `${school.city}, ${school.state}` 
                      : `CEP: ${formatCep(school.cep)}`}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {hasValidSearch && !isLoading && schools.length === 0 && (
        <div className="rounded-lg border border-dashed p-6 text-center">
          <p className="text-muted-foreground">Nenhuma escola encontrada</p>
        </div>
      )}

      {/* Selected School Display */}
      {selectedSchool && (
        <Card className="border-success bg-success/5">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/20">
              <School className="h-5 w-5 text-success" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-success">{cleanSchoolName(selectedSchool.name)}</p>
              <p className="text-sm text-muted-foreground">
                {selectedSchool.city && selectedSchool.state 
                  ? `${selectedSchool.city}, ${selectedSchool.state}`
                  : `CEP: ${formatCep(selectedSchool.cep)}`}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSelect(null, null)}
            >
              Trocar
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Custom School Option */}
      {!selectedSchool && (
        <div className="border-t pt-4">
          {!showCustomInput ? (
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => setShowCustomInput(true)}
            >
              <Plus className="h-4 w-4" />
              Escola não está na lista
            </Button>
          ) : (
            <div className="space-y-3">
              <Input
                placeholder="Digite o nome da escola..."
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                autoFocus
              />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowCustomInput(false);
                    setCustomName("");
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleCustomSchool}
                  disabled={!customName.trim()}
                >
                  Usar esta escola
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Custom School Selected */}
      {customSchoolName && (
        <Card className="border-warning bg-warning/5">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/20">
              <School className="h-5 w-5 text-warning" />
            </div>
            <div className="flex-1">
              <p className="font-medium">{customSchoolName}</p>
              <p className="text-sm text-muted-foreground">
                Escola não cadastrada
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSelect(null, null)}
            >
              Trocar
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
