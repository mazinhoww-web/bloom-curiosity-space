import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Building2, 
  Clock, 
  Check, 
  X, 
  Mail, 
  Phone, 
  User,
  Briefcase,
  Calendar,
  ExternalLink,
  AlertTriangle,
  Loader2
} from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  usePendingClaimRequests, 
  useApproveClaimRequest, 
  useRejectClaimRequest,
  isGenericEmail 
} from "@/hooks/use-school-claim";
import { Link } from "react-router-dom";

interface ClaimRequestWithSchool {
  id: string;
  user_id: string;
  school_id: string;
  full_name: string;
  email: string;
  position: string;
  phone: string | null;
  notes: string | null;
  status: string;
  requested_role: string;
  created_at: string;
  schools: {
    id: string;
    name: string;
    slug: string;
    city: string | null;
    state: string | null;
  } | null;
}

export default function ClaimRequests() {
  const { data: requests, isLoading } = usePendingClaimRequests();
  const approveMutation = useApproveClaimRequest();
  const rejectMutation = useRejectClaimRequest();
  
  const [selectedRequest, setSelectedRequest] = useState<ClaimRequestWithSchool | null>(null);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>("school_admin");
  const [rejectReason, setRejectReason] = useState("");

  const handleApprove = async () => {
    if (!selectedRequest) return;
    
    await approveMutation.mutateAsync({
      requestId: selectedRequest.id,
      role: selectedRole,
    });
    
    setApproveDialogOpen(false);
    setSelectedRequest(null);
    setSelectedRole("school_admin");
  };

  const handleReject = async () => {
    if (!selectedRequest) return;
    
    await rejectMutation.mutateAsync({
      requestId: selectedRequest.id,
      reason: rejectReason || undefined,
    });
    
    setRejectDialogOpen(false);
    setSelectedRequest(null);
    setRejectReason("");
  };

  const openApproveDialog = (request: ClaimRequestWithSchool) => {
    setSelectedRequest(request);
    setApproveDialogOpen(true);
  };

  const openRejectDialog = (request: ClaimRequestWithSchool) => {
    setSelectedRequest(request);
    setRejectDialogOpen(true);
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-64 w-full" />
        </div>
      </AdminLayout>
    );
  }

  const pendingRequests = (requests || []) as ClaimRequestWithSchool[];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="font-display text-2xl font-bold">Requisições de Acesso</h1>
          <p className="text-muted-foreground">
            Gerencie as solicitações de administração de escolas
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100">
                  <Clock className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{pendingRequests.length}</p>
                  <p className="text-sm text-muted-foreground">Pendentes</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Empty state */}
        {pendingRequests.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <Check className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="mb-2 font-display text-lg font-semibold">
                Nenhuma requisição pendente
              </h3>
              <p className="text-sm text-muted-foreground">
                Todas as solicitações foram processadas.
              </p>
            </CardContent>
          </Card>
        ) : (
          /* Requests table */
          <Card>
            <CardHeader>
              <CardTitle>Requisições Pendentes</CardTitle>
              <CardDescription>
                Clique em uma requisição para ver detalhes e aprovar/rejeitar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Escola</TableHead>
                    <TableHead>Solicitante</TableHead>
                    <TableHead>Cargo</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{request.schools?.name || "—"}</p>
                            <p className="text-xs text-muted-foreground">
                              {request.schools?.city}, {request.schools?.state}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          {request.full_name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{request.position}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {isGenericEmail(request.email) && (
                            <span title="Email genérico">
                              <AlertTriangle className="h-4 w-4 text-amber-500" />
                            </span>
                          )}
                          <span className="text-sm">{request.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(request.created_at), "dd/MM/yyyy", { locale: ptBR })}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-green-600 hover:bg-green-50 hover:text-green-700"
                            onClick={() => openApproveDialog(request)}
                          >
                            <Check className="mr-1 h-4 w-4" />
                            Aprovar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:bg-red-50 hover:text-red-700"
                            onClick={() => openRejectDialog(request)}
                          >
                            <X className="mr-1 h-4 w-4" />
                            Rejeitar
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Approve Dialog */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aprovar Solicitação</DialogTitle>
            <DialogDescription>
              Confirme a aprovação do acesso para {selectedRequest?.full_name}
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4">
              {/* Request details */}
              <div className="rounded-lg bg-muted/50 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{selectedRequest.schools?.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{selectedRequest.email}</span>
                  {isGenericEmail(selectedRequest.email) && (
                    <Badge variant="outline" className="text-amber-600 border-amber-300">
                      Email genérico
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  <span>{selectedRequest.position}</span>
                </div>
                {selectedRequest.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedRequest.phone}</span>
                  </div>
                )}
                {selectedRequest.notes && (
                  <div className="pt-2 border-t">
                    <p className="text-sm text-muted-foreground">{selectedRequest.notes}</p>
                  </div>
                )}
              </div>

              {/* Role selection */}
              <div className="space-y-2">
                <Label>Nível de acesso</Label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="school_admin">
                      <div className="flex flex-col items-start">
                        <span className="font-medium">Administrador</span>
                        <span className="text-xs text-muted-foreground">
                          Acesso completo: listas, usuários, configurações
                        </span>
                      </div>
                    </SelectItem>
                    <SelectItem value="school_editor">
                      <div className="flex flex-col items-start">
                        <span className="font-medium">Editor</span>
                        <span className="text-xs text-muted-foreground">
                          Apenas editar listas de materiais
                        </span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleApprove}
              disabled={approveMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {approveMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Aprovar acesso
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar Solicitação</DialogTitle>
            <DialogDescription>
              Informe o motivo da rejeição (opcional)
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted/50 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{selectedRequest.full_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span>{selectedRequest.schools?.name}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reject-reason">Motivo da rejeição</Label>
                <Textarea
                  id="reject-reason"
                  placeholder="Ex: Não foi possível verificar o vínculo com a escola..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleReject}
              disabled={rejectMutation.isPending}
              variant="destructive"
            >
              {rejectMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Rejeitar solicitação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
