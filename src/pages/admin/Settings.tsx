/**
 * Admin Settings Page - Configurações do sistema
 * Inclui configuração do cron job de cache refresh
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Settings, 
  RefreshCcw, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Play,
  Calendar,
  Database
} from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CacheRefreshSettings {
  enabled: boolean;
  interval_hours: number;
  last_run: string | null;
  next_run: string | null;
}

interface CacheRefreshLog {
  id: string;
  executed_at: string;
  duration_ms: number | null;
  success: boolean;
  schools_result: string | null;
  lists_result: string | null;
  triggered_by: string;
  error_message: string | null;
}

const INTERVAL_OPTIONS = [
  { value: "1", label: "A cada hora" },
  { value: "6", label: "A cada 6 horas" },
  { value: "12", label: "A cada 12 horas" },
  { value: "24", label: "Diariamente" },
  { value: "168", label: "Semanalmente" },
];

export default function AdminSettings() {
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch cache settings
  const { data: settings, isLoading: loadingSettings } = useQuery({
    queryKey: ["admin-cache-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("system_settings")
        .select("*")
        .eq("id", "cache_refresh_schedule")
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          // No settings found, return defaults
          return {
            id: "cache_refresh_schedule",
            value: {
              enabled: true,
              interval_hours: 24,
              last_run: null,
              next_run: null,
            },
          };
        }
        throw error;
      }
      return data;
    },
  });

  // Fetch recent logs
  const { data: logs, isLoading: loadingLogs } = useQuery({
    queryKey: ["admin-cache-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cache_refresh_logs")
        .select("*")
        .order("executed_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      return data as CacheRefreshLog[];
    },
  });

  // Update settings mutation
  const updateSettings = useMutation({
    mutationFn: async (newSettings: Partial<CacheRefreshSettings>) => {
      const currentValue = (settings?.value as CacheRefreshSettings) || {
        enabled: true,
        interval_hours: 24,
        last_run: null,
        next_run: null,
      };
      const updatedValue = { ...currentValue, ...newSettings };

      const { error } = await supabase
        .from("system_settings")
        .upsert({
          id: "cache_refresh_schedule",
          value: updatedValue,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
      return updatedValue;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-cache-settings"] });
      toast.success("Configurações salvas com sucesso!");
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error("Error updating settings:", message);
      toast.error("Erro ao salvar configurações");
    },
  });

  // Manual refresh mutation
  const triggerRefresh = async () => {
    setIsRefreshing(true);
    try {
      const { data, error } = await supabase.functions.invoke("refresh-popular-cache", {
        body: { schools: true, lists: true },
      });

      if (error) throw error;

      // Log the manual execution
      await supabase.from("cache_refresh_logs").insert({
        duration_ms: data.duration_ms,
        success: data.success,
        schools_result: data.results?.schools,
        lists_result: data.results?.lists,
        triggered_by: "manual",
      });

      toast.success(`Cache atualizado em ${data.duration_ms}ms`);
      queryClient.invalidateQueries({ queryKey: ["admin-cache-logs"] });

      // Update last_run in settings
      updateSettings.mutate({ last_run: new Date().toISOString() });
    } catch (error) {
      console.error("Error refreshing cache:", error);
      toast.error("Erro ao atualizar cache");
    } finally {
      setIsRefreshing(false);
    }
  };

  const currentSettings = settings?.value as CacheRefreshSettings | undefined;

  return (
    <AdminLayout 
      title="Configurações" 
      description="Configurações do sistema e automações"
    >
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Cache Refresh Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              Cache de Escolas Populares
            </CardTitle>
            <CardDescription>
              Configure a frequência de atualização do cache de escolas e listas populares exibidas na home.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {loadingSettings ? (
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <>
                {/* Enable/Disable */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="cache-enabled">Atualização automática</Label>
                    <p className="text-sm text-muted-foreground">
                      Ativa o job de atualização do cache
                    </p>
                  </div>
                  <Switch
                    id="cache-enabled"
                    checked={currentSettings?.enabled ?? true}
                    onCheckedChange={(enabled) => updateSettings.mutate({ enabled })}
                    disabled={updateSettings.isPending}
                  />
                </div>

                {/* Interval */}
                <div className="space-y-2">
                  <Label>Frequência de atualização</Label>
                  <Select
                    value={String(currentSettings?.interval_hours ?? 24)}
                    onValueChange={(value) => updateSettings.mutate({ interval_hours: parseInt(value) })}
                    disabled={updateSettings.isPending || !currentSettings?.enabled}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {INTERVAL_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Last/Next run info */}
                <div className="rounded-lg bg-muted/50 p-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Última execução:</span>
                    <span className="font-medium">
                      {currentSettings?.last_run 
                        ? formatDistanceToNow(new Date(currentSettings.last_run), { addSuffix: true, locale: ptBR })
                        : "Nunca executado"
                      }
                    </span>
                  </div>
                </div>

                {/* Manual trigger */}
                <Button 
                  onClick={triggerRefresh}
                  disabled={isRefreshing}
                  className="w-full gap-2"
                >
                  {isRefreshing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Atualizando...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4" />
                      Executar agora
                    </>
                  )}
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Execution Logs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-secondary" />
              Histórico de Execuções
            </CardTitle>
            <CardDescription>
              Últimas 10 execuções do job de atualização de cache
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingLogs ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : logs && logs.length > 0 ? (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {logs.map((log) => (
                  <div 
                    key={log.id} 
                    className="flex items-center justify-between rounded-lg border bg-card p-3"
                  >
                    <div className="flex items-center gap-3">
                      {log.success ? (
                        <CheckCircle2 className="h-5 w-5 text-success" />
                      ) : (
                        <XCircle className="h-5 w-5 text-destructive" />
                      )}
                      <div>
                        <p className="text-sm font-medium">
                          {format(new Date(log.executed_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {log.triggered_by === "manual" ? "Manual" : "Automático"}
                          {log.duration_ms && ` • ${log.duration_ms}ms`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {log.schools_result === "Success" && (
                        <Badge variant="secondary" className="text-xs">Escolas ✓</Badge>
                      )}
                      {log.lists_result === "Success" && (
                        <Badge variant="secondary" className="text-xs">Listas ✓</Badge>
                      )}
                      {log.error_message && (
                        <Badge variant="destructive" className="text-xs">Erro</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <Clock className="mx-auto mb-2 h-8 w-8 opacity-50" />
                <p>Nenhuma execução registrada</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Cron Setup Instructions */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-accent-foreground" />
            Configuração do Cron Job
          </CardTitle>
          <CardDescription>
            O job automático precisa ser configurado no banco de dados. Use o SQL abaixo no Cloud View.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg bg-muted p-4 font-mono text-sm overflow-x-auto">
            <pre className="whitespace-pre-wrap text-xs">
{`-- Execute no Cloud View > Run SQL para configurar o cron job diário
SELECT cron.schedule(
  'refresh-popular-cache-daily',
  '0 6 * * *', -- Executa às 6h todos os dias
  $$
  SELECT net.http_post(
    url := 'https://qhzncyuxyihybjsytfmc.supabase.co/functions/v1/refresh-popular-cache',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}"}'::jsonb,
    body := '{"schools": true, "lists": true}'::jsonb
  ) AS request_id;
  $$
);

-- Para remover o job:
-- SELECT cron.unschedule('refresh-popular-cache-daily');`}
            </pre>
          </div>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
