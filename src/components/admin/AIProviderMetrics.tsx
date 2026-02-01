/**
 * AI Provider Metrics Component
 * Exibe métricas de uso dos AI providers com gráficos
 */

import { useQuery } from "@tanstack/react-query";
import { 
  Brain, 
  TrendingUp, 
  Clock, 
  CheckCircle2,
  XCircle,
  RefreshCcw,
  Activity
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
import { format } from "date-fns";
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
  "Lovable AI": "hsl(var(--chart-2))",
  "cron": "hsl(var(--muted-foreground))",
};

const chartConfig: ChartConfig = {
  openrouter: {
    label: "OpenRouter",
    color: "hsl(var(--primary))",
  },
  lovable: {
    label: "Lovable AI",
    color: "hsl(var(--chart-2))",
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

  // Filter out cron entries for AI-specific metrics
  const aiMetrics = rawMetrics?.filter(m => m.provider !== "cron") || [];

  // Calculate summary metrics
  const summary = aiMetrics.length > 0 ? {
    totalCalls: aiMetrics.length,
    successRate: Math.round((aiMetrics.filter(m => m.success).length / aiMetrics.length) * 100),
    avgResponseTime: Math.round(
      aiMetrics.filter(m => m.response_time_ms).reduce((acc, m) => acc + (m.response_time_ms || 0), 0) / 
      aiMetrics.filter(m => m.response_time_ms).length || 1
    ),
    fallbackRate: Math.round((aiMetrics.filter(m => m.fallback_used).length / aiMetrics.length) * 100),
  } : { totalCalls: 0, successRate: 0, avgResponseTime: 0, fallbackRate: 0 };

  // Provider distribution for pie chart
  const providerDistribution = aiMetrics.length > 0 ? 
    Object.entries(
      aiMetrics.reduce((acc, m) => {
        const provider = m.provider === "OpenRouter" ? "OpenRouter" : m.provider === "Lovable AI" ? "Lovable AI" : m.provider;
        acc[provider] = (acc[provider] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    ).map(([name, value]) => ({ 
      name, 
      value, 
      fill: PROVIDER_COLORS[name] || "hsl(var(--muted))" 
    }))
    : [];

  // Daily calls trend
  const dailyTrend = stats ? 
    stats
      .filter(s => s.provider !== "cron")
      .reduce((acc, s) => {
        const existing = acc.find(a => a.date === s.date);
        const isOpenRouter = s.provider === "OpenRouter";
        if (existing) {
          if (isOpenRouter) {
            existing.openrouter = (existing.openrouter || 0) + Number(s.total_calls);
          } else {
            existing.lovable = (existing.lovable || 0) + Number(s.total_calls);
          }
        } else {
          acc.push({
            date: s.date || "",
            openrouter: isOpenRouter ? Number(s.total_calls) : 0,
            lovable: !isOpenRouter ? Number(s.total_calls) : 0,
          });
        }
        return acc;
      }, [] as { date: string; openrouter: number; lovable: number }[])
      .slice(0, 7)
      .reverse()
    : [];

  // Success vs Failed for bar chart
  const successFailData = aiMetrics.length > 0 ?
    Object.entries(
      aiMetrics.reduce((acc, m) => {
        const provider = m.provider;
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
        <CardContent className="space-y-6">
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Brain className="h-5 w-5 text-primary" />
          Métricas de AI Providers
        </CardTitle>
        <CardDescription className="text-sm">
          Monitoramento de uso dos provedores de IA para análise de listas
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Cards */}
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs font-medium">Total de Chamadas</span>
            </div>
            <p className="text-2xl font-bold">{summary.totalCalls}</p>
          </div>

          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-xs font-medium">Taxa de Sucesso</span>
            </div>
            <p className="text-2xl font-bold text-green-600">{summary.successRate}%</p>
          </div>

          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Clock className="h-4 w-4" />
              <span className="text-xs font-medium">Tempo Médio</span>
            </div>
            <p className="text-2xl font-bold">{summary.avgResponseTime}ms</p>
          </div>

          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <RefreshCcw className="h-4 w-4 text-amber-500" />
              <span className="text-xs font-medium">Taxa de Fallback</span>
            </div>
            <p className="text-2xl font-bold text-amber-600">{summary.fallbackRate}%</p>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Provider Distribution Pie */}
          <div className="rounded-lg border p-4">
            <h3 className="mb-4 text-sm font-medium">Distribuição por Provider</h3>
            {providerDistribution.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-[200px] w-full">
                <PieChart>
                  <Pie
                    data={providerDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
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
                <div className="text-center">
                  <Activity className="mx-auto h-8 w-8 mb-2 opacity-50" />
                  <p className="text-sm">Nenhum dado disponível</p>
                </div>
              </div>
            )}
          </div>

          {/* Success/Failed Bar Chart */}
          <div className="rounded-lg border p-4">
            <h3 className="mb-4 text-sm font-medium">Sucesso vs Falha por Provider</h3>
            {successFailData.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-[200px] w-full">
                <BarChart data={successFailData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
                  <XAxis type="number" />
                  <YAxis dataKey="provider" type="category" width={80} tick={{ fontSize: 12 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="success" fill="hsl(142.1 76.2% 36.3%)" name="Sucesso" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="failed" fill="hsl(var(--destructive))" name="Falha" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ChartContainer>
            ) : (
              <div className="flex h-[200px] items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Activity className="mx-auto h-8 w-8 mb-2 opacity-50" />
                  <p className="text-sm">Nenhum dado disponível</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Daily Trend Chart */}
        <div className="rounded-lg border p-4">
          <h3 className="mb-4 text-sm font-medium">Tendência de Uso (Últimos 7 dias)</h3>
          {dailyTrend.length > 0 ? (
            <ChartContainer config={chartConfig} className="h-[220px] w-full">
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
                  tick={{ fontSize: 12 }}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line 
                  type="monotone" 
                  dataKey="openrouter" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  name="OpenRouter"
                  dot={{ r: 3 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="lovable" 
                  stroke="hsl(var(--chart-2))" 
                  strokeWidth={2}
                  name="Lovable AI"
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ChartContainer>
          ) : (
            <div className="flex h-[220px] items-center justify-center text-muted-foreground">
              <div className="text-center">
                <Activity className="mx-auto h-8 w-8 mb-2 opacity-50" />
                <p className="text-sm">Nenhum dado disponível</p>
              </div>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="rounded-lg border p-4">
          <h3 className="mb-4 text-sm font-medium">Atividade Recente</h3>
          <div className="space-y-2 max-h-[280px] overflow-y-auto">
            {aiMetrics && aiMetrics.length > 0 ? (
              aiMetrics.slice(0, 10).map((metric) => (
                <div 
                  key={metric.id}
                  className="flex items-center justify-between rounded-lg border bg-card p-3 gap-2"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {metric.success ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                    ) : (
                      <XCircle className="h-4 w-4 text-destructive shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{metric.function_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(metric.created_at), "dd/MM HH:mm:ss", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                    <Badge 
                      variant={metric.provider === "OpenRouter" ? "default" : "secondary"}
                      className="text-xs px-1.5 py-0.5"
                    >
                      {metric.provider}
                    </Badge>
                    {metric.fallback_used && (
                      <Badge variant="outline" className="text-xs px-1.5 py-0.5 text-amber-600 border-amber-300">
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
              <div className="py-8 text-center text-muted-foreground">
                <Activity className="mx-auto h-8 w-8 mb-2 opacity-50" />
                <p className="text-sm">Nenhuma atividade registrada ainda</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}