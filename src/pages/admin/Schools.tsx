import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  MoreHorizontal,
  MapPin,
  Loader2,
  Upload,
  School,
  ChevronLeft,
  ChevronRight,
  BarChart3,
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
import { School as SchoolType } from "@/types/database";
import { SchoolFormDialog } from "@/components/admin/SchoolFormDialog";
import { SchoolImportDialog } from "@/components/admin/SchoolImportDialog";
import { SchoolFilters, SchoolFiltersState } from "@/components/schools/SchoolFilters";

const PAGE_SIZES = [20, 50, 100];
const DEBOUNCE_MS = 400;

export default function AdminSchools() {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filters, setFilters] = useState<SchoolFiltersState>({ state: "", city: "" });
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(50);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState<SchoolType | null>(null);
  const [deleteSchool, setDeleteSchool] = useState<SchoolType | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Proper debounce with useEffect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, DEBOUNCE_MS);
    
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Reset page when search or filters change
  useEffect(() => {
    setPage(0);
  }, [debouncedSearch, filters]);

  // Fetch school stats
  const { data: stats } = useQuery({
    queryKey: ["schools-stats"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("schools")
        .select("*", { count: "exact", head: true });
      
      if (error) throw error;
      return { total: count || 0 };
    },
    staleTime: 60000,
  });

  // Fetch schools with pagination, search, and filters
  const { data: schoolsData, isLoading, isFetching } = useQuery({
    queryKey: ["admin-schools", debouncedSearch, filters, page, pageSize],
    queryFn: async () => {
      const from = page * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from("schools")
        .select("*", { count: "exact" })
        .order("name")
        .range(from, to);

      // Apply search filter
      if (debouncedSearch.trim()) {
        const cleanSearch = debouncedSearch.trim();
        const isCepSearch = /^\d+$/.test(cleanSearch.replace(/\D/g, ''));
        
        if (isCepSearch) {
          query = query.ilike("cep", `%${cleanSearch.replace(/\D/g, '')}%`);
        } else {
          query = query.ilike("name", `%${cleanSearch}%`);
        }
      }

      // Apply state filter
      if (filters.state) {
        query = query.eq("state", filters.state);
      }

      // Apply city filter
      if (filters.city) {
        query = query.eq("city", filters.city);
      }

      const { data, error, count } = await query;
      if (error) throw error;
      
      return {
        schools: data as SchoolType[],
        total: count || 0,
      };
    },
    placeholderData: (prev) => prev,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("schools").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-schools"] });
      queryClient.invalidateQueries({ queryKey: ["schools-stats"] });
      toast({
        title: "Escola excluída",
        description: "A escola foi removida com sucesso.",
      });
      setDeleteSchool(null);
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Erro ao excluir",
        description: "Não foi possível excluir a escola. Verifique se não há listas vinculadas.",
      });
      console.error(error);
    },
  });

  const handleEdit = (school: SchoolType) => {
    setSelectedSchool(school);
    setIsFormOpen(true);
  };

  const handleCreate = () => {
    setSelectedSchool(null);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setSelectedSchool(null);
  };

  const totalPages = Math.ceil((schoolsData?.total || 0) / pageSize);

  return (
    <AdminLayout title="Escolas" description="Gerencie as escolas cadastradas">
      {/* Stats Cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Escolas
            </CardTitle>
            <School className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.total.toLocaleString('pt-BR') || '-'}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Resultados da Busca
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {debouncedSearch 
                ? schoolsData?.total.toLocaleString('pt-BR') || '0'
                : '-'
              }
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 sm:max-w-md">
              <Input
                placeholder="Buscar por nome ou CEP..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              {isFetching && (debouncedSearch || filters.state || filters.city) && (
                <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsImportOpen(true)} className="gap-2">
                <Upload className="h-4 w-4" />
                Importar CSV
              </Button>
              <Button onClick={handleCreate} className="gap-2">
                <Plus className="h-4 w-4" />
                Nova Escola
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="mb-4">
            <SchoolFilters filters={filters} onFiltersChange={setFilters} />
          </div>

          {/* Help text for search - only show if no search AND no filters */}
          {!debouncedSearch && !filters.state && !filters.city && (
            <div className="mb-4 rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
              <Search className="mx-auto mb-2 h-6 w-6" />
              <p>Digite o nome ou CEP para buscar escolas, ou use os filtros acima.</p>
              <p className="text-xs">A busca ou filtro é obrigatório para visualizar os registros.</p>
            </div>
          )}

          {(debouncedSearch || filters.state || filters.city) && isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (debouncedSearch || filters.state || filters.city) && schoolsData && schoolsData.schools.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Localização</TableHead>
                      <TableHead>CEP</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[70px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {schoolsData.schools.map((school) => (
                      <TableRow key={school.id}>
                        <TableCell className="font-medium">{school.name}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            {school.city && school.state
                              ? `${school.city}, ${school.state}`
                              : "-"}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {school.cep}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={school.is_active ? "default" : "secondary"}
                          >
                            {school.is_active ? "Ativa" : "Inativa"}
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
                              <DropdownMenuItem onClick={() => handleEdit(school)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => setDeleteSchool(school)}
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
                    de {schoolsData.total.toLocaleString('pt-BR')} resultados
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
          ) : (debouncedSearch || filters.state || filters.city) ? (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">
                Nenhuma escola encontrada com os critérios selecionados.
              </p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <SchoolFormDialog
        open={isFormOpen}
        onClose={handleFormClose}
        school={selectedSchool}
      />

      <SchoolImportDialog
        open={isImportOpen}
        onClose={() => setIsImportOpen(false)}
      />

      <AlertDialog open={!!deleteSchool} onOpenChange={() => setDeleteSchool(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir escola?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir "{deleteSchool?.name}"? Esta ação não
              pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteSchool && deleteMutation.mutate(deleteSchool.id)}
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
