import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface ClaimRequest {
  id: string;
  user_id: string;
  school_id: string;
  full_name: string;
  email: string;
  position: string;
  phone: string | null;
  notes: string | null;
  status: "pending" | "approved" | "rejected";
  requested_role: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClaimStatus {
  has_access: boolean;
  user_role: string | null;
  pending_request_id: string | null;
  pending_since: string | null;
}

// Lista de domínios genéricos (validação client-side)
const GENERIC_DOMAINS = [
  'gmail.com', 'gmail.com.br', 'yahoo.com', 'yahoo.com.br',
  'hotmail.com', 'hotmail.com.br', 'outlook.com', 'outlook.com.br',
  'live.com', 'live.com.br', 'msn.com', 'icloud.com', 'aol.com',
  'protonmail.com', 'mail.com', 'zoho.com', 'yandex.com', 'gmx.com',
  'uol.com.br', 'bol.com.br', 'terra.com.br', 'ig.com.br', 'globo.com', 'r7.com'
];

export function isGenericEmail(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase();
  return GENERIC_DOMAINS.includes(domain);
}

export function useSchoolClaimStatus(schoolId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["school-claim-status", schoolId, user?.id],
    queryFn: async (): Promise<ClaimStatus> => {
      if (!user || !schoolId) {
        return {
          has_access: false,
          user_role: null,
          pending_request_id: null,
          pending_since: null,
        };
      }

      const { data, error } = await supabase
        .rpc("get_user_claim_status", {
          p_user_id: user.id,
          p_school_id: schoolId,
        });

      if (error) throw error;

      // RPC returns array, get first item
      const result = data?.[0] || {
        has_access: false,
        user_role: null,
        pending_request_id: null,
        pending_since: null,
      };

      return result;
    },
    enabled: !!user && !!schoolId,
  });
}

export function useSchoolHasAdmin(schoolId: string | undefined) {
  return useQuery({
    queryKey: ["school-has-admin", schoolId],
    queryFn: async () => {
      if (!schoolId) return false;

      const { data, error } = await supabase
        .rpc("school_has_admin", { p_school_id: schoolId });

      if (error) throw error;
      return data;
    },
    enabled: !!schoolId,
  });
}

export function useSubmitClaimRequest() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      school_id: string;
      full_name: string;
      email: string;
      position: string;
      phone?: string;
      notes?: string;
    }) => {
      if (!user) throw new Error("Você precisa estar logado");

      const { error } = await supabase
        .from("school_claim_requests")
        .insert({
          user_id: user.id,
          school_id: data.school_id,
          full_name: data.full_name,
          email: data.email,
          position: data.position,
          phone: data.phone || null,
          notes: data.notes || null,
        });

      if (error) {
        if (error.code === "23505") {
          throw new Error("Você já possui uma solicitação pendente para esta escola");
        }
        throw error;
      }
    },
    onSuccess: (_, variables) => {
      toast({
        title: "Solicitação enviada!",
        description: "Analisaremos sua solicitação em até 48 horas úteis.",
      });
      queryClient.invalidateQueries({ queryKey: ["school-claim-status", variables.school_id] });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Erro ao enviar solicitação",
        description: error.message,
      });
    },
  });
}

// Hook para admin: listar todas as requisições pendentes
export function usePendingClaimRequests() {
  const { isAdmin } = useAuth();

  return useQuery({
    queryKey: ["pending-claim-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("school_claim_requests")
        .select(`
          *,
          schools:school_id (id, name, slug, city, state)
        `)
        .eq("status", "pending")
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });
}

// Hook para admin: aprovar requisição
export function useApproveClaimRequest() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ requestId, role }: { requestId: string; role: string }) => {
      const { error } = await supabase
        .rpc("approve_claim_request", {
          p_request_id: requestId,
          p_role: role,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Solicitação aprovada!",
        description: "O usuário agora tem acesso à escola.",
      });
      queryClient.invalidateQueries({ queryKey: ["pending-claim-requests"] });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Erro ao aprovar",
        description: error.message,
      });
    },
  });
}

// Hook para admin: rejeitar requisição
export function useRejectClaimRequest() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ requestId, reason }: { requestId: string; reason?: string }) => {
      const { error } = await supabase
        .rpc("reject_claim_request", {
          p_request_id: requestId,
          p_reason: reason || null,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Solicitação rejeitada",
        description: "O usuário foi notificado.",
      });
      queryClient.invalidateQueries({ queryKey: ["pending-claim-requests"] });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Erro ao rejeitar",
        description: error.message,
      });
    },
  });
}

// Hook para usuário: listar suas escolas gerenciadas
export function useUserManagedSchools() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["user-managed-schools", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .rpc("get_user_managed_schools", { p_user_id: user.id });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });
}
