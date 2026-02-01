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
} from "recharts";
import {
  MousePointerClick,
  Share2,
  TrendingUp,
  School,
  Package,
  Loader2,
} from "lucide-react";
import { format, subDays, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

const COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ec4899", "#8b5cf6", "#06b6d4"];

export default function Analytics() {
  // Fetch purchase events with dates
  const { data: purchaseEvents, isLoading: loadingPurchases } = useQuery({
    queryKey: ["analytics-purchases"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("purchase_events")
        .select(`
          id,
          clicked_at,
          item_id,
          school_id,
          material_items (name, category_id, material_categories (name)),
          schools (name)
        `)
        .gte("clicked_at", subDays(new Date(), 30).toISOString())
        .order("clicked_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // Fetch share events
  const { data: shareEvents, isLoading: loadingShares } = useQuery({
    queryKey: ["analytics-shares"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("share_events")
        .select(`
          id,
          shared_at,
          share_type,
          school_id,
          schools (name)
        `)
        .gte("shared_at", subDays(new Date(), 30).toISOString())
        .order("shared_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // Process data for charts
  const dailyClicksData = useMemo(() => {
    if (!purchaseEvents) return [];

    const counts: Record<string, number> = {};
    for (let i = 13; i >= 0; i--) {
      const date = format(subDays(new Date(), i), "dd/MM");
      counts[date] = 0;
    }

    for (const event of purchaseEvents) {
      const date = format(new Date(event.clicked_at), "dd/MM");
      if (counts[date] !== undefined) {
        counts[date]++;
      }
    }

    return Object.entries(counts).map(([date, clicks]) => ({
      date,
      clicks,
    }));
  }, [purchaseEvents]);

  const sharesByType = useMemo(() => {
    if (!shareEvents) return [];

    const counts: Record<string, number> = {};
    for (const event of shareEvents) {
      const type = event.share_type === "whatsapp" ? "WhatsApp" : "Link Copiado";
      counts[type] = (counts[type] || 0) + 1;
    }

    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [shareEvents]);

  const topSchools = useMemo(() => {
    if (!purchaseEvents) return [];

    const counts: Record<string, { name: string; clicks: number }> = {};
    for (const event of purchaseEvents) {
      const schoolName = (event.schools as any)?.name || "Desconhecida";
      if (!counts[event.school_id]) {
        counts[event.school_id] = { name: schoolName, clicks: 0 };
      }
      counts[event.school_id].clicks++;
    }

    return Object.values(counts)
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 5);
  }, [purchaseEvents]);

  const topItems = useMemo(() => {
    if (!purchaseEvents) return [];

    const counts: Record<string, { name: string; category: string; clicks: number }> = {};
    for (const event of purchaseEvents) {
      const itemName = (event.material_items as any)?.name || "Desconhecido";
      const categoryName = (event.material_items as any)?.material_categories?.name || "Outros";
      if (!counts[event.item_id]) {
        counts[event.item_id] = { name: itemName, category: categoryName, clicks: 0 };
      }
      counts[event.item_id].clicks++;
    }

    return Object.values(counts)
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 10);
  }, [purchaseEvents]);

  const isLoading = loadingPurchases || loadingShares;

  if (isLoading) {
    return (
      <AdminLayout title="Analytics" description="Métricas e estatísticas da plataforma">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }

  const totalClicks = purchaseEvents?.length || 0;
  const totalShares = shareEvents?.length || 0;

  return (
    <AdminLayout title="Analytics" description="Métricas e estatísticas dos últimos 30 dias">
      {/* Summary cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-lg bg-warning/10 p-3">
              <MousePointerClick className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Cliques em compras</p>
              <p className="text-2xl font-bold">{totalClicks}</p>
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
              <p className="text-2xl font-bold">{totalShares}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-lg bg-primary/10 p-3">
              <School className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Escolas ativas</p>
              <p className="text-2xl font-bold">{topSchools.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-lg bg-secondary/10 p-3">
              <Package className="h-5 w-5 text-secondary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Itens clicados</p>
              <p className="text-2xl font-bold">{topItems.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Daily clicks chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display">
              <TrendingUp className="h-5 w-5 text-primary" />
              Cliques por dia (últimos 14 dias)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyClicksData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                  />
                  <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="clicks"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--primary))" }}
                    name="Cliques"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Shares by type */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display">
              <Share2 className="h-5 w-5 text-success" />
              Compartilhamentos por tipo
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
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="py-12 text-center text-muted-foreground">
                Nenhum compartilhamento registrado
              </p>
            )}
          </CardContent>
        </Card>

        {/* Top schools */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display">
              <School className="h-5 w-5 text-primary" />
              Top Escolas (por cliques)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topSchools.length > 0 ? (
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topSchools} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" tick={{ fontSize: 12 }} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={{ fontSize: 11 }}
                      width={120}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar
                      dataKey="clicks"
                      fill="hsl(var(--primary))"
                      radius={[0, 4, 4, 0]}
                      name="Cliques"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="py-12 text-center text-muted-foreground">
                Nenhum clique registrado
              </p>
            )}
          </CardContent>
        </Card>

        {/* Top items */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display">
              <Package className="h-5 w-5 text-warning" />
              Top 10 Itens mais clicados
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topItems.length > 0 ? (
              <div className="space-y-3">
                {topItems.map((item, i) => {
                  const maxClicks = topItems[0]?.clicks || 1;
                  return (
                    <div key={i} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-muted-foreground">
                            #{i + 1}
                          </span>
                          <span className="font-medium">{item.name}</span>
                          <span className="text-xs text-muted-foreground">
                            ({item.category})
                          </span>
                        </div>
                        <span className="font-mono text-muted-foreground">
                          {item.clicks} cliques
                        </span>
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
              <p className="py-12 text-center text-muted-foreground">
                Nenhum clique registrado
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
