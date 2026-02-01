import { School, FileText, Package, MousePointerClick, Share2, TrendingUp } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface DashboardStats {
  totalSchools: number;
  totalLists: number;
  totalItems: number;
  totalPurchaseClicks: number;
  totalShares: number;
}

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-dashboard-stats"],
    queryFn: async (): Promise<DashboardStats> => {
      const [schoolsRes, listsRes, itemsRes, purchasesRes, sharesRes] = await Promise.all([
        supabase.from("schools").select("id", { count: "exact", head: true }),
        supabase.from("material_lists").select("id", { count: "exact", head: true }),
        supabase.from("material_items").select("id", { count: "exact", head: true }),
        supabase.from("purchase_events").select("id", { count: "exact", head: true }),
        supabase.from("share_events").select("id", { count: "exact", head: true }),
      ]);

      return {
        totalSchools: schoolsRes.count || 0,
        totalLists: listsRes.count || 0,
        totalItems: itemsRes.count || 0,
        totalPurchaseClicks: purchasesRes.count || 0,
        totalShares: sharesRes.count || 0,
      };
    },
  });

  const statCards = [
    {
      title: "Escolas",
      value: stats?.totalSchools || 0,
      icon: School,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      title: "Listas",
      value: stats?.totalLists || 0,
      icon: FileText,
      color: "text-secondary",
      bg: "bg-secondary/10",
    },
    {
      title: "Itens",
      value: stats?.totalItems || 0,
      icon: Package,
      color: "text-accent",
      bg: "bg-accent/10",
    },
    {
      title: "Cliques em Compras",
      value: stats?.totalPurchaseClicks || 0,
      icon: MousePointerClick,
      color: "text-warning",
      bg: "bg-warning/10",
    },
    {
      title: "Compartilhamentos",
      value: stats?.totalShares || 0,
      icon: Share2,
      color: "text-success",
      bg: "bg-success/10",
    },
  ];

  return (
    <AdminLayout title="Dashboard" description="Visão geral da plataforma">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
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

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display">
              <TrendingUp className="h-5 w-5 text-primary" />
              Atividade Recente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RecentActivity />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display">
              <MousePointerClick className="h-5 w-5 text-warning" />
              Top Itens Clicados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TopClickedItems />
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

function RecentActivity() {
  const { data: recentEvents, isLoading } = useQuery({
    queryKey: ["recent-activity"],
    queryFn: async () => {
      const [purchases, shares] = await Promise.all([
        supabase
          .from("purchase_events")
          .select(`
            id,
            clicked_at,
            material_items (name),
            schools (name)
          `)
          .order("clicked_at", { ascending: false })
          .limit(5),
        supabase
          .from("share_events")
          .select(`
            id,
            shared_at,
            share_type,
            schools (name)
          `)
          .order("shared_at", { ascending: false })
          .limit(5),
      ]);

      const events = [
        ...(purchases.data || []).map((p: any) => ({
          type: "purchase" as const,
          date: p.clicked_at,
          description: `Clique em "${p.material_items?.name}" - ${p.schools?.name}`,
        })),
        ...(shares.data || []).map((s: any) => ({
          type: "share" as const,
          date: s.shared_at,
          description: `Compartilhamento via ${s.share_type} - ${s.schools?.name}`,
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
              event.type === "purchase"
                ? "bg-warning/10 text-warning"
                : "bg-success/10 text-success"
            }`}
          >
            {event.type === "purchase" ? (
              <MousePointerClick className="h-4 w-4" />
            ) : (
              <Share2 className="h-4 w-4" />
            )}
          </div>
          <div className="flex-1 truncate text-sm">{event.description}</div>
          <span className="text-xs text-muted-foreground">
            {new Date(event.date).toLocaleDateString("pt-BR")}
          </span>
        </div>
      ))}
    </div>
  );
}

function TopClickedItems() {
  const { data: topItems, isLoading } = useQuery({
    queryKey: ["top-clicked-items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("purchase_events")
        .select(`
          item_id,
          material_items (name)
        `);

      if (error) throw error;

      // Count clicks per item
      const counts: Record<string, { name: string; count: number }> = {};
      for (const event of data || []) {
        const itemId = event.item_id;
        const itemName = (event.material_items as any)?.name || "Item desconhecido";
        if (!counts[itemId]) {
          counts[itemId] = { name: itemName, count: 0 };
        }
        counts[itemId].count++;
      }

      return Object.values(counts)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
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

  if (!topItems || topItems.length === 0) {
    return (
      <p className="py-8 text-center text-muted-foreground">
        Nenhum clique registrado
      </p>
    );
  }

  const maxCount = Math.max(...topItems.map((i) => i.count));

  return (
    <div className="space-y-3">
      {topItems.map((item, i) => (
        <div key={i} className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="truncate font-medium">{item.name}</span>
            <span className="text-muted-foreground">{item.count} cliques</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-warning"
              style={{ width: `${(item.count / maxCount) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
