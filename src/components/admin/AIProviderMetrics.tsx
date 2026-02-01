/**
 * AI Provider Metrics Component
 * Exibe métricas de uso dos AI providers com gráficos
 */

import { useQuery } from "@tanstack/react-query";
import { 
  Brain, 
  TrendingUp, 
  Clock, 
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCcw
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent,
  type ChartConfig 
} from "@/components/ui/chart";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
  Legend
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ProviderStats {
  date: string;
  function_name: string;
  provider: string;
  total_calls: number;
  successful_calls: number;
  failed_calls: number;
  fallback_count: number;
  avg_response_time_ms: number;
}

const PROVIDER_COLORS: Record<string, string> = {
  "OpenRouter": "hsl(var(--primary))",
  "Lovable AI": "hsl(var(--secondary))",
  "openrouter": "hsl(var(--primary))",
  "lovable": "hsl(var(--secondary))",
};

const chartConfig: ChartConfig = {
  openrouter: {
    label: "OpenRouter",
    color: "hsl(var(--primary))",
  },
  lovable: {
    label: "Lovable AI",
    color: "hsl(var(--secondary))",
  },
  success: {
    label: "Sucesso",
    color: "hsl(142.1 76.2% 36.3%)",
  },
  failed: {
    label: "Falha",
    color: "hsl(var(--destructive))",
  },
};

export function AIProviderMetrics() {
  // Fetch raw metrics for detailed analysis
  const { data: rawMetrics, isLoading: loadingRaw } = useQuery({
    queryKey: ["admin-ai-raw-metrics"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_provider_metrics")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);

      if (error) throw error;
      return data;
    },
  });

  // Fetch aggregated stats from view
  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ["admin-ai-provider-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_provider_stats")
        .select("*")
        .order("date", { ascending: false })
        .limit(30);

      if (error) throw error;
      return data as ProviderStats[];
    },
  });

  const isLoading = loadingRaw || loadingStats;

  // Calculate summary metrics
  const summary = rawMetrics ? {
    totalCalls: rawMetrics.length,
    successRate: rawMetrics.length > 0 
      ? Math.round((rawMetrics.filter(m => m.success).length / rawMetrics.length) * 100) 
      : 0,
    avgResponseTime: rawMetrics.length > 0
      ? Math.round(rawMetrics.filter(m => m.response_time_ms).reduce((acc, m) => acc + (m.response_time_ms || 0), 0) / rawMetrics.filter(m => m.response_time_ms).length)
      : 0,
    fallbackRate: rawMetrics.length > 0
      ? Math.round((rawMetrics.filter(m => m.fallback_used).length / rawMetrics.length) * 100)
      : 0,
  } : null;

  // Provider distribution for pie chart
  const providerDistribution = rawMetrics ? 
    Object.entries(
      rawMetrics.reduce((acc, m) => {
        const provider = m.provider === "openrouter" ? "OpenRouter" : "Lovable AI";
        acc[provider] = (acc[provider] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    ).map(([name, value]) => ({ name, value, fill: PROVIDER_COLORS[name] || "hsl(var(--muted))" }))
    : [];

  // Daily calls trend
  const dailyTrend = stats ? 
    stats.reduce((acc, s) => {
      const existing = acc.find(a => a.date === s.date);
      if (existing) {
        if (s.provider === "openrouter") {
          existing.openrouter = (existing.openrouter || 0) + Number(s.total_calls);
        } else {
          existing.lovable = (existing.lovable || 0) + Number(s.total_calls);
        }
      } else {
        acc.push({
          date: s.date || "",
          openrouter: s.provider === "openrouter" ? Number(s.total_calls) : 0,
          lovable: s.provider !== "openrouter" ? Number(s.total_calls) : 0,
        });
      }
      return acc;
    }, [] as { date: string; openrouter: number; lovable: number }[])
    .slice(0, 7)
    .reverse()
    : [];

  // Success vs Failed for bar chart
  const successFailData = rawMetrics ?
    Object.entries(
      rawMetrics.reduce((acc, m) => {
        const provider = m.provider === "openrouter" ? "OpenRouter" : "Lovable AI";
        if (!acc[provider]) {
          acc[provider] = { success: 0, failed: 0 };
        }
        if (m.success) {
          acc[provider].success++;
        } else {
          acc[provider].failed++;
        }
        return acc;
      }, {} as Record<string, { success: number; failed: number }>)
    ).map(([provider, data]) => ({
      provider,
      success: data.success,
      failed: data.failed,
    }))
    : [];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Métricas de AI Providers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          Métricas de AI Providers
        </CardTitle>
        <CardDescription>
          Monitoramento de uso dos provedores de IA para análise de listas de materiais
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm">Total de Chamadas</span>
            </div>
            <p className="mt-2 text-2xl font-bold">{summary?.totalCalls || 0}</p>
          </div>

          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <span className="text-sm">Taxa de Sucesso</span>
            </div>
            <p className="mt-2 text-2xl font-bold text-success">{summary?.successRate || 0}%</p>
          </div>

          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span className="text-sm">Tempo Médio</span>
            </div>
            <p className="mt-2 text-2xl font-bold">{summary?.avgResponseTime || 0}ms</p>
          </div>

          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <RefreshCcw className="h-4 w-4 text-warning" />
              <span className="text-sm">Taxa de Fallback</span>
            </div>
            <p className="mt-2 text-2xl font-bold">{summary?.fallbackRate || 0}%</p>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Provider Distribution Pie */}
          <div className="rounded-lg border p-4">
            <h3 className="mb-4 font-medium">Distribuição por Provider</h3>
            {providerDistribution.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-[200px]">
                <PieChart>
                  <Pie
                    data={providerDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {providerDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ChartContainer>
            ) : (
              <div className="flex h-[200px] items-center justify-center text-muted-foreground">
                <p>Nenhum dado disponível</p>
              </div>
            )}
          </div>

          {/* Success/Failed Bar Chart */}
          <div className="rounded-lg border p-4">
            <h3 className="mb-4 font-medium">Sucesso vs Falha por Provider</h3>
            {successFailData.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-[200px]">
                <BarChart data={successFailData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="provider" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="success" fill="hsl(142.1 76.2% 36.3%)" name="Sucesso" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="failed" fill="hsl(var(--destructive))" name="Falha" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            ) : (
              <div className="flex h-[200px] items-center justify-center text-muted-foreground">
                <p>Nenhum dado disponível</p>
              </div>
            )}
          </div>
        </div>

        {/* Daily Trend Chart */}
        <div className="rounded-lg border p-4">
          <h3 className="mb-4 font-medium">Tendência de Uso (Últimos 7 dias)</h3>
          {dailyTrend.length > 0 ? (
            <ChartContainer config={chartConfig} className="h-[250px]">
              <LineChart data={dailyTrend}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => {
                    try {
                      return format(new Date(value), "dd/MM", { locale: ptBR });
                    } catch {
                      return value;
                    }
                  }}
                />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="openrouter" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  name="OpenRouter"
                  dot={{ r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="lovable" 
                  stroke="hsl(var(--secondary))" 
                  strokeWidth={2}
                  name="Lovable AI"
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ChartContainer>
          ) : (
            <div className="flex h-[250px] items-center justify-center text-muted-foreground">
              <p>Nenhum dado disponível</p>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="rounded-lg border p-4">
          <h3 className="mb-4 font-medium">Atividade Recente</h3>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {rawMetrics && rawMetrics.length > 0 ? (
              rawMetrics.slice(0, 10).map((metric) => (
                <div 
                  key={metric.id}
                  className="flex items-center justify-between rounded-lg border bg-card p-3"
                >
                  <div className="flex items-center gap-3">
                    {metric.success ? (
                      <CheckCircle2 className="h-5 w-5 text-success" />
                    ) : (
                      <XCircle className="h-5 w-5 text-destructive" />
                    )}
                    <div>
                      <p className="text-sm font-medium">{metric.function_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(metric.created_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={metric.provider === "openrouter" ? "default" : "secondary"}>
                      {metric.provider === "openrouter" ? "OpenRouter" : "Lovable AI"}
                    </Badge>
                    {metric.fallback_used && (
                      <Badge variant="outline" className="text-warning border-warning">
                        Fallback
                      </Badge>
                    )}
                    {metric.response_time_ms && (
                      <span className="text-xs text-muted-foreground">
                        {metric.response_time_ms}ms
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-4">
                Nenhuma atividade registrada ainda
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
