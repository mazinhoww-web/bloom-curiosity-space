import { Link } from "react-router-dom";
import { School, Eye, ArrowRight, TrendingUp, FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface CachedSchool {
  school_id: string;
  school_name: string;
  slug: string;
  city: string | null;
  state: string | null;
  total_views: number;
  total_list_views: number;
  rank_position: number;
}

interface CachedList {
  list_id: string;
  school_id: string;
  school_name: string;
  school_slug: string;
  grade_id: string;
  grade_name: string;
  total_views: number;
  rank_position: number;
}

export function PopularSchoolsSection() {
  // Fetch from cache table - instant response
  const { data: topSchools, isLoading: isLoadingSchools, error: schoolsError } = useQuery({
    queryKey: ["popular-schools-cache"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("popular_schools_cache")
        .select("school_id, school_name, slug, city, state, total_views, total_list_views, rank_position")
        .order("rank_position", { ascending: true })
        .limit(6);
      
      if (error) {
        console.error("Error fetching popular schools:", error);
        throw error;
      }
      return data as CachedSchool[];
    },
    staleTime: 1000 * 60 * 10, // Cache for 10 minutes
    retry: 1,
  });

  // Fetch from cache table - instant response
  const { data: topLists, isLoading: isLoadingLists, error: listsError } = useQuery({
    queryKey: ["popular-lists-cache"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("popular_lists_cache")
        .select("list_id, school_id, school_name, school_slug, grade_id, grade_name, total_views, rank_position")
        .order("rank_position", { ascending: true })
        .limit(4);
      
      if (error) {
        console.error("Error fetching popular lists:", error);
        throw error;
      }
      return data as CachedList[];
    },
    staleTime: 1000 * 60 * 10, // Cache for 10 minutes
    retry: 1,
  });

  const hasSchools = topSchools && topSchools.length > 0;
  const hasLists = topLists && topLists.length > 0;
  const hasData = hasSchools || hasLists;
  const isLoading = isLoadingSchools || isLoadingLists;
  const hasError = schoolsError || listsError;

  // Don't render section if no data and not loading
  if (!hasData && !isLoading && !hasError) {
    return null;
  }

  // If errors, silently hide the section
  if (hasError && !hasData) {
    return null;
  }

  return (
    <section className="bg-muted/30 py-16 md:py-24">
      <div className="container">
        <div className="mb-12 text-center">
          <Badge variant="secondary" className="mb-4">
            <TrendingUp className="mr-1 h-3 w-3" />
            Em alta
          </Badge>
          <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">
            Escolas mais procuradas
          </h2>
          <p className="mt-4 text-muted-foreground">
            Veja as escolas e listas mais acessadas pelos pais da região
          </p>
        </div>

        {/* Top Schools Grid */}
        <div className="mb-12">
          <h3 className="mb-6 flex items-center gap-2 font-display text-xl font-semibold">
            <School className="h-5 w-5 text-primary" />
            Escolas populares
          </h3>
          
          {isLoadingSchools ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-32 rounded-xl" />
              ))}
            </div>
          ) : hasSchools ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {topSchools.map((school) => (
                <Link 
                  key={school.school_id} 
                  to={`/escola/${school.slug}`}
                >
                  <Card className="group h-full transition-all hover:border-primary hover:shadow-lg">
                    <CardContent className="flex h-full flex-col p-4">
                      <div className="mb-2 flex items-start justify-between">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                          <School className="h-5 w-5" />
                        </div>
                        {school.rank_position <= 3 && (
                          <Badge variant="secondary" className="text-xs">
                            #{school.rank_position}
                          </Badge>
                        )}
                      </div>
                      <h4 className="mb-1 font-display font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                        {school.school_name}
                      </h4>
                      {(school.city || school.state) && (
                        <p className="mb-2 text-sm text-muted-foreground">
                          {[school.city, school.state].filter(Boolean).join(", ")}
                        </p>
                      )}
                      <div className="mt-auto flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {school.total_views?.toLocaleString() || 0} visitas
                        </span>
                        {school.total_list_views > 0 && (
                          <span className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            {school.total_list_views?.toLocaleString()} listas
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground">
              Nenhuma escola popular ainda. Seja o primeiro a contribuir!
            </p>
          )}
        </div>

        {/* Top Lists */}
        {hasLists && (
          <div className="mb-8">
            <h3 className="mb-6 flex items-center gap-2 font-display text-xl font-semibold">
              <FileText className="h-5 w-5 text-secondary" />
              Listas mais acessadas
            </h3>
            
            <div className="grid gap-4 sm:grid-cols-2">
              {topLists.map((list) => (
                <Link 
                  key={list.list_id} 
                  to={`/escola/${list.school_slug}?grade=${list.grade_id}`}
                >
                  <Card className="group transition-all hover:border-secondary hover:shadow-lg">
                    <CardContent className="flex items-center gap-4 p-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/10 text-secondary group-hover:bg-secondary group-hover:text-secondary-foreground transition-colors">
                        <FileText className="h-6 w-6" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-display font-semibold text-foreground line-clamp-1 group-hover:text-secondary transition-colors">
                          {list.school_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {list.grade_name || "Lista de materiais"}
                        </p>
                        <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                          <Eye className="h-3 w-3" />
                          {list.total_views?.toLocaleString() || 0} visualizações
                        </div>
                      </div>
                      {list.rank_position <= 2 && (
                        <Badge variant="outline" className="shrink-0">
                          #{list.rank_position}
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="text-center">
          <Link to="/escolas">
            <Button variant="outline" size="lg" className="gap-2">
              Ver todas as escolas
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
