import { Link } from "react-router-dom";
import { School, Eye, ArrowRight, TrendingUp, FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface TopSchool {
  school_id: string;
  school_name: string;
  city: string | null;
  state: string | null;
  total_views: number;
  total_list_views: number;
}

interface TopList {
  list_id: string;
  school_id: string;
  school_name: string;
  grade_name: string;
  total_views: number;
}

export function PopularSchoolsSection() {
  // Fetch top schools from analytics view
  const { data: topSchools, isLoading: isLoadingSchools } = useQuery({
    queryKey: ["top-schools-home"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("analytics_top_schools")
        .select("school_id, school_name, city, state, total_views, total_list_views")
        .order("total_views", { ascending: false })
        .limit(6);
      
      if (error) throw error;
      return data as TopSchool[];
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  // Fetch schools with slugs for linking
  const schoolIds = topSchools?.map(s => s.school_id) || [];
  const { data: schoolSlugs } = useQuery({
    queryKey: ["school-slugs", schoolIds],
    queryFn: async () => {
      if (schoolIds.length === 0) return {};
      const { data, error } = await supabase
        .from("schools")
        .select("id, slug")
        .in("id", schoolIds);
      
      if (error) throw error;
      return Object.fromEntries((data || []).map(s => [s.id, s.slug]));
    },
    enabled: schoolIds.length > 0,
  });

  // Fetch top lists
  const { data: topLists, isLoading: isLoadingLists } = useQuery({
    queryKey: ["top-lists-home"],
    queryFn: async () => {
      // Get list view events aggregated
      const { data, error } = await supabase
        .from("list_view_events")
        .select(`
          list_id,
          school_id,
          grade_id
        `)
        .limit(1000);
      
      if (error) throw error;
      
      // Count views per list
      const listCounts: Record<string, { list_id: string; school_id: string; grade_id: string; count: number }> = {};
      (data || []).forEach(event => {
        const key = event.list_id;
        if (!listCounts[key]) {
          listCounts[key] = { ...event, count: 0 };
        }
        listCounts[key].count++;
      });
      
      // Sort and take top 4
      return Object.values(listCounts)
        .sort((a, b) => b.count - a.count)
        .slice(0, 4);
    },
    staleTime: 1000 * 60 * 5,
  });

  // Fetch school and grade names for top lists
  const listSchoolIds = topLists?.map(l => l.school_id) || [];
  const listGradeIds = topLists?.map(l => l.grade_id) || [];
  
  const { data: listDetails } = useQuery({
    queryKey: ["list-details-home", listSchoolIds, listGradeIds],
    queryFn: async () => {
      if (listSchoolIds.length === 0) return { schools: {}, grades: {} };
      
      const [schoolsRes, gradesRes] = await Promise.all([
        supabase.from("schools").select("id, name, slug").in("id", listSchoolIds),
        supabase.from("grades").select("id, name").in("id", listGradeIds),
      ]);
      
      return {
        schools: Object.fromEntries((schoolsRes.data || []).map(s => [s.id, s])),
        grades: Object.fromEntries((gradesRes.data || []).map(g => [g.id, g.name])),
      };
    },
    enabled: listSchoolIds.length > 0,
  });

  const hasData = (topSchools && topSchools.length > 0) || (topLists && topLists.length > 0);

  if (!hasData && !isLoadingSchools && !isLoadingLists) {
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
          ) : topSchools && topSchools.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {topSchools.map((school, index) => (
                <Link 
                  key={school.school_id} 
                  to={`/escola/${schoolSlugs?.[school.school_id] || school.school_id}`}
                >
                  <Card className="group h-full transition-all hover:border-primary hover:shadow-lg">
                    <CardContent className="flex h-full flex-col p-4">
                      <div className="mb-2 flex items-start justify-between">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                          <School className="h-5 w-5" />
                        </div>
                        {index < 3 && (
                          <Badge variant="secondary" className="text-xs">
                            #{index + 1}
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
        {topLists && topLists.length > 0 && listDetails && (
          <div className="mb-8">
            <h3 className="mb-6 flex items-center gap-2 font-display text-xl font-semibold">
              <FileText className="h-5 w-5 text-secondary" />
              Listas mais acessadas
            </h3>
            
            <div className="grid gap-4 sm:grid-cols-2">
              {topLists.map((list, index) => {
                const school = listDetails.schools[list.school_id];
                const gradeName = listDetails.grades[list.grade_id];
                
                if (!school) return null;
                
                return (
                  <Link 
                    key={list.list_id} 
                    to={`/escola/${school.slug}?grade=${list.grade_id}`}
                  >
                    <Card className="group transition-all hover:border-secondary hover:shadow-lg">
                      <CardContent className="flex items-center gap-4 p-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/10 text-secondary group-hover:bg-secondary group-hover:text-secondary-foreground transition-colors">
                          <FileText className="h-6 w-6" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-display font-semibold text-foreground line-clamp-1 group-hover:text-secondary transition-colors">
                            {school.name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {gradeName || "Lista de materiais"}
                          </p>
                          <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                            <Eye className="h-3 w-3" />
                            {list.count?.toLocaleString() || 0} visualizações
                          </div>
                        </div>
                        {index < 2 && (
                          <Badge variant="outline" className="shrink-0">
                            #{index + 1}
                          </Badge>
                        )}
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
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
