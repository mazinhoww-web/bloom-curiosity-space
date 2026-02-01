import { useState, useEffect, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Search, School as SchoolIcon, MapPin, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { School } from "@/types/database";
import { SchoolFilters, SchoolFiltersState } from "@/components/schools/SchoolFilters";
import { useAnalytics } from "@/hooks/use-analytics";
import { cleanSchoolName } from "@/lib/school-utils";

const ITEMS_PER_PAGE = 50;

export default function Schools() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || searchParams.get("cep") || "");
  const [filters, setFilters] = useState<SchoolFiltersState>({
    state: searchParams.get("estado") || "",
    city: searchParams.get("cidade") || "",
  });
  const [page, setPage] = useState(1);
  const { trackCepSearch } = useAnalytics();
  const lastTrackedCep = useRef<string>("");

  const { data, isLoading } = useQuery({
    queryKey: ["schools", searchQuery, filters, page],
    queryFn: async () => {
      let query = supabase
        .from("schools")
        .select("*", { count: "exact" })
        .eq("is_active", true)
        .order("name")
        .range((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE - 1);

      // Filter by search query
      if (searchQuery.trim()) {
        const cleanSearch = searchQuery.replace(/\D/g, "");
        if (cleanSearch.length > 0 && cleanSearch.length <= 8) {
          // Likely a CEP
          query = query.ilike("cep", `${cleanSearch}%`);
        } else {
          // Search by name or city
          query = query.or(
            `name.ilike.%${searchQuery}%,city.ilike.%${searchQuery}%`
          );
        }
      }

      // Filter by state
      if (filters.state) {
        query = query.eq("state", filters.state);
      }

      // Filter by city
      if (filters.city) {
        query = query.eq("city", filters.city);
      }

      const { data, error, count } = await query;
      if (error) throw error;
      
      // Track CEP search if it's a CEP query with results
      const cleanCep = searchQuery.replace(/\D/g, "");
      if (cleanCep.length >= 5 && cleanCep.length <= 8 && cleanCep !== lastTrackedCep.current) {
        lastTrackedCep.current = cleanCep;
        trackCepSearch(cleanCep, count || 0);
      }
      
      return { schools: data as School[], total: count || 0 };
    },
  });

  const schools = data?.schools || [];
  const totalSchools = data?.total || 0;
  const totalPages = Math.ceil(totalSchools / ITEMS_PER_PAGE);

  useEffect(() => {
    const cepParam = searchParams.get("cep");
    const qParam = searchParams.get("q");
    const estadoParam = searchParams.get("estado");
    const cidadeParam = searchParams.get("cidade");

    if (cepParam) setSearchQuery(cepParam);
    else if (qParam) setSearchQuery(qParam);

    if (estadoParam || cidadeParam) {
      setFilters({
        state: estadoParam || "",
        city: cidadeParam || "",
      });
    }
  }, [searchParams]);

  const updateSearchParams = (query: string, newFilters: SchoolFiltersState) => {
    const params: Record<string, string> = {};
    if (query.trim()) params.q = query;
    if (newFilters.state) params.estado = newFilters.state;
    if (newFilters.city) params.cidade = newFilters.city;
    setSearchParams(params);
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setPage(1);
    updateSearchParams(value, filters);
  };

  const handleFiltersChange = (newFilters: SchoolFiltersState) => {
    setFilters(newFilters);
    setPage(1);
    updateSearchParams(searchQuery, newFilters);
  };

  return (
    <MainLayout>
      <section className="bg-muted/30 py-12">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="mb-4 font-display text-3xl font-bold text-foreground md:text-4xl">
              Encontre sua escola
            </h1>
            <p className="mb-8 text-muted-foreground">
              Busque por CEP, nome da escola ou cidade para visualizar as listas de materiais.
            </p>

            {/* Search */}
            <div className="relative">
              <Input
                type="text"
                placeholder="Digite o CEP, nome da escola ou cidade..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="h-14 rounded-xl border-border bg-card pl-5 pr-12 text-lg shadow-card"
              />
              <Search className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            </div>
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
          {!isLoading && (
            <p className="mb-6 text-sm text-muted-foreground">
              {totalSchools} escola{totalSchools !== 1 ? "s" : ""} encontrada{totalSchools !== 1 ? "s" : ""}
              {searchQuery && ` para "${searchQuery}"`}
              {filters.state && ` em ${filters.state}`}
              {filters.city && ` - ${filters.city}`}
            </p>
          )}

          {/* Loading */}
          {isLoading ? (
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
          ) : schools.length > 0 ? (
            <>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {schools.map((school) => (
                  <Link key={school.id} to={`/escola/${school.slug}`}>
                    <Card className="group h-full cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                      <CardContent className="p-6">
                        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary">
                          <SchoolIcon className="h-6 w-6 text-primary transition-colors group-hover:text-primary-foreground" />
                        </div>

                        <h3 className="mb-2 font-display text-lg font-bold text-foreground transition-colors group-hover:text-primary line-clamp-2">
                          {cleanSchoolName(school.name)}
                        </h3>

                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4 shrink-0" />
                          <span className="truncate">
                            {school.city && school.state
                              ? `${school.city}, ${school.state}`
                              : `CEP: ${school.cep}`}
                          </span>
                        </div>
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
                      onClick={() => setPage(1)}
                      disabled={page === 1}
                      className="h-9 w-9"
                    >
                      <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    
                    {/* Previous page */}
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="h-9 w-9"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    
                    {/* Page numbers */}
                    {(() => {
                      const maxVisible = 5;
                      let startPage = Math.max(1, page - Math.floor(maxVisible / 2));
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
                            onClick={() => setPage(1)}
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
                            variant={page === p ? "default" : "outline"}
                            size="sm"
                            onClick={() => setPage(p)}
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
                            onClick={() => setPage(totalPages)}
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
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="h-9 w-9"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    
                    {/* Last page */}
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setPage(totalPages)}
                      disabled={page === totalPages}
                      className="h-9 w-9"
                    >
                      <ChevronsRight className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <p className="text-sm text-muted-foreground">
                    Página {page.toLocaleString('pt-BR')} de {totalPages.toLocaleString('pt-BR')} ({totalSchools.toLocaleString('pt-BR')} escolas)
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="rounded-2xl border border-dashed bg-muted/30 p-12 text-center">
              <SchoolIcon className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 font-display text-xl font-semibold text-foreground">
                Nenhuma escola encontrada
              </h3>
              <p className="mb-6 text-muted-foreground">
                {searchQuery || filters.state || filters.city
                  ? "Tente ajustar os filtros ou buscar por outro termo."
                  : "Ainda não há escolas cadastradas."}
              </p>
              {(searchQuery || filters.state || filters.city) && (
                <Button
                  variant="outline"
                  onClick={() => {
                    handleSearch("");
                    handleFiltersChange({ state: "", city: "" });
                  }}
                >
                  Limpar filtros
                </Button>
              )}
            </div>
          )}
        </div>
      </section>
    </MainLayout>
  );
}
