import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  MoreHorizontal,
  FileText,
  Loader2,
  School,
  Package,
} from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { MaterialList, Grade } from "@/types/database";
import { ListFormDialog } from "@/components/admin/ListFormDialog";
import { ListItemsDialog } from "@/components/admin/ListItemsDialog";

interface ListWithDetails extends MaterialList {
  schools: { id: string; name: string } | null;
  grades: Grade | null;
  material_items: { id: string }[];
}

export default function AdminLists() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isItemsOpen, setIsItemsOpen] = useState(false);
  const [selectedList, setSelectedList] = useState<ListWithDetails | null>(null);
  const [deleteList, setDeleteList] = useState<ListWithDetails | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: lists, isLoading } = useQuery({
    queryKey: ["admin-lists", searchQuery],
    queryFn: async () => {
      let query = supabase
        .from("material_lists")
        .select(`
          *,
          schools (id, name),
          grades (*),
          material_items (id)
        `)
        .order("year", { ascending: false });

      const { data, error } = await query;
      if (error) throw error;

      let filteredData = data as ListWithDetails[];
      if (searchQuery.trim()) {
        const search = searchQuery.toLowerCase();
        filteredData = filteredData.filter(
          (list) =>
            list.schools?.name?.toLowerCase().includes(search) ||
            list.grades?.name?.toLowerCase().includes(search)
        );
      }

      return filteredData;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      // First delete items
      await supabase.from("material_items").delete().eq("list_id", id);
      // Then delete list
      const { error } = await supabase.from("material_lists").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-lists"] });
      toast({
        title: "Lista excluída",
        description: "A lista foi removida com sucesso.",
      });
      setDeleteList(null);
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Erro ao excluir",
        description: "Não foi possível excluir a lista.",
      });
      console.error(error);
    },
  });

  const handleEdit = (list: ListWithDetails) => {
    setSelectedList(list);
    setIsFormOpen(true);
  };

  const handleManageItems = (list: ListWithDetails) => {
    setSelectedList(list);
    setIsItemsOpen(true);
  };

  const handleCreate = () => {
    setSelectedList(null);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setSelectedList(null);
  };

  const handleItemsClose = () => {
    setIsItemsOpen(false);
    setSelectedList(null);
  };

  return (
    <AdminLayout title="Listas de Materiais" description="Gerencie as listas por escola e série">
      <Card>
        <CardContent className="p-4">
          <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 sm:max-w-xs">
              <Input
                placeholder="Buscar por escola ou série..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </div>
            <Button onClick={handleCreate} className="gap-2">
              <Plus className="h-4 w-4" />
              Nova Lista
            </Button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : lists && lists.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Escola</TableHead>
                    <TableHead>Série</TableHead>
                    <TableHead>Ano</TableHead>
                    <TableHead>Itens</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[70px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lists.map((list) => (
                    <TableRow key={list.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <School className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {list.schools?.name || "Escola não encontrada"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{list.grades?.name || "-"}</Badge>
                      </TableCell>
                      <TableCell>{list.year}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-2"
                          onClick={() => handleManageItems(list)}
                        >
                          <Package className="h-4 w-4" />
                          {list.material_items?.length || 0} itens
                        </Button>
                      </TableCell>
                      <TableCell>
                        <Badge variant={list.is_active ? "default" : "secondary"}>
                          {list.is_active ? "Ativa" : "Inativa"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleManageItems(list)}>
                              <Package className="mr-2 h-4 w-4" />
                              Gerenciar Itens
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEdit(list)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => setDeleteList(list)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="py-12 text-center">
              <FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">
                {searchQuery
                  ? "Nenhuma lista encontrada com esses termos."
                  : "Nenhuma lista cadastrada."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <ListFormDialog
        open={isFormOpen}
        onClose={handleFormClose}
        list={selectedList}
      />

      <ListItemsDialog
        open={isItemsOpen}
        onClose={handleItemsClose}
        list={selectedList}
      />

      <AlertDialog open={!!deleteList} onOpenChange={() => setDeleteList(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir lista?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta lista de {deleteList?.grades?.name}{" "}
              de "{deleteList?.schools?.name}"? Todos os itens serão removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteList && deleteMutation.mutate(deleteList.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
