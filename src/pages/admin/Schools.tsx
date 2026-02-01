import { useState } from "react";
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
import { School } from "@/types/database";
import { SchoolFormDialog } from "@/components/admin/SchoolFormDialog";
import { SchoolImportDialog } from "@/components/admin/SchoolImportDialog";

export default function AdminSchools() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [deleteSchool, setDeleteSchool] = useState<School | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: schools, isLoading } = useQuery({
    queryKey: ["admin-schools", searchQuery],
    queryFn: async () => {
      let query = supabase
        .from("schools")
        .select("*")
        .order("name");

      if (searchQuery.trim()) {
        query = query.or(
          `name.ilike.%${searchQuery}%,cep.ilike.%${searchQuery}%,city.ilike.%${searchQuery}%`
        );
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as School[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("schools").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-schools"] });
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

  const handleEdit = (school: School) => {
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

  return (
    <AdminLayout title="Escolas" description="Gerencie as escolas cadastradas">
      <Card>
        <CardContent className="p-4">
          <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 sm:max-w-xs">
              <Input
                placeholder="Buscar escolas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
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

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : schools && schools.length > 0 ? (
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
                  {schools.map((school) => (
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
          ) : (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">
                {searchQuery
                  ? "Nenhuma escola encontrada com esses termos."
                  : "Nenhuma escola cadastrada."}
              </p>
            </div>
          )}
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
