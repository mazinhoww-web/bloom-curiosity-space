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

const listSchema = z.object({
  grade_id: z.string().min(1, "Selecione uma série"),
  year: z.number().min(2020).max(2100),
  is_active: z.boolean(),
  is_official: z.boolean(),
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
    is_official: boolean;
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
      is_official: false,
    },
  });

  useEffect(() => {
    if (list) {
      form.reset({
        grade_id: list.grade_id,
        year: list.year,
        is_active: list.is_active,
        is_official: list.is_official,
      });
    } else {
      form.reset({
        grade_id: "",
        year: new Date().getFullYear(),
        is_active: true,
        is_official: false,
      });
    }
  }, [list, form]);

  const onSubmit = async (data: ListFormData) => {
    if (!schoolId) return;
    setIsSubmitting(true);

    try {
      if (list) {
        // Update existing list - use raw query to handle is_official
        const { error } = await supabase
          .from("material_lists")
          .update({
            grade_id: data.grade_id,
            year: data.year,
            is_active: data.is_active,
          } as any)
          .eq("id", list.id);

        // Update is_official separately if needed
        if (!error && data.is_official !== list.is_official) {
          await supabase
            .from("material_lists")
            .update({ is_official: data.is_official } as any)
            .eq("id", list.id);
        }

        if (error) throw error;
        toast({ title: "Lista atualizada com sucesso!" });
      } else {
        // Create new list
        const { error } = await supabase
          .from("material_lists")
          .insert({
            school_id: schoolId,
            grade_id: data.grade_id,
            year: data.year,
            is_active: data.is_active,
          } as any);

        if (error) throw error;
        toast({ title: "Lista criada com sucesso!" });
      }

      queryClient.invalidateQueries({ queryKey: ["school-admin-lists"] });
      onOpenChange(false);
    } catch (error: any) {
      if (error?.message?.includes("idx_one_official_list_per_grade_school")) {
        toast({
          variant: "destructive",
          title: "Já existe uma lista oficial para esta série",
          description: "Desmarque a lista oficial atual antes de criar outra.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Erro ao salvar lista",
          description: error?.message || "Tente novamente.",
        });
      }
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

            <FormField
              control={form.control}
              name="is_official"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <FormLabel className="text-base">Lista Oficial</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Apenas uma lista oficial por série
                    </p>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

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
