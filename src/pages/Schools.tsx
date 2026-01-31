import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Search, School as SchoolIcon, MapPin, Filter } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { School } from "@/types/database";

export default function Schools() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("cep") || "");

  const { data: schools, isLoading } = useQuery({
    queryKey: ["schools", searchQuery],
    queryFn: async () => {
      let query = supabase
        .from("schools")
        .select("*")
        .eq("is_active", true)
        .order("name");

      // Filter by CEP or name
      if (searchQuery.trim()) {
        const cleanSearch = searchQuery.replace(/\D/g, "");
        if (cleanSearch.length > 0) {
          query = query.ilike("cep", `${cleanSearch}%`);
        } else {
          query = query.ilike("name", `%${searchQuery}%`);
        }
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as School[];
    },
  });

  useEffect(() => {
    const cepParam = searchParams.get("cep");
    if (cepParam) {
      setSearchQuery(cepParam);
    }
  }, [searchParams]);

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    if (value.trim()) {
      setSearchParams({ cep: value });
    } else {
      setSearchParams({});
    }
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
              Busque por CEP ou nome da escola para visualizar as listas de materiais.
            </p>

            {/* Search */}
            <div className="relative">
              <Input
                type="text"
                placeholder="Digite o CEP ou nome da escola..."
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
          {/* Results count */}
          {!isLoading && schools && (
            <p className="mb-6 text-sm text-muted-foreground">
              {schools.length} escola{schools.length !== 1 ? "s" : ""} encontrada{schools.length !== 1 ? "s" : ""}
              {searchQuery && ` para "${searchQuery}"`}
            </p>
          )}

          {/* Loading */}
          {isLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <Skeleton className="mb-4 h-12 w-12 rounded-xl" />
                    <Skeleton className="mb-2 h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : schools && schools.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {schools.map((school) => (
                <Link key={school.id} to={`/escola/${school.slug}`}>
                  <Card className="group h-full cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                    <CardContent className="p-6">
                      <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary">
                        <SchoolIcon className="h-6 w-6 text-primary transition-colors group-hover:text-primary-foreground" />
                      </div>

                      <h3 className="mb-2 font-display text-lg font-bold text-foreground transition-colors group-hover:text-primary">
                        {school.name}
                      </h3>

                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>
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
          ) : (
            <div className="rounded-2xl border border-dashed bg-muted/30 p-12 text-center">
              <SchoolIcon className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 font-display text-xl font-semibold text-foreground">
                Nenhuma escola encontrada
              </h3>
              <p className="mb-6 text-muted-foreground">
                {searchQuery
                  ? "Tente buscar por outro CEP ou nome de escola."
                  : "Ainda não há escolas cadastradas."}
              </p>
              {searchQuery && (
                <Button variant="outline" onClick={() => handleSearch("")}>
                  Limpar busca
                </Button>
              )}
            </div>
          )}
        </div>
      </section>
    </MainLayout>
  );
}
