import { useMemo } from "react";
import { 
  School, 
  FileText, 
  Package, 
  MousePointerClick, 
  Share2, 
  TrendingUp, 
  Search,
  Eye,
  ShoppingCart,
  ArrowUp,
  ArrowDown,
  Minus,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Activity,
} from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { format, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DashboardStats {
  totalSchools: number;
  activeSchools: number;
  totalLists: number;
  activeLists: number;
  totalItems: number;
  totalPurchaseClicks: number;
  totalShares: number;
  totalSchoolViews: number;
  totalListViews: number;
  totalCepSearches: number;
  totalStoreClicks: number;
  totalUploadedLists: number;
  // Last 7 days
  purchaseClicks7d: number;
  shares7d: number;
  schoolViews7d: number;
  listViews7d: number;
  cepSearches7d: number;
  storeClicks7d: number;
  // Last 30 days
  purchaseClicks30d: number;
  shares30d: number;
}

interface ImportJob {
  id: string;
  status: string;
  file_name: string;
  total_records: number;
  processed_records: number;
  inserted_records: number;
  error_message: string | null;
  created_at: string;
}

export default function Dashboard() {
  const sevenDaysAgo = useMemo(() => subDays(new Date(), 7).toISOString(), []);
  const thirtyDaysAgo = useMemo(() => subDays(new Date(), 30).toISOString(), []);

  // Fetch all stats with server-side aggregation
  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-dashboard-stats-v2"],
    queryFn: async (): Promise<DashboardStats> => {
      const [
        schoolsRes,
        activeSchoolsRes,
        listsRes,
        activeListsRes,
        itemsRes,
        purchasesRes,
        sharesRes,
        schoolViewsRes,
        listViewsRes,
        cepSearchesRes,
        storeClicksRes,
        uploadedListsRes,
        // 7 days
        purchases7dRes,
        shares7dRes,
        schoolViews7dRes,
        listViews7dRes,
        cepSearches7dRes,
        storeClicks7dRes,
        // 30 days
        purchases30dRes,
        shares30dRes,
      ] = await Promise.all([
        supabase.from("schools").select("id", { count: "exact", head: true }),
        supabase.from("schools").select("id", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("material_lists").select("id", { count: "exact", head: true }),
        supabase.from("material_lists").select("id", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("material_items").select("id", { count: "exact", head: true }),
        supabase.from("purchase_events").select("id", { count: "exact", head: true }),
        supabase.from("share_events").select("id", { count: "exact", head: true }),
        supabase.from("school_view_events").select("id", { count: "exact", head: true }),
        supabase.from("list_view_events").select("id", { count: "exact", head: true }),
        supabase.from("cep_search_events").select("id", { count: "exact", head: true }),
        supabase.from("store_click_events").select("id", { count: "exact", head: true }),
        supabase.from("uploaded_lists").select("id", { count: "exact", head: true }),
        // 7 days
        supabase.from("purchase_events").select("id", { count: "exact", head: true }).gte("clicked_at", sevenDaysAgo),
        supabase.from("share_events").select("id", { count: "exact", head: true }).gte("shared_at", sevenDaysAgo),
        supabase.from("school_view_events").select("id", { count: "exact", head: true }).gte("viewed_at", sevenDaysAgo),
        supabase.from("list_view_events").select("id", { count: "exact", head: true }).gte("viewed_at", sevenDaysAgo),
        supabase.from("cep_search_events").select("id", { count: "exact", head: true }).gte("searched_at", sevenDaysAgo),
        supabase.from("store_click_events").select("id", { count: "exact", head: true }).gte("clicked_at", sevenDaysAgo),
        // 30 days
        supabase.from("purchase_events").select("id", { count: "exact", head: true }).gte("clicked_at", thirtyDaysAgo),
        supabase.from("share_events").select("id", { count: "exact", head: true }).gte("shared_at", thirtyDaysAgo),
      ]);

      return {
        totalSchools: schoolsRes.count || 0,
        activeSchools: activeSchoolsRes.count || 0,
        totalLists: listsRes.count || 0,
        activeLists: activeListsRes.count || 0,
        totalItems: itemsRes.count || 0,
        totalPurchaseClicks: purchasesRes.count || 0,
        totalShares: sharesRes.count || 0,
        totalSchoolViews: schoolViewsRes.count || 0,
        totalListViews: listViewsRes.count || 0,
        totalCepSearches: cepSearchesRes.count || 0,
        totalStoreClicks: storeClicksRes.count || 0,
        totalUploadedLists: uploadedListsRes.count || 0,
        // 7 days
        purchaseClicks7d: purchases7dRes.count || 0,
        shares7d: shares7dRes.count || 0,
        schoolViews7d: schoolViews7dRes.count || 0,
        listViews7d: listViews7dRes.count || 0,
        cepSearches7d: cepSearches7dRes.count || 0,
        storeClicks7d: storeClicks7dRes.count || 0,
        // 30 days
        purchaseClicks30d: purchases30dRes.count || 0,
        shares30d: shares30dRes.count || 0,
      };
    },
    staleTime: 60000, // 1 minute
  });

  // Fetch import jobs (latest)
  const { data: importJobs } = useQuery({
    queryKey: ["admin-import-jobs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("import_jobs")
        .select("id, status, file_name, total_records, processed_records, inserted_records, error_message, created_at")
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data as ImportJob[];
    },
  });

  const formatNumber = (n: number) => n.toLocaleString("pt-BR");

  const TrendIndicator = ({ current, previous }: { current: number; previous: number }) => {
    if (previous === 0 && current === 0) return <Minus className="h-3 w-3 text-muted-foreground" />;
    if (current > previous) return <ArrowUp className="h-3 w-3 text-success" />;
    if (current < previous) return <ArrowDown className="h-3 w-3 text-destructive" />;
    return <Minus className="h-3 w-3 text-muted-foreground" />;
  };

  // Primary stats - Entidades principais
  const primaryStats = [
    {
      title: "Total de Escolas",
      value: stats?.totalSchools || 0,
      subtitle: `${stats?.activeSchools || 0} ativas`,
      icon: School,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      title: "Listas de Materiais",
      value: stats?.totalLists || 0,
      subtitle: `${stats?.activeLists || 0} ativas`,
      icon: FileText,
      color: "text-secondary",
      bg: "bg-secondary/10",
    },
    {
      title: "Itens Cadastrados",
      value: stats?.totalItems || 0,
      subtitle: "materiais únicos",
      icon: Package,
      color: "text-accent",
      bg: "bg-accent/10",
    },
    {
      title: "Uploads da Comunidade",
      value: stats?.totalUploadedLists || 0,
      subtitle: "listas enviadas",
      icon: TrendingUp,
      color: "text-info",
      bg: "bg-info/10",
    },
  ];

  // Engagement stats - Eventos de analytics
  const engagementStats = [
    {
      title: "Cliques em Compras",
      value: stats?.totalPurchaseClicks || 0,
      last7d: stats?.purchaseClicks7d || 0,
      last30d: stats?.purchaseClicks30d || 0,
      icon: MousePointerClick,
      color: "text-warning",
      bg: "bg-warning/10",
    },
    {
      title: "Cliques em Lojas",
      value: stats?.totalStoreClicks || 0,
      last7d: stats?.storeClicks7d || 0,
      last30d: null,
      icon: ShoppingCart,
      color: "text-success",
      bg: "bg-success/10",
    },
    {
      title: "Compartilhamentos",
      value: stats?.totalShares || 0,
      last7d: stats?.shares7d || 0,
      last30d: stats?.shares30d || 0,
      icon: Share2,
      color: "text-info",
      bg: "bg-info/10",
    },
    {
      title: "Buscas por CEP",
      value: stats?.totalCepSearches || 0,
      last7d: stats?.cepSearches7d || 0,
      last30d: null,
      icon: Search,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      title: "Views de Escolas",
      value: stats?.totalSchoolViews || 0,
      last7d: stats?.schoolViews7d || 0,
      last30d: null,
      icon: Eye,
      color: "text-secondary",
      bg: "bg-secondary/10",
    },
    {
      title: "Views de Listas",
      value: stats?.totalListViews || 0,
      last7d: stats?.listViews7d || 0,
      last30d: null,
      icon: FileText,
      color: "text-accent",
      bg: "bg-accent/10",
    },
  ];

  return (
    <AdminLayout title="Dashboard" description="Visão geral da plataforma - Dados reais">
      {/* Estado da Plataforma */}
      <section className="mb-8">
        <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold">
          <Activity className="h-5 w-5 text-primary" />
          Estado da Plataforma
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {primaryStats.map((stat) => (
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
                  <>
                    <p className="text-2xl font-bold">{formatNumber(stat.value)}</p>
                    <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Métricas de Engajamento */}
      <section className="mb-8">
        <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold">
          <TrendingUp className="h-5 w-5 text-warning" />
          Métricas de Engajamento
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {engagementStats.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`rounded-lg p-1.5 ${stat.bg}`}>
                  <stat.icon className={`h-3 w-3 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent className="space-y-1">
                {isLoading ? (
                  <Skeleton className="h-6 w-16" />
                ) : (
                  <>
                    <p className="text-xl font-bold">{formatNumber(stat.value)}</p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">{formatNumber(stat.last7d)}</span>
                      <span>últimos 7d</span>
                    </div>
                    {stat.last30d !== null && (
                      <div className="text-xs text-muted-foreground">
                        {formatNumber(stat.last30d)} últimos 30d
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Saúde do Sistema e Jobs */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Import Jobs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display">
              <Clock className="h-5 w-5 text-primary" />
              Jobs de Importação
            </CardTitle>
            <CardDescription>Últimas importações de escolas</CardDescription>
          </CardHeader>
          <CardContent>
            {importJobs && importJobs.length > 0 ? (
              <div className="space-y-3">
                {importJobs.map((job) => (
                  <div
                    key={job.id}
                    className="flex items-center gap-3 rounded-lg bg-muted/50 p-3"
                  >
                    <div className={`rounded-full p-2 ${
                      job.status === "completed" ? "bg-success/10 text-success" :
                      job.status === "failed" ? "bg-destructive/10 text-destructive" :
                      job.status === "processing" ? "bg-warning/10 text-warning" :
                      "bg-muted text-muted-foreground"
                    }`}>
                      {job.status === "completed" ? <CheckCircle2 className="h-4 w-4" /> :
                       job.status === "failed" ? <AlertTriangle className="h-4 w-4" /> :
                       job.status === "processing" ? <Loader2 className="h-4 w-4 animate-spin" /> :
                       <Clock className="h-4 w-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{job.file_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {job.inserted_records?.toLocaleString() || 0} inseridos de {job.total_records?.toLocaleString() || 0}
                      </p>
                    </div>
                    <Badge variant={
                      job.status === "completed" ? "default" :
                      job.status === "failed" ? "destructive" :
                      "secondary"
                    }>
                      {job.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-8 text-center text-muted-foreground">
                Nenhum job de importação registrado
              </p>
            )}
            <div className="mt-4">
              <Link to="/admin/escolas">
                <Button variant="outline" className="w-full">
                  Gerenciar Escolas
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Atividade Recente */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display">
              <Activity className="h-5 w-5 text-secondary" />
              Atividade Recente
            </CardTitle>
            <CardDescription>Últimos eventos do sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <RecentActivity />
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <section className="mt-8">
        <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold">
          Ações Rápidas
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link to="/admin/escolas">
            <Card className="cursor-pointer transition-colors hover:bg-muted/50">
              <CardContent className="flex items-center gap-4 p-4">
                <School className="h-8 w-8 text-primary" />
                <div>
                  <p className="font-medium">Gerenciar Escolas</p>
                  <p className="text-sm text-muted-foreground">Importar, editar, ativar</p>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link to="/admin/listas">
            <Card className="cursor-pointer transition-colors hover:bg-muted/50">
              <CardContent className="flex items-center gap-4 p-4">
                <FileText className="h-8 w-8 text-secondary" />
                <div>
                  <p className="font-medium">Gerenciar Listas</p>
                  <p className="text-sm text-muted-foreground">Criar, revisar, aprovar</p>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link to="/admin/analytics">
            <Card className="cursor-pointer transition-colors hover:bg-muted/50">
              <CardContent className="flex items-center gap-4 p-4">
                <TrendingUp className="h-8 w-8 text-warning" />
                <div>
                  <p className="font-medium">Analytics Detalhado</p>
                  <p className="text-sm text-muted-foreground">Gráficos e tendências</p>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Card className="cursor-not-allowed opacity-50">
            <CardContent className="flex items-center gap-4 p-4">
              <Package className="h-8 w-8 text-accent" />
              <div>
                <p className="font-medium">Reindexar Busca</p>
                <p className="text-sm text-muted-foreground">Em breve</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </AdminLayout>
  );
}

function RecentActivity() {
  const { data: recentEvents, isLoading } = useQuery({
    queryKey: ["recent-activity-v2"],
    queryFn: async () => {
      const [purchases, shares, storeClicks] = await Promise.all([
        supabase
          .from("purchase_events")
          .select(`id, clicked_at, material_items (name), schools (name)`)
          .order("clicked_at", { ascending: false })
          .limit(3),
        supabase
          .from("share_events")
          .select(`id, shared_at, share_type, schools (name)`)
          .order("shared_at", { ascending: false })
          .limit(3),
        supabase
          .from("store_click_events")
          .select(`id, clicked_at, partner_stores (name), schools (name)`)
          .order("clicked_at", { ascending: false })
          .limit(3),
      ]);

      const events = [
        ...(purchases.data || []).map((p: any) => ({
          type: "purchase" as const,
          date: p.clicked_at,
          description: `Clique: "${p.material_items?.name || 'Item'}" - ${p.schools?.name || 'Escola'}`,
        })),
        ...(shares.data || []).map((s: any) => ({
          type: "share" as const,
          date: s.shared_at,
          description: `Compartilhou via ${s.share_type} - ${s.schools?.name || 'Escola'}`,
        })),
        ...(storeClicks.data || []).map((c: any) => ({
          type: "store" as const,
          date: c.clicked_at,
          description: `Clique em ${c.partner_stores?.name || 'Loja'} - ${c.schools?.name || 'Escola'}`,
        })),
      ];

      return events
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 8);
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  if (!recentEvents || recentEvents.length === 0) {
    return (
      <p className="py-8 text-center text-muted-foreground">
        Nenhuma atividade recente
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {recentEvents.map((event, i) => (
        <div
          key={i}
          className="flex items-center gap-3 rounded-lg bg-muted/50 p-3"
        >
          <div
            className={`rounded-full p-2 ${
              event.type === "purchase" ? "bg-warning/10 text-warning" :
              event.type === "share" ? "bg-success/10 text-success" :
              "bg-info/10 text-info"
            }`}
          >
            {event.type === "purchase" ? <MousePointerClick className="h-4 w-4" /> :
             event.type === "share" ? <Share2 className="h-4 w-4" /> :
             <ShoppingCart className="h-4 w-4" />}
          </div>
          <div className="flex-1 truncate text-sm">{event.description}</div>
          <span className="text-xs text-muted-foreground">
            {format(new Date(event.date), "dd/MM HH:mm", { locale: ptBR })}
          </span>
        </div>
      ))}
    </div>
  );
}
