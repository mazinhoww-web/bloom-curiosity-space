import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
} from "recharts";
import {
  MousePointerClick,
  Share2,
  TrendingUp,
  School,
  Package,
  Loader2,
  Search,
  Eye,
  ShoppingCart,
  MapPin,
  FileText,
} from "lucide-react";
import { format, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const COLORS = ["hsl(var(--primary))", "hsl(var(--secondary))", "hsl(var(--accent))", "hsl(var(--warning))", "hsl(var(--success))", "hsl(var(--info))"];

export default function Analytics() {
  const thirtyDaysAgo = useMemo(() => subDays(new Date(), 30).toISOString(), []);

  // Use analytics views for aggregated data
  const { data: dailySummary, isLoading: loadingDaily } = useQuery({
    queryKey: ["analytics-daily-summary"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("analytics_daily_summary")
        .select("*")
        .order("date", { ascending: false })
        .limit(14);
      if (error) throw error;
      return data?.reverse() || [];
    },
  });

  const { data: topSchools, isLoading: loadingSchools } = useQuery({
    queryKey: ["analytics-top-schools"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("analytics_top_schools")
        .select("*")
        .order("engagement_score", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: topGrades, isLoading: loadingGrades } = useQuery({
    queryKey: ["analytics-top-grades"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("analytics_top_grades")
        .select("*")
        .order("total_list_views", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: storeConversion, isLoading: loadingStores } = useQuery({
    queryKey: ["analytics-store-conversion"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("analytics_store_conversion")
        .select("*")
        .order("total_clicks", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: regionDemand, isLoading: loadingRegion } = useQuery({
    queryKey: ["analytics-region-demand"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("analytics_demand_by_region")
        .select("*")
        .order("total_list_views", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch raw events for additional analysis
  const { data: purchaseEvents } = useQuery({
    queryKey: ["analytics-purchases-raw"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("purchase_events")
        .select(`id, clicked_at, material_items (name, material_categories (name))`)
        .gte("clicked_at", thirtyDaysAgo);
      if (error) throw error;
      return data;
    },
  });

  const { data: shareEvents } = useQuery({
    queryKey: ["analytics-shares-raw"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("share_events")
        .select(`id, shared_at, share_type`)
        .gte("shared_at", thirtyDaysAgo);
      if (error) throw error;
      return data;
    },
  });

  // Process shares by type
  const sharesByType = useMemo(() => {
    if (!shareEvents) return [];
    const counts: Record<string, number> = {};
    for (const event of shareEvents) {
      const type = event.share_type === "whatsapp" ? "WhatsApp" : "Link Copiado";
      counts[type] = (counts[type] || 0) + 1;
    }
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [shareEvents]);

  // Process top items
  const topItems = useMemo(() => {
    if (!purchaseEvents) return [];
    const counts: Record<string, { name: string; category: string; clicks: number }> = {};
    for (const event of purchaseEvents) {
      const itemName = (event.material_items as any)?.name || "Desconhecido";
      const categoryName = (event.material_items as any)?.material_categories?.name || "Outros";
      const key = itemName;
      if (!counts[key]) {
        counts[key] = { name: itemName, category: categoryName, clicks: 0 };
      }
      counts[key].clicks++;
    }
    return Object.values(counts)
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 10);
  }, [purchaseEvents]);

  // Show partial data while loading - don't block the entire page
  const isLoadingAll = loadingDaily && loadingSchools && loadingGrades && loadingStores && loadingRegion;

  // Calculate totals from daily summary
  const totals = dailySummary?.reduce(
    (acc, day) => ({
      listViews: acc.listViews + (day.list_views || 0),
      schoolViews: acc.schoolViews + (day.school_views || 0),
      cepSearches: acc.cepSearches + (day.cep_searches || 0),
      storeClicks: acc.storeClicks + (day.store_clicks || 0),
      shares: acc.shares + (day.shares || 0),
    }),
    { listViews: 0, schoolViews: 0, cepSearches: 0, storeClicks: 0, shares: 0 }
  ) || { listViews: 0, schoolViews: 0, cepSearches: 0, storeClicks: 0, shares: 0 };

  return (
    <AdminLayout title="Analytics" description="Métricas agregadas dos últimos 30 dias - Views materializadas">
      {/* Summary Cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-lg bg-primary/10 p-3">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Views de Listas</p>
              {loadingDaily ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <p className="text-2xl font-bold">{totals.listViews.toLocaleString()}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-lg bg-secondary/10 p-3">
              <Eye className="h-5 w-5 text-secondary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Views de Escolas</p>
              {loadingDaily ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <p className="text-2xl font-bold">{totals.schoolViews.toLocaleString()}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-lg bg-warning/10 p-3">
              <ShoppingCart className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Cliques em Lojas</p>
              {loadingDaily ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <p className="text-2xl font-bold">{totals.storeClicks.toLocaleString()}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-lg bg-success/10 p-3">
              <Share2 className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Compartilhamentos</p>
              {loadingDaily ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <p className="text-2xl font-bold">{totals.shares.toLocaleString()}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-lg bg-info/10 p-3">
              <Search className="h-5 w-5 text-info" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Buscas por CEP</p>
              {loadingDaily ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <p className="text-2xl font-bold">{totals.cepSearches.toLocaleString()}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="schools">Escolas</TabsTrigger>
          <TabsTrigger value="stores">Lojas</TabsTrigger>
          <TabsTrigger value="regions">Regiões</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Daily Trend Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Tendência Diária (14 dias)
              </CardTitle>
              <CardDescription>Engajamento ao longo do tempo</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailySummary || []}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(v) => format(new Date(v), "dd/MM", { locale: ptBR })}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      labelFormatter={(v) => format(new Date(v), "dd/MM/yyyy", { locale: ptBR })}
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="list_views"
                      stackId="1"
                      stroke="hsl(var(--primary))"
                      fill="hsl(var(--primary))"
                      fillOpacity={0.6}
                      name="Views Listas"
                    />
                    <Area
                      type="monotone"
                      dataKey="store_clicks"
                      stackId="1"
                      stroke="hsl(var(--warning))"
                      fill="hsl(var(--warning))"
                      fillOpacity={0.6}
                      name="Cliques Lojas"
                    />
                    <Area
                      type="monotone"
                      dataKey="shares"
                      stackId="1"
                      stroke="hsl(var(--success))"
                      fill="hsl(var(--success))"
                      fillOpacity={0.6}
                      name="Shares"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Shares by Type */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Share2 className="h-5 w-5 text-success" />
                  Compartilhamentos por Tipo
                </CardTitle>
              </CardHeader>
              <CardContent>
                {sharesByType.length > 0 ? (
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={sharesByType}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          dataKey="value"
                          nameKey="name"
                          label={({ name, percent }) =>
                            `${name}: ${(percent * 100).toFixed(0)}%`
                          }
                        >
                          {sharesByType.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="py-12 text-center text-muted-foreground">Nenhum dado</p>
                )}
              </CardContent>
            </Card>

            {/* Top Items */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-warning" />
                  Top 10 Itens Clicados
                </CardTitle>
              </CardHeader>
              <CardContent>
                {topItems.length > 0 ? (
                  <div className="space-y-3 max-h-[250px] overflow-y-auto">
                    {topItems.map((item, i) => {
                      const maxClicks = topItems[0]?.clicks || 1;
                      return (
                        <div key={i} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium truncate flex-1">{item.name}</span>
                            <span className="text-muted-foreground ml-2">{item.clicks}</span>
                          </div>
                          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-warning"
                              style={{ width: `${(item.clicks / maxClicks) * 100}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="py-12 text-center text-muted-foreground">Nenhum clique</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Top Grades */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-secondary" />
                Engajamento por Série
              </CardTitle>
            </CardHeader>
            <CardContent>
              {topGrades && topGrades.length > 0 ? (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topGrades} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis type="number" tick={{ fontSize: 12 }} />
                      <YAxis type="category" dataKey="grade_name" tick={{ fontSize: 11 }} width={120} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Bar dataKey="total_list_views" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} name="Views" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="py-12 text-center text-muted-foreground">Nenhum dado</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schools" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <School className="h-5 w-5 text-primary" />
                Top 10 Escolas por Engajamento
              </CardTitle>
              <CardDescription>Score = views + cliques + compartilhamentos</CardDescription>
            </CardHeader>
            <CardContent>
              {topSchools && topSchools.length > 0 ? (
                <div className="space-y-4">
                  {topSchools.map((school, i) => (
                    <div key={school.school_id} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                      <span className="text-lg font-bold text-muted-foreground w-8">#{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{school.school_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {school.city}, {school.state}
                        </p>
                      </div>
                      <div className="text-right space-y-1">
                        <p className="text-lg font-bold">{school.engagement_score?.toLocaleString() || 0}</p>
                        <p className="text-xs text-muted-foreground">
                          {school.total_views} views • {school.total_store_clicks} cliques
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-12 text-center text-muted-foreground">Nenhum dado</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stores" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-warning" />
                Conversão por Loja Parceira
              </CardTitle>
            </CardHeader>
            <CardContent>
              {storeConversion && storeConversion.length > 0 ? (
                <div className="space-y-4">
                  {storeConversion.map((store, i) => (
                    <div key={store.store_id} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                      <span className="text-lg font-bold text-muted-foreground w-8">#{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">{store.store_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {store.unique_sessions?.toLocaleString() || 0} sessões únicas
                        </p>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <p className="text-lg font-bold">{store.total_clicks?.toLocaleString() || 0}</p>
                          <p className="text-xs text-muted-foreground">Total</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-warning">{store.cart_clicks?.toLocaleString() || 0}</p>
                          <p className="text-xs text-muted-foreground">Carrinho</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-info">{store.item_clicks?.toLocaleString() || 0}</p>
                          <p className="text-xs text-muted-foreground">Itens</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-12 text-center text-muted-foreground">Nenhum dado</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="regions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-info" />
                Demanda por Região
              </CardTitle>
              <CardDescription>Baseado em buscas por CEP e views</CardDescription>
            </CardHeader>
            <CardContent>
              {regionDemand && regionDemand.length > 0 ? (
                <div className="space-y-4">
                  {regionDemand.map((region, i) => (
                    <div key={region.cep_prefix} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                      <span className="text-lg font-bold text-muted-foreground w-8">#{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">
                          {region.city || "Cidade desconhecida"}, {region.state || "-"}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono">
                          CEP: {region.cep_prefix}xxx
                        </p>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <p className="text-lg font-bold">{region.total_schools?.toLocaleString() || 0}</p>
                          <p className="text-xs text-muted-foreground">Escolas</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-primary">{region.total_list_views?.toLocaleString() || 0}</p>
                          <p className="text-xs text-muted-foreground">Views</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-warning">{region.total_store_clicks?.toLocaleString() || 0}</p>
                          <p className="text-xs text-muted-foreground">Cliques</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-12 text-center text-muted-foreground">Nenhum dado</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
}
