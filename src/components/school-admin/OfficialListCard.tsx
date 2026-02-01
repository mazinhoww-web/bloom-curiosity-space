import { useState } from "react";
import { Copy, Check, Eye, ShoppingCart, Link2, ExternalLink, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

interface OfficialListCardProps {
  listId: string;
  gradeName: string;
  year: number;
  schoolSlug: string;
  gradeId: string;
}

export function OfficialListCard({
  listId,
  gradeName,
  year,
  schoolSlug,
  gradeId,
}: OfficialListCardProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  // Generate the public URL
  const publicUrl = `${window.location.origin}/escola/${schoolSlug}?grade=${gradeId}`;

  // Fetch view and click stats
  const { data: stats, isLoading } = useQuery({
    queryKey: ["list-stats", listId],
    queryFn: async () => {
      // Get list views
      const { count: views } = await supabase
        .from("list_view_events")
        .select("id", { count: "exact", head: true })
        .eq("list_id", listId);

      // Get purchase clicks for items in this list
      const { count: clicks } = await supabase
        .from("purchase_events")
        .select("id", { count: "exact", head: true })
        .eq("list_id", listId);

      return {
        views: views || 0,
        clicks: clicks || 0,
      };
    },
  });

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      toast({
        title: "Link copiado!",
        description: "Envie para os pais via WhatsApp ou e-mail.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        variant: "destructive",
        title: "Erro ao copiar",
        description: "Tente novamente.",
      });
    }
  };

  return (
    <Card className="border-2 border-success/30 bg-gradient-to-br from-success/5 via-transparent to-primary/5">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-success/10">
            <Shield className="h-4 w-4 text-success" />
          </div>
          <div className="flex-1">
            <CardTitle className="font-display text-base">
              Lista Oficial: {gradeName}
            </CardTitle>
            <p className="text-xs text-muted-foreground">Ano letivo {year}</p>
          </div>
          <Badge className="bg-success text-success-foreground">Oficial</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 rounded-lg border bg-background p-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary/10">
              <Eye className="h-4 w-4 text-secondary" />
            </div>
            <div>
              {isLoading ? (
                <Skeleton className="h-6 w-12" />
              ) : (
                <p className="text-xl font-bold">{stats?.views || 0}</p>
              )}
              <p className="text-xs text-muted-foreground">Visualizações</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-lg border bg-background p-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
              <ShoppingCart className="h-4 w-4 text-primary" />
            </div>
            <div>
              {isLoading ? (
                <Skeleton className="h-6 w-12" />
              ) : (
                <p className="text-xl font-bold">{stats?.clicks || 0}</p>
              )}
              <p className="text-xs text-muted-foreground">Cliques comprar</p>
            </div>
          </div>
        </div>

        {/* Link section */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
            <Link2 className="h-3 w-3" />
            Link para os pais:
          </p>
          <div className="flex items-center gap-2 rounded-lg border bg-muted/50 p-2">
            <code className="flex-1 truncate text-xs text-muted-foreground">
              {publicUrl}
            </code>
            <Button
              size="sm"
              variant="outline"
              className="flex-shrink-0 gap-1"
              onClick={handleCopyLink}
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3" />
                  Copiado
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" />
                  Copiar
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          <Button 
            onClick={handleCopyLink} 
            className="flex-1 gap-2"
          >
            <Copy className="h-4 w-4" />
            Copiar link para enviar aos pais
          </Button>
          <Button
            variant="outline"
            size="icon"
            asChild
          >
            <a href={publicUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        </div>

        {/* Helper text */}
        <p className="text-xs text-center text-muted-foreground">
          Compartilhe este link com os pais por WhatsApp, e-mail ou no site da escola.
        </p>
      </CardContent>
    </Card>
  );
}
