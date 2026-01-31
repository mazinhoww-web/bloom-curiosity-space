import { School, MapPin, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { School as SchoolType } from "@/types/database";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

export function FeaturedSchools() {
  const { data: schools, isLoading } = useQuery({
    queryKey: ["featured-schools"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("schools")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(6);
      
      if (error) throw error;
      return data as SchoolType[];
    },
  });

  return (
    <section className="py-16 md:py-24">
      <div className="container">
        <div className="mb-12 flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div>
            <h2 className="mb-2 font-display text-3xl font-bold text-foreground md:text-4xl">
              Escolas em destaque
            </h2>
            <p className="text-muted-foreground">
              Confira algumas das escolas cadastradas na plataforma.
            </p>
          </div>
          <Link to="/escolas">
            <Button variant="outline" className="gap-2">
              Ver todas
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <CardContent className="p-6">
                  <Skeleton className="mb-4 h-12 w-12 rounded-xl" />
                  <Skeleton className="mb-2 h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : schools && schools.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {schools.map((school, index) => (
              <Link key={school.id} to={`/escola/${school.slug}`}>
                <Card 
                  className="group h-full cursor-pointer overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <CardContent className="p-6">
                    {/* School Icon */}
                    <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary">
                      <School className="h-6 w-6 text-primary transition-colors group-hover:text-primary-foreground" />
                    </div>

                    {/* School Name */}
                    <h3 className="mb-2 font-display text-lg font-bold text-foreground transition-colors group-hover:text-primary">
                      {school.name}
                    </h3>

                    {/* Location */}
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>
                        {school.city && school.state 
                          ? `${school.city}, ${school.state}` 
                          : `CEP: ${school.cep}`
                        }
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed bg-muted/30 p-12 text-center">
            <School className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 font-display text-xl font-semibold text-foreground">
              Nenhuma escola cadastrada ainda
            </h3>
            <p className="text-muted-foreground">
              As escolas aparecerão aqui assim que forem adicionadas.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
