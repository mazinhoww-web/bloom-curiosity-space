/**
 * Schools Page - Busca de escolas por CEP com proximidade geográfica
 * 
 * Features:
 * - Busca por CEP com geocodificação
 * - Ordenação por distância (Haversine)
 * - Filtros: Estado, Cidade, Rede, Tipo de Ensino
 * - Exibição de distância em km
 */

import { useState, useEffect, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Search, School as SchoolIcon, MapPin, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Loader2, Navigation } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { SchoolFilters, SchoolFiltersState } from "@/components/schools/SchoolFilters";
import { useAnalytics } from "@/hooks/use-analytics";
import { useSchoolSearchGeo } from "@/hooks/use-school-search-geo";
import { cleanSchoolName, formatCep, normalizeCep, isCepSearch } from "@/lib/school-utils";

const ITEMS_PER_PAGE = 50;

export default function Schools() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || searchParams.get("cep") || "");
  const [filters, setFilters] = useState<SchoolFiltersState>({
    state: searchParams.get("estado") || "",
    city: searchParams.get("cidade") || "",
    network: searchParams.get("rede") || "",
    educationTypes: searchParams.get("ensino")?.split(",").filter(Boolean) || [],
  });
  const [page, setPage] = useState(0);
  const { trackCepSearch } = useAnalytics();
  const lastTrackedCep = useRef<string>("");

  // Use the geo-enabled search hook
  const { 
    schools, 
    total, 
    isLoading, 
    isFetching, 
    debouncedQuery,
    userCoordinates,
    isGeocodingCep,
  } = useSchoolSearchGeo({
    query: searchQuery,
    filters,
    page,
    pageSize: ITEMS_PER_PAGE,
    maxDistanceKm: 100,
  });

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);
  const isGeoSearch = userCoordinates !== null;

  // Track CEP searches
  useEffect(() => {
    const cleanCep = normalizeCep(debouncedQuery);
    if (isCepSearch(debouncedQuery) && cleanCep !== lastTrackedCep.current && total > 0) {
      lastTrackedCep.current = cleanCep;
      trackCepSearch(cleanCep, total);
    }
  }, [debouncedQuery, total, trackCepSearch]);

  // Sync URL params
  useEffect(() => {
    const cepParam = searchParams.get("cep");
    const qParam = searchParams.get("q");
    const estadoParam = searchParams.get("estado");
    const cidadeParam = searchParams.get("cidade");
    const redeParam = searchParams.get("rede");
    const ensinoParam = searchParams.get("ensino");

    if (cepParam) setSearchQuery(cepParam);
    else if (qParam) setSearchQuery(qParam);

    if (estadoParam || cidadeParam || redeParam || ensinoParam) {
      setFilters({
        state: estadoParam || "",
        city: cidadeParam || "",
        network: redeParam || "",
        educationTypes: ensinoParam?.split(",").filter(Boolean) || [],
      });
    }
  }, [searchParams]);

  const updateSearchParams = (query: string, newFilters: SchoolFiltersState) => {
    const params: Record<string, string> = {};
    if (query.trim()) params.q = query;
    if (newFilters.state) params.estado = newFilters.state;
    if (newFilters.city) params.cidade = newFilters.city;
    if (newFilters.network) params.rede = newFilters.network;
    if (newFilters.educationTypes?.length > 0) params.ensino = newFilters.educationTypes.join(",");
    setSearchParams(params);
  };

  const handleSearch = (value: string) => {
    const formatted = isCepSearch(value) ? formatCep(value) : value;
    setSearchQuery(formatted);
    setPage(0);
    updateSearchParams(formatted, filters);
  };

  const handleFiltersChange = (newFilters: SchoolFiltersState) => {
    setFilters(newFilters);
    setPage(0);
    updateSearchParams(searchQuery, newFilters);
  };

  const hasSearchCriteria = searchQuery.length >= 2 || isCepSearch(searchQuery) || filters.state || filters.city;

  return (
    <MainLayout>
      <section className="bg-muted/30 py-12">
        <div className="container">
          {/* Breadcrumbs */}
          <Breadcrumbs 
            items={[{ label: "Buscar Escolas" }]} 
            className="mb-6"
          />
          
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="mb-4 font-display text-3xl font-bold text-foreground md:text-4xl">
              Encontre sua escola
            </h1>
            <p className="mb-8 text-muted-foreground">
              Busque por CEP (mínimo 5 dígitos), nome da escola ou cidade para visualizar as listas de materiais.
            </p>

            {/* Search */}
            <div className="relative">
              <Input
                type="text"
                placeholder="Digite o CEP, nome da escola ou cidade..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="h-14 rounded-xl border-border bg-card pl-5 pr-12 text-lg shadow-card"
                maxLength={50}
              />
              {isFetching ? (
                <Loader2 className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 animate-spin text-muted-foreground" />
              ) : (
                <Search className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              )}
            </div>

            {/* Search hint */}
            {searchQuery && !isCepSearch(searchQuery) && normalizeCep(searchQuery).length > 0 && normalizeCep(searchQuery).length < 5 && (
              <p className="mt-2 text-sm text-muted-foreground">
                Digite pelo menos 5 dígitos do CEP para buscar
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="container">
          {/* Filters */}
          <div className="mb-6">
            <SchoolFilters filters={filters} onFiltersChange={handleFiltersChange} />
          </div>

          {/* Results count */}
          {hasSearchCriteria && !isLoading && (
            <p className="mb-6 text-sm text-muted-foreground">
              {total.toLocaleString("pt-BR")} escola{total !== 1 ? "s" : ""} encontrada{total !== 1 ? "s" : ""}
              {searchQuery && ` para "${searchQuery}"`}
              {filters.state && ` em ${filters.state}`}
              {filters.city && ` - ${filters.city}`}
            </p>
          )}

          {/* Help text when no search criteria */}
          {!hasSearchCriteria && (
            <div className="rounded-2xl border border-dashed bg-muted/30 p-12 text-center">
              <Search className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 font-display text-xl font-semibold text-foreground">
                Como buscar?
              </h3>
              <p className="text-muted-foreground">
                Digite o CEP (mínimo 5 dígitos), nome da escola ou use os filtros de estado/cidade.
              </p>
            </div>
          )}

          {/* Loading */}
          {hasSearchCriteria && isLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[...Array(12)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <Skeleton className="mb-4 h-12 w-12 rounded-xl" />
                    <Skeleton className="mb-2 h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : hasSearchCriteria && schools.length > 0 ? (
            <>
              {/* Geo search indicator */}
              {isGeoSearch && (
                <div className="mb-4 flex items-center gap-2 rounded-lg bg-primary/5 px-4 py-2 text-sm text-primary">
                  <Navigation className="h-4 w-4" />
                  <span>Ordenado por proximidade ao CEP informado</span>
                </div>
              )}

              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {schools.map((school) => (
                  <Link key={school.id} to={`/escola/${school.slug}`}>
                    <Card className="group h-full cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                      <CardContent className="p-6">
                        <div className="mb-4 flex items-start justify-between">
                          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary">
                            <SchoolIcon className="h-6 w-6 text-primary transition-colors group-hover:text-primary-foreground" />
                          </div>
                          
                          {/* Distance badge */}
                          {school.distance_km !== null && school.distance_km !== undefined && (
                            <Badge variant="secondary" className="gap-1 text-xs">
                              <Navigation className="h-3 w-3" />
                              {school.distance_km < 1 
                                ? `${Math.round(school.distance_km * 1000)}m`
                                : `${school.distance_km.toFixed(1)}km`
                              }
                            </Badge>
                          )}
                        </div>

                        <h3 className="mb-2 font-display text-lg font-bold text-foreground transition-colors group-hover:text-primary line-clamp-2">
                          {cleanSchoolName(school.name)}
                        </h3>

                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4 shrink-0" />
                          <span className="truncate">
                            {school.city && school.state
                              ? `${school.city}, ${school.state}`
                              : `CEP: ${formatCep(school.cep)}`}
                          </span>
                        </div>

                        {/* Network type badge */}
                        {school.network_type && (
                          <div className="mt-2">
                            <Badge variant="outline" className="text-xs capitalize">
                              {school.network_type === 'publica' ? 'Pública' : 'Privada'}
                            </Badge>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-8 flex flex-col items-center gap-4">
                  <div className="flex flex-wrap items-center justify-center gap-1">
                    {/* First page */}
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setPage(0)}
                      disabled={page === 0}
                      className="h-9 w-9"
                    >
                      <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    
                    {/* Previous page */}
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                      disabled={page === 0}
                      className="h-9 w-9"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    
                    {/* Page numbers */}
                    {(() => {
                      const maxVisible = 5;
                      const currentPage = page + 1;
                      let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
                      let endPage = Math.min(totalPages, startPage + maxVisible - 1);
                      
                      if (endPage - startPage + 1 < maxVisible) {
                        startPage = Math.max(1, endPage - maxVisible + 1);
                      }
                      
                      const pages = [];
                      
                      if (startPage > 1) {
                        pages.push(
                          <Button
                            key={1}
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(0)}
                            className="h-9 min-w-[36px]"
                          >
                            1
                          </Button>
                        );
                        if (startPage > 2) {
                          pages.push(
                            <span key="start-ellipsis" className="px-2 text-muted-foreground">...</span>
                          );
                        }
                      }
                      
                      for (let p = startPage; p <= endPage; p++) {
                        pages.push(
                          <Button
                            key={p}
                            variant={currentPage === p ? "default" : "outline"}
                            size="sm"
                            onClick={() => setPage(p - 1)}
                            className="h-9 min-w-[36px]"
                          >
                            {p}
                          </Button>
                        );
                      }
                      
                      if (endPage < totalPages) {
                        if (endPage < totalPages - 1) {
                          pages.push(
                            <span key="end-ellipsis" className="px-2 text-muted-foreground">...</span>
                          );
                        }
                        pages.push(
                          <Button
                            key={totalPages}
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(totalPages - 1)}
                            className="h-9 min-w-[36px]"
                          >
                            {totalPages.toLocaleString('pt-BR')}
                          </Button>
                        );
                      }
                      
                      return pages;
                    })()}
                    
                    {/* Next page */}
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                      disabled={page >= totalPages - 1}
                      className="h-9 w-9"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    
                    {/* Last page */}
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setPage(totalPages - 1)}
                      disabled={page >= totalPages - 1}
                      className="h-9 w-9"
                    >
                      <ChevronsRight className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <p className="text-sm text-muted-foreground">
                    Página {(page + 1).toLocaleString('pt-BR')} de {totalPages.toLocaleString('pt-BR')} ({total.toLocaleString('pt-BR')} escolas)
                  </p>
                </div>
              )}
            </>
          ) : hasSearchCriteria ? (
            <div className="rounded-2xl border border-dashed bg-muted/30 p-12 text-center">
              <SchoolIcon className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 font-display text-xl font-semibold text-foreground">
                Nenhuma escola encontrada
              </h3>
              <p className="mb-6 text-muted-foreground">
                Tente ajustar os filtros ou buscar por outro termo.
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  handleSearch("");
                  handleFiltersChange({ state: "", city: "", network: "", educationTypes: [] });
                }}
              >
                Limpar filtros
              </Button>
            </div>
          ) : null}
        </div>
      </section>
    </MainLayout>
  );
}
