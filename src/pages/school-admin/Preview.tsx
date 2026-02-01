import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SchoolAdminLayout } from "@/components/school-admin/SchoolAdminLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SchoolAdminPreview() {
  const { schoolId } = useAuth();
  const navigate = useNavigate();

  const { data: school, isLoading } = useQuery({
    queryKey: ["school-admin-preview", schoolId],
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

  if (isLoading) {
    return (
      <SchoolAdminLayout title="Preview" description="Visualize como os pais veem sua escola">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </SchoolAdminLayout>
    );
  }

  return (
    <SchoolAdminLayout title="Preview Público" description="Visualize como os pais veem sua escola">
      <Card>
        <CardHeader>
          <CardTitle className="font-display">Página Pública</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-muted-foreground">
            Clique no botão abaixo para ver sua página pública como ela aparece para os pais.
          </p>
          {school?.slug ? (
            <a href={`/escola/${school.slug}`} target="_blank" rel="noopener noreferrer">
              <Button className="gap-2">
                <ExternalLink className="h-4 w-4" />
                Abrir Página Pública
              </Button>
            </a>
          ) : (
            <p className="text-destructive">Escola não configurada corretamente.</p>
          )}
        </CardContent>
      </Card>

      {school?.slug && (
        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-display">Prévia</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <iframe
                src={`/escola/${school.slug}`}
                className="h-[600px] w-full rounded-b-lg border-t"
                title="Preview da página pública"
              />
            </CardContent>
          </Card>
        </div>
      )}
    </SchoolAdminLayout>
  );
}
