import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Building2, AlertTriangle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";
import { useSubmitClaimRequest, isGenericEmail } from "@/hooks/use-school-claim";

const POSITION_OPTIONS = [
  { value: "diretor", label: "Diretor(a)" },
  { value: "coordenador", label: "Coordenador(a) Pedagógico" },
  { value: "secretaria", label: "Secretaria" },
  { value: "ti", label: "TI / Tecnologia" },
  { value: "administrativo", label: "Administrativo" },
  { value: "professor", label: "Professor(a)" },
  { value: "outro", label: "Outro" },
];

const claimSchema = z.object({
  full_name: z.string()
    .min(3, "Nome deve ter pelo menos 3 caracteres")
    .max(100, "Nome muito longo"),
  email: z.string()
    .email("Email inválido")
    .max(255, "Email muito longo"),
  position: z.string()
    .min(1, "Selecione seu cargo"),
  phone: z.string()
    .regex(/^[\d\s\(\)\-\+]*$/, "Telefone inválido")
    .optional()
    .or(z.literal("")),
  notes: z.string()
    .max(500, "Observação muito longa")
    .optional(),
});

type ClaimFormData = z.infer<typeof claimSchema>;

interface ClaimSchoolDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schoolId: string;
  schoolName: string;
}

export function ClaimSchoolDialog({
  open,
  onOpenChange,
  schoolId,
  schoolName,
}: ClaimSchoolDialogProps) {
  const { user } = useAuth();
  const submitClaim = useSubmitClaimRequest();
  const [showGenericWarning, setShowGenericWarning] = useState(false);
  const [success, setSuccess] = useState(false);

  const form = useForm<ClaimFormData>({
    resolver: zodResolver(claimSchema),
    defaultValues: {
      full_name: "",
      email: user?.email || "",
      position: "",
      phone: "",
      notes: "",
    },
  });

  const watchEmail = form.watch("email");

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const email = e.target.value;
    form.setValue("email", email);
    setShowGenericWarning(isGenericEmail(email));
  };

  const onSubmit = async (data: ClaimFormData) => {
    await submitClaim.mutateAsync({
      school_id: schoolId,
      full_name: data.full_name,
      email: data.email,
      position: data.position,
      phone: data.phone || undefined,
      notes: data.notes || undefined,
    });
    setSuccess(true);
  };

  const handleClose = () => {
    if (!submitClaim.isPending) {
      form.reset();
      setSuccess(false);
      setShowGenericWarning(false);
      onOpenChange(false);
    }
  };

  if (success) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center text-center py-6">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <DialogTitle className="text-xl font-display mb-2">
              Solicitação enviada!
            </DialogTitle>
            <DialogDescription className="text-base">
              Recebemos sua solicitação para administrar <strong>{schoolName}</strong>.
              Analisaremos em até 48 horas úteis e entraremos em contato.
            </DialogDescription>
            <Button onClick={handleClose} className="mt-6">
              Entendi
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="font-display text-lg">
                Solicitar administração
              </DialogTitle>
              <DialogDescription className="text-sm">
                {schoolName}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Nome completo */}
          <div className="space-y-2">
            <Label htmlFor="full_name">Nome completo *</Label>
            <Input
              id="full_name"
              placeholder="Seu nome completo"
              {...form.register("full_name")}
            />
            {form.formState.errors.full_name && (
              <p className="text-sm text-destructive">
                {form.formState.errors.full_name.message}
              </p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email institucional *</Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@escola.edu.br"
              value={watchEmail}
              onChange={handleEmailChange}
            />
            {form.formState.errors.email && (
              <p className="text-sm text-destructive">
                {form.formState.errors.email.message}
              </p>
            )}
            {showGenericWarning && (
              <Alert variant="default" className="border-amber-200 bg-amber-50">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800 text-sm">
                  Recomendamos usar um email institucional (ex: @escola.edu.br) para agilizar a aprovação.
                  Emails genéricos podem exigir verificação adicional.
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Cargo */}
          <div className="space-y-2">
            <Label htmlFor="position">Cargo na escola *</Label>
            <Select
              value={form.watch("position")}
              onValueChange={(value) => form.setValue("position", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione seu cargo" />
              </SelectTrigger>
              <SelectContent>
                {POSITION_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.position && (
              <p className="text-sm text-destructive">
                {form.formState.errors.position.message}
              </p>
            )}
          </div>

          {/* Telefone */}
          <div className="space-y-2">
            <Label htmlFor="phone">Telefone (opcional)</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="(00) 00000-0000"
              {...form.register("phone")}
            />
            {form.formState.errors.phone && (
              <p className="text-sm text-destructive">
                {form.formState.errors.phone.message}
              </p>
            )}
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="notes">Observações (opcional)</Label>
            <Textarea
              id="notes"
              placeholder="Informações adicionais que possam ajudar na verificação"
              rows={3}
              {...form.register("notes")}
            />
            {form.formState.errors.notes && (
              <p className="text-sm text-destructive">
                {form.formState.errors.notes.message}
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={submitClaim.isPending}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={submitClaim.isPending}
              className="flex-1"
            >
              {submitClaim.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Enviar solicitação
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
