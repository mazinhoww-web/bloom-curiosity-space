import { useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { School } from "@/types/database";

const schoolSchema = z.object({
  name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  slug: z.string().min(3, "Slug deve ter pelo menos 3 caracteres").regex(/^[a-z0-9-]+$/, "Slug deve conter apenas letras minúsculas, números e hífens"),
  cep: z.string().min(8, "CEP inválido").max(9, "CEP inválido"),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().max(2, "Use a sigla do estado (ex: SP)").optional(),
  phone: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  is_active: z.boolean(),
});

type SchoolFormData = z.infer<typeof schoolSchema>;

interface SchoolFormDialogProps {
  open: boolean;
  onClose: () => void;
  school: School | null;
}

export function SchoolFormDialog({ open, onClose, school }: SchoolFormDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!school;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SchoolFormData>({
    resolver: zodResolver(schoolSchema),
    defaultValues: {
      name: "",
      slug: "",
      cep: "",
      address: "",
      city: "",
      state: "",
      phone: "",
      email: "",
      is_active: true,
    },
  });

  const isActive = watch("is_active");

  useEffect(() => {
    if (school) {
      reset({
        name: school.name,
        slug: school.slug,
        cep: school.cep,
        address: school.address || "",
        city: school.city || "",
        state: school.state || "",
        phone: school.phone || "",
        email: school.email || "",
        is_active: school.is_active,
      });
    } else {
      reset({
        name: "",
        slug: "",
        cep: "",
        address: "",
        city: "",
        state: "",
        phone: "",
        email: "",
        is_active: true,
      });
    }
  }, [school, reset]);

  const mutation = useMutation({
    mutationFn: async (data: SchoolFormData) => {
      const schoolData = {
        name: data.name,
        slug: data.slug,
        cep: data.cep.replace(/\D/g, ""),
        address: data.address || null,
        city: data.city || null,
        state: data.state?.toUpperCase() || null,
        phone: data.phone || null,
        email: data.email || null,
        is_active: data.is_active,
      };

      if (isEditing && school) {
        const { error } = await supabase
          .from("schools")
          .update(schoolData)
          .eq("id", school.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("schools").insert(schoolData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-schools"] });
      toast({
        title: isEditing ? "Escola atualizada" : "Escola criada",
        description: isEditing
          ? "As alterações foram salvas com sucesso."
          : "A escola foi cadastrada com sucesso.",
      });
      onClose();
    },
    onError: (error: any) => {
      let message = "Ocorreu um erro. Tente novamente.";
      if (error.message?.includes("duplicate key")) {
        message = "Já existe uma escola com este slug.";
      }
      toast({
        variant: "destructive",
        title: "Erro",
        description: message,
      });
    },
  });

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    if (!isEditing) {
      setValue("slug", generateSlug(name));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">
            {isEditing ? "Editar Escola" : "Nova Escola"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="name">Nome da Escola *</Label>
              <Input
                id="name"
                {...register("name")}
                onChange={(e) => {
                  register("name").onChange(e);
                  handleNameChange(e);
                }}
                placeholder="Ex: Colégio São Paulo"
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="slug">Slug (URL) *</Label>
              <Input
                id="slug"
                {...register("slug")}
                placeholder="colegio-sao-paulo"
              />
              {errors.slug && (
                <p className="text-sm text-destructive">{errors.slug.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cep">CEP *</Label>
              <Input id="cep" {...register("cep")} placeholder="00000-000" />
              {errors.cep && (
                <p className="text-sm text-destructive">{errors.cep.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">Estado</Label>
              <Input id="state" {...register("state")} placeholder="SP" maxLength={2} />
              {errors.state && (
                <p className="text-sm text-destructive">{errors.state.message}</p>
              )}
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="city">Cidade</Label>
              <Input id="city" {...register("city")} placeholder="São Paulo" />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="address">Endereço</Label>
              <Input
                id="address"
                {...register("address")}
                placeholder="Rua das Flores, 123"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                {...register("phone")}
                placeholder="(11) 99999-9999"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...register("email")}
                placeholder="contato@escola.com"
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="flex items-center justify-between sm:col-span-2">
              <div>
                <Label htmlFor="is_active">Escola ativa</Label>
                <p className="text-sm text-muted-foreground">
                  Escolas inativas não aparecem na busca pública
                </p>
              </div>
              <Switch
                id="is_active"
                checked={isActive}
                onCheckedChange={(checked) => setValue("is_active", checked)}
              />
            </div>
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
