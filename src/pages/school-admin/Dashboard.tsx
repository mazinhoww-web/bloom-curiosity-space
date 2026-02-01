import { FileText, CheckCircle, Eye } from "lucide-react";
import { SchoolAdminLayout } from "@/components/school-admin/SchoolAdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { OnboardingChecklist } from "@/components/school-admin/OnboardingChecklist";

export default function SchoolAdminDashboard() {
  const { schoolId } = useAuth();

  const { data: stats, isLoading } = useQuery({
    queryKey: ["school-admin-stats", schoolId],
    queryFn: async () => {
      if (!schoolId) return null;

      // Separate queries to avoid type instantiation issues
      const listsRes = await supabase
        .from("material_lists")
        .select("id", { count: "exact", head: true })
        .eq("school_id", schoolId);

      const officialRes = await supabase
        .from("material_lists")
        .select("id, is_official", { count: "exact", head: true })
        .eq("school_id", schoolId)
        .filter("is_official", "eq", true);

      const viewsRes = await supabase
        .from("school_view_events")
        .select("id", { count: "exact", head: true })
        .eq("school_id", schoolId);

      return {
        totalLists: listsRes.count || 0,
        officialLists: officialRes.count || 0,
        totalViews: viewsRes.count || 0,
      };
    },
    enabled: !!schoolId,
  });

  // Query for onboarding status
  const { data: onboardingStatus } = useQuery({
    queryKey: ["school-admin-onboarding", schoolId],
    queryFn: async () => {
      if (!schoolId) return null;

      // Check if has any lists
      const { data: lists } = await supabase
        .from("material_lists")
        .select("id")
        .eq("school_id", schoolId)
        .eq("is_active", true);

      const hasLists = (lists?.length || 0) > 0;
      
      // Check for official lists separately
      const { count: officialCount } = await supabase
        .from("material_lists")
        .select("id", { count: "exact", head: true })
        .eq("school_id", schoolId)
        .eq("is_active", true)
        .filter("is_official", "eq", true);
      
      const hasOfficialList = (officialCount || 0) > 0;

      // Check if any list has items
      let hasItemsReviewed = false;
      if (hasLists && lists) {
        const listIds = lists.map((l) => l.id);
        const { count } = await supabase
          .from("material_items")
          .select("id", { count: "exact", head: true })
          .in("list_id", listIds);
        hasItemsReviewed = (count || 0) > 0;
      }

      return {
        hasLists,
        hasOfficialList,
        hasItemsReviewed,
      };
    },
    enabled: !!schoolId,
  });

  const { data: school } = useQuery({
    queryKey: ["school-admin-school-info", schoolId],
    queryFn: async () => {
      if (!schoolId) return null;
      const { data, error } = await supabase
        .from("schools")
        .select("*")
        .eq("id", schoolId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!schoolId,
  });

  const statCards = [
    {
      title: "Listas Criadas",
      value: stats?.totalLists || 0,
      icon: FileText,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      title: "Listas Oficiais",
      value: stats?.officialLists || 0,
      icon: CheckCircle,
      color: "text-success",
      bg: "bg-success/10",
    },
    {
      title: "Visualizações",
      value: stats?.totalViews || 0,
      icon: Eye,
      color: "text-secondary",
      bg: "bg-secondary/10",
    },
  ];

  // Show onboarding if not complete
  const showOnboarding = onboardingStatus && (
    !onboardingStatus.hasLists || 
    !onboardingStatus.hasItemsReviewed || 
    !onboardingStatus.hasOfficialList
  );

  return (
    <SchoolAdminLayout 
      title="Dashboard" 
      description={school?.name || "Painel da sua escola"}
    >
      {/* Onboarding Checklist */}
      {showOnboarding && onboardingStatus && (
        <div className="mb-6">
          <OnboardingChecklist
            hasLists={onboardingStatus.hasLists}
            hasOfficialList={onboardingStatus.hasOfficialList}
            hasItemsReviewed={onboardingStatus.hasItemsReviewed}
            schoolSlug={school?.slug}
          />
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`rounded-lg p-2 ${stat.bg}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <p className="text-2xl font-bold">{stat.value.toLocaleString()}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle className="font-display">Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            <Link to="/escola-admin/listas">
              <Button className="gap-2">
                <FileText className="h-4 w-4" />
                Gerenciar Listas
              </Button>
            </Link>
            {school?.slug && (
              <Link to={`/escola/${school.slug}`} target="_blank">
                <Button variant="outline" className="gap-2">
                  <Eye className="h-4 w-4" />
                  Ver Página Pública
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      </div>
    </SchoolAdminLayout>
  );
}
