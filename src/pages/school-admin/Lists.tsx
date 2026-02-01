import { useState } from "react";
import { Plus, Edit, Trash2 } from "lucide-react";
import { SchoolAdminLayout } from "@/components/school-admin/SchoolAdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { SchoolAdminListDialog } from "@/components/school-admin/SchoolAdminListDialog";
import { OfficialListCard } from "@/components/school-admin/OfficialListCard";
import { ListStatusBadge } from "@/components/lists/ListStatusBadge";

type ListStatus = "draft" | "published" | "flagged" | "official";

interface ListWithGrade {
  id: string;
  year: number;
  is_active: boolean;
  status: ListStatus;
  grade_id: string;
  grades: {
    id: string;
    name: string;
  } | null;
  material_items: { id: string }[];
}

export default function SchoolAdminLists() {
  const { schoolId } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingList, setEditingList] = useState<ListWithGrade | null>(null);
  const [deletingList, setDeletingList] = useState<ListWithGrade | null>(null);

  // Fetch school info for slug
  const { data: school } = useQuery({
    queryKey: ["school-admin-school", schoolId],
    queryFn: async () => {
      if (!schoolId) return null;
      const { data, error } = await supabase
        .from("schools")
        .select("slug, name")
        .eq("id", schoolId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!schoolId,
  });

  const { data: lists, isLoading } = useQuery({
    queryKey: ["school-admin-lists", schoolId],
    queryFn: async () => {
      if (!schoolId) return [];
      const { data, error } = await supabase
        .from("material_lists")
        .select(`
          *,
          grades (*),
          material_items (id)
        `)
        .eq("school_id", schoolId)
        .order("year", { ascending: false });
      
      if (error) throw error;
      return data as unknown as ListWithGrade[];
    },
    enabled: !!schoolId,
  });

  const { data: grades } = useQuery({
    queryKey: ["grades"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("grades")
        .select("*")
        .order("order_index");
      if (error) throw error;
      return data;
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ listId, isActive }: { listId: string; isActive: boolean }) => {
      const { error } = await supabase
        .from("material_lists")
        .update({ is_active: isActive })
        .eq("id", listId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["school-admin-lists"] });
      toast({ title: "Lista atualizada!" });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Erro ao atualizar lista" });
    },
  });

  const promoteToOfficialMutation = useMutation({
    mutationFn: async ({ listId }: { listId: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");
      
      // Use the database function to handle the promotion
      const { error } = await supabase.rpc("promote_list_to_official", {
        _list_id: listId,
        _user_id: user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["school-admin-lists"] });
      toast({ title: "Lista promovida para oficial!" });
    },
    onError: (error: any) => {
      toast({ 
        variant: "destructive", 
        title: "Erro ao promover lista",
        description: error?.message || "Tente novamente."
      });
    },
  });

  const demoteFromOfficialMutation = useMutation({
    mutationFn: async ({ listId }: { listId: string }) => {
      const { error } = await supabase
        .from("material_lists")
        .update({ status: "published", promoted_by: null, promoted_at: null } as any)
        .eq("id", listId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["school-admin-lists"] });
      toast({ title: "Lista não é mais oficial." });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Erro ao atualizar lista" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (listId: string) => {
      const { error } = await supabase
        .from("material_lists")
        .delete()
        .eq("id", listId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["school-admin-lists"] });
      toast({ title: "Lista excluída!" });
      setDeletingList(null);
    },
    onError: () => {
      toast({ variant: "destructive", title: "Erro ao excluir lista" });
    },
  });

  const handleEdit = (list: ListWithGrade) => {
    setEditingList(list);
    setDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingList(null);
    setDialogOpen(true);
  };

  // Filter official lists for the cards
  // Filter official lists for the cards
  const officialLists = lists?.filter((l) => l.status === "official" && l.is_active) || [];

  return (
    <SchoolAdminLayout title="Listas de Materiais" description="Gerencie as listas da sua escola">
      {/* Official Lists Cards */}
      {officialLists.length > 0 && school?.slug && (
        <div className="mb-6 space-y-4">
          <h2 className="font-display text-lg font-semibold flex items-center gap-2">
            📢 Comunicação com os Pais
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {officialLists.map((list) => (
              <OfficialListCard
                key={list.id}
                listId={list.id}
                gradeName={list.grades?.name || ""}
                year={list.year}
                schoolSlug={school.slug}
                gradeId={list.grade_id}
              />
            ))}
          </div>
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="font-display">Suas Listas</CardTitle>
          <Button onClick={handleCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            Nova Lista
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : lists && lists.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Série</TableHead>
                  <TableHead>Ano</TableHead>
                  <TableHead>Itens</TableHead>
                  <TableHead>Oficial</TableHead>
                  <TableHead>Ativa</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lists.map((list) => (
                  <TableRow key={list.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {list.grades?.name}
                        <ListStatusBadge status={list.status} size="sm" />
                      </div>
                    </TableCell>
                    <TableCell>{list.year}</TableCell>
                    <TableCell>{list.material_items?.length || 0}</TableCell>
                    <TableCell>
                      <Switch
                        checked={list.status === "official"}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            promoteToOfficialMutation.mutate({ listId: list.id });
                          } else {
                            demoteFromOfficialMutation.mutate({ listId: list.id });
                          }
                        }}
                        disabled={promoteToOfficialMutation.isPending || demoteFromOfficialMutation.isPending}
                      />
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={list.is_active}
                        onCheckedChange={(checked) =>
                          toggleActiveMutation.mutate({ listId: list.id, isActive: checked })
                        }
                        disabled={toggleActiveMutation.isPending}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(list)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeletingList(list)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="py-12 text-center">
              <p className="mb-4 text-muted-foreground">
                Você ainda não tem listas de materiais.
              </p>
              <Button onClick={handleCreate} className="gap-2">
                <Plus className="h-4 w-4" />
                Criar primeira lista
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <SchoolAdminListDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        list={editingList}
        grades={grades || []}
      />

      <AlertDialog open={!!deletingList} onOpenChange={() => setDeletingList(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir lista?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A lista "{deletingList?.grades?.name}" 
              e todos os seus itens serão excluídos permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingList && deleteMutation.mutate(deletingList.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SchoolAdminLayout>
  );
}
