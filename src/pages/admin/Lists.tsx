import { useState, useCallback } from "react";
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
  ChevronLeft,
  ChevronRight,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Star,
} from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { MaterialList, Grade } from "@/types/database";
import { ListFormDialog } from "@/components/admin/ListFormDialog";
import { ListItemsDialog } from "@/components/admin/ListItemsDialog";
import { ListStatusBadge } from "@/components/lists/ListStatusBadge";

const PAGE_SIZES = [20, 50, 100];
const DEBOUNCE_MS = 400;

interface ListWithDetails extends MaterialList {
  schools: { id: string; name: string } | null;
  grades: Grade | null;
  material_items: { id: string }[];
  status: "draft" | "published" | "flagged" | "official";
}

export default function AdminLists() {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(50);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isItemsOpen, setIsItemsOpen] = useState(false);
  const [selectedList, setSelectedList] = useState<ListWithDetails | null>(null);
  const [deleteList, setDeleteList] = useState<ListWithDetails | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Debounce search
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    setPage(0);
    
    const timeoutId = setTimeout(() => {
      setDebouncedSearch(value);
    }, DEBOUNCE_MS);
    
    return () => clearTimeout(timeoutId);
  }, []);

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ["lists-stats"],
    queryFn: async () => {
      const [total, active, draft, published, official] = await Promise.all([
        supabase.from("material_lists").select("id", { count: "exact", head: true }),
        supabase.from("material_lists").select("id", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("material_lists").select("id", { count: "exact", head: true }).eq("status", "draft"),
        supabase.from("material_lists").select("id", { count: "exact", head: true }).eq("status", "published"),
        supabase.from("material_lists").select("id", { count: "exact", head: true }).eq("status", "official"),
      ]);
      return {
        total: total.count || 0,
        active: active.count || 0,
        draft: draft.count || 0,
        published: published.count || 0,
        official: official.count || 0,
      };
    },
    staleTime: 60000,
  });

  // Fetch lists with server-side pagination
  const { data: listsData, isLoading, isFetching } = useQuery({
    queryKey: ["admin-lists-v2", debouncedSearch, page, pageSize, statusFilter],
    queryFn: async () => {
      const from = page * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from("material_lists")
        .select(`
          *,
          schools (id, name),
          grades (*),
          material_items (id)
        `, { count: "exact" })
        .order("year", { ascending: false })
        .order("created_at", { ascending: false })
        .range(from, to);

      // Status filter
      if (statusFilter !== "all" && ["draft", "published", "flagged", "official"].includes(statusFilter)) {
        query = query.eq("status", statusFilter as "draft" | "published" | "flagged" | "official");
      }

      const { data, error, count } = await query;
      if (error) throw error;

      // Client-side search (school/grade names require join)
      let filteredData = data as ListWithDetails[];
      if (debouncedSearch.trim()) {
        const search = debouncedSearch.toLowerCase();
        filteredData = filteredData.filter(
          (list) =>
            list.schools?.name?.toLowerCase().includes(search) ||
            list.grades?.name?.toLowerCase().includes(search)
        );
      }

      return {
        lists: filteredData,
        total: count || 0,
      };
    },
    placeholderData: (prev) => prev,
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
      queryClient.invalidateQueries({ queryKey: ["admin-lists-v2"] });
      queryClient.invalidateQueries({ queryKey: ["lists-stats"] });
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

  const totalPages = Math.ceil((listsData?.total || 0) / pageSize);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "official":
        return <Star className="h-3 w-3" />;
      case "published":
        return <CheckCircle2 className="h-3 w-3" />;
      case "draft":
        return <Clock className="h-3 w-3" />;
      case "flagged":
        return <AlertTriangle className="h-3 w-3" />;
      default:
        return null;
    }
  };

  return (
    <AdminLayout title="Listas de Materiais" description="Gerencie as listas por escola e série">
      {/* Stats Cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total.toLocaleString('pt-BR') || '-'}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ativas
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{stats?.active.toLocaleString('pt-BR') || '-'}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Oficiais
            </CardTitle>
            <Star className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{stats?.official.toLocaleString('pt-BR') || '-'}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Publicadas
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-info" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-info">{stats?.published.toLocaleString('pt-BR') || '-'}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Rascunhos
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.draft.toLocaleString('pt-BR') || '-'}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 gap-2">
              <div className="relative flex-1 sm:max-w-xs">
                <Input
                  placeholder="Buscar por escola ou série..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-9"
                />
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                {isFetching && (
                  <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                )}
              </div>
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(0); }}>
                <SelectTrigger className="w-[140px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="official">Oficiais</SelectItem>
                  <SelectItem value="published">Publicadas</SelectItem>
                  <SelectItem value="draft">Rascunhos</SelectItem>
                  <SelectItem value="flagged">Sinalizadas</SelectItem>
                </SelectContent>
              </Select>
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
          ) : listsData && listsData.lists.length > 0 ? (
            <>
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
                    {listsData.lists.map((list) => (
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
                          <ListStatusBadge status={list.status} />
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

              {/* Pagination */}
              <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Mostrando</span>
                  <Select
                    value={pageSize.toString()}
                    onValueChange={(v) => {
                      setPageSize(Number(v));
                      setPage(0);
                    }}
                  >
                    <SelectTrigger className="w-[70px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAGE_SIZES.map((size) => (
                        <SelectItem key={size} value={size.toString()}>
                          {size}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span>
                    de {listsData.total.toLocaleString('pt-BR')} resultados
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm">
                    Página {page + 1} de {totalPages || 1}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page >= totalPages - 1}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="py-12 text-center">
              <FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">
                {debouncedSearch || statusFilter !== "all"
                  ? "Nenhuma lista encontrada com esses filtros."
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
