import { useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { MaterialList, School, Grade } from "@/types/database";

const listSchema = z.object({
  school_id: z.string().min(1, "Selecione uma escola"),
  grade_id: z.string().min(1, "Selecione uma série"),
  year: z.number().min(2020).max(2030),
  is_active: z.boolean(),
});

type ListFormData = z.infer<typeof listSchema>;

interface ListWithDetails extends MaterialList {
  schools: { id: string; name: string } | null;
  grades: Grade | null;
}

interface ListFormDialogProps {
  open: boolean;
  onClose: () => void;
  list: ListWithDetails | null;
}

export function ListFormDialog({ open, onClose, list }: ListFormDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!list;
  const currentYear = new Date().getFullYear();

  const {
    setValue,
    watch,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ListFormData>({
    resolver: zodResolver(listSchema),
    defaultValues: {
      school_id: "",
      grade_id: "",
      year: currentYear,
      is_active: true,
    },
  });

  const schoolId = watch("school_id");
  const gradeId = watch("grade_id");
  const year = watch("year");
  const isActive = watch("is_active");

  // Fetch schools
  const { data: schools } = useQuery({
    queryKey: ["all-schools"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("schools")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as School[];
    },
  });

  // Fetch grades
  const { data: grades } = useQuery({
    queryKey: ["all-grades"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("grades")
        .select("*")
        .order("order_index");
      if (error) throw error;
      return data as Grade[];
    },
  });

  useEffect(() => {
    if (list) {
      reset({
        school_id: list.school_id,
        grade_id: list.grade_id,
        year: list.year,
        is_active: list.is_active,
      });
    } else {
      reset({
        school_id: "",
        grade_id: "",
        year: currentYear,
        is_active: true,
      });
    }
  }, [list, reset, currentYear]);

  const mutation = useMutation({
    mutationFn: async (data: ListFormData) => {
      const listData = {
        school_id: data.school_id,
        grade_id: data.grade_id,
        year: data.year,
        is_active: data.is_active,
      };

      if (isEditing && list) {
        const { error } = await supabase
          .from("material_lists")
          .update(listData)
          .eq("id", list.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("material_lists").insert(listData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-lists"] });
      toast({
        title: isEditing ? "Lista atualizada" : "Lista criada",
        description: isEditing
          ? "As alterações foram salvas com sucesso."
          : "A lista foi criada. Agora você pode adicionar itens.",
      });
      onClose();
    },
    onError: (error: any) => {
      let message = "Ocorreu um erro. Tente novamente.";
      if (error.message?.includes("duplicate key")) {
        message = "Já existe uma lista para esta escola/série/ano.";
      }
      toast({
        variant: "destructive",
        title: "Erro",
        description: message,
      });
    },
  });

  const years = Array.from({ length: 5 }, (_, i) => currentYear + i - 1);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">
            {isEditing ? "Editar Lista" : "Nova Lista"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
          <div className="space-y-2">
            <Label>Escola *</Label>
            <Select
              value={schoolId}
              onValueChange={(value) => setValue("school_id", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma escola" />
              </SelectTrigger>
              <SelectContent>
                {schools?.map((school) => (
                  <SelectItem key={school.id} value={school.id}>
                    {school.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.school_id && (
              <p className="text-sm text-destructive">{errors.school_id.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Série *</Label>
            <Select
              value={gradeId}
              onValueChange={(value) => setValue("grade_id", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma série" />
              </SelectTrigger>
              <SelectContent>
                {grades?.map((grade) => (
                  <SelectItem key={grade.id} value={grade.id}>
                    {grade.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.grade_id && (
              <p className="text-sm text-destructive">{errors.grade_id.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Ano *</Label>
            <Select
              value={year.toString()}
              onValueChange={(value) => setValue("year", parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((y) => (
                  <SelectItem key={y} value={y.toString()}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="is_active">Lista ativa</Label>
              <p className="text-sm text-muted-foreground">
                Listas inativas não são exibidas
              </p>
            </div>
            <Switch
              id="is_active"
              checked={isActive}
              onCheckedChange={(checked) => setValue("is_active", checked)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isEditing ? "Salvar" : "Criar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
