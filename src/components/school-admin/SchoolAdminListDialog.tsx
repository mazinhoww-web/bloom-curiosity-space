import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

type ListStatus = "draft" | "published" | "flagged" | "official";

const listSchema = z.object({
  grade_id: z.string().min(1, "Selecione uma série"),
  year: z.number().min(2020).max(2100),
  is_active: z.boolean(),
});

type ListFormData = z.infer<typeof listSchema>;

interface Grade {
  id: string;
  name: string;
}

interface SchoolAdminListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  list: {
    id: string;
    grade_id: string;
    year: number;
    is_active: boolean;
    status: ListStatus;
  } | null;
  grades: Grade[];
}

export function SchoolAdminListDialog({
  open,
  onOpenChange,
  list,
  grades,
}: SchoolAdminListDialogProps) {
  const { schoolId } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ListFormData>({
    resolver: zodResolver(listSchema),
    defaultValues: {
      grade_id: "",
      year: new Date().getFullYear(),
      is_active: true,
    },
  });

  useEffect(() => {
    if (list) {
      form.reset({
        grade_id: list.grade_id,
        year: list.year,
        is_active: list.is_active,
      });
    } else {
      form.reset({
        grade_id: "",
        year: new Date().getFullYear(),
        is_active: true,
      });
    }
  }, [list, form]);

  const onSubmit = async (data: ListFormData) => {
    if (!schoolId) return;
    setIsSubmitting(true);

    try {
      if (list) {
        // Update existing list
        const { error } = await supabase
          .from("material_lists")
          .update({
            grade_id: data.grade_id,
            year: data.year,
            is_active: data.is_active,
          } as any)
          .eq("id", list.id);

        if (error) throw error;
        toast({ title: "Lista atualizada com sucesso!" });
      } else {
        // Create new list with draft status
        const { error } = await supabase
          .from("material_lists")
          .insert({
            school_id: schoolId,
            grade_id: data.grade_id,
            year: data.year,
            is_active: data.is_active,
            status: "draft",
          } as any);

        if (error) throw error;
        toast({ title: "Lista criada com sucesso!" });
      }

      queryClient.invalidateQueries({ queryKey: ["school-admin-lists"] });
      onOpenChange(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao salvar lista",
        description: error?.message || "Tente novamente.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display">
            {list ? "Editar Lista" : "Nova Lista"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="grade_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Série</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a série" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {grades.map((grade) => (
                        <SelectItem key={grade.id} value={grade.id}>
                          {grade.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="year"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ano</FormLabel>
                  <Select
                    onValueChange={(v) => field.onChange(parseInt(v))}
                    value={field.value.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {[2024, 2025, 2026, 2027].map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <FormLabel className="text-base">Lista Ativa</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Listas ativas são visíveis para os pais
                    </p>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Note about status management */}
            {list && (
              <div className="rounded-lg border border-muted bg-muted/50 p-3 text-sm text-muted-foreground">
                <p>
                  <strong>Status atual:</strong>{" "}
                  {list.status === "official"
                    ? "Oficial"
                    : list.status === "published"
                    ? "Publicada"
                    : list.status === "flagged"
                    ? "Sinalizada"
                    : "Rascunho"}
                </p>
                <p className="mt-1">
                  Use o toggle na tabela para promover ou remover uma lista como oficial.
                </p>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {list ? "Salvar" : "Criar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
