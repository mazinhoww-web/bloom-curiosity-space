import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Building2, Clock, CheckCircle, Shield, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useSchoolClaimStatus, useSchoolHasAdmin } from "@/hooks/use-school-claim";
import { ClaimSchoolDialog } from "./ClaimSchoolDialog";

interface ClaimSchoolCTAProps {
  schoolId: string;
  schoolName: string;
  schoolSlug: string;
}

export function ClaimSchoolCTA({ schoolId, schoolName, schoolSlug }: ClaimSchoolCTAProps) {
  const { user, isSchoolAdmin, schoolId: userSchoolId } = useAuth();
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const { data: claimStatus, isLoading: isLoadingStatus } = useSchoolClaimStatus(schoolId);
  const { data: hasAdmin } = useSchoolHasAdmin(schoolId);

  // Se o usuário atual já é admin desta escola, não mostrar CTA
  if (isSchoolAdmin && userSchoolId === schoolId) {
    return null;
  }

  // Se ainda está carregando, não mostrar nada
  if (isLoadingStatus) {
    return null;
  }

  // Se o usuário já tem acesso a esta escola
  if (claimStatus?.has_access) {
    return (
      <Card className="border-green-200 bg-green-50/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-green-900">
                Você administra esta escola
              </p>
              <p className="text-sm text-green-700">
                Acesse o painel para gerenciar listas e configurações
              </p>
            </div>
            <Link to="/escola-admin">
              <Button variant="outline" size="sm" className="border-green-300 hover:bg-green-100">
                Ir para o painel
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Se o usuário tem uma requisição pendente
  if (claimStatus?.pending_request_id) {
    const pendingDate = claimStatus.pending_since 
      ? new Date(claimStatus.pending_since).toLocaleDateString("pt-BR")
      : null;

    return (
      <Card className="border-amber-200 bg-amber-50/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-medium text-amber-900">
                  Solicitação em análise
                </p>
                <Badge variant="outline" className="border-amber-300 bg-amber-100 text-amber-700">
                  Pendente
                </Badge>
              </div>
              <p className="text-sm text-amber-700">
                {pendingDate 
                  ? `Enviada em ${pendingDate}. Retornaremos em até 48 horas úteis.`
                  : "Estamos analisando sua solicitação. Retornaremos em breve."
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // CTA para reivindicar escola
  const handleClaimClick = () => {
    if (!user) {
      // Redirecionar para login com retorno
      navigate(`/auth?redirect=${encodeURIComponent(`/escola/${schoolSlug}`)}`);
      return;
    }
    setDialogOpen(true);
  };

  return (
    <>
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3 flex-1">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground">
                  Esta é sua escola?
                </p>
                <p className="text-sm text-muted-foreground">
                  Solicite acesso para gerenciar listas oficiais e informações
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {!hasAdmin && (
                <Badge variant="outline" className="border-green-300 bg-green-50 text-green-700">
                  <Shield className="mr-1 h-3 w-3" />
                  Primeiro admin
                </Badge>
              )}
              <Button onClick={handleClaimClick} className="gap-2">
                <Building2 className="h-4 w-4" />
                Solicitar administração
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <ClaimSchoolDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        schoolId={schoolId}
        schoolName={schoolName}
      />
    </>
  );
}
