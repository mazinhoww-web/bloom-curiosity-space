import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Send, Loader2, Calendar, Building2 } from "lucide-react";

export function InstitutionContactForm() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    phone: "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.email.trim() || !formData.company.trim()) {
      toast({
        title: "Preencha os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const { error } = await supabase.from("leads").insert({
        name: formData.name.trim(),
        email: formData.email.trim(),
        company: formData.company.trim(),
        phone: formData.phone.trim() || null,
        lead_type: "institution",
        message: formData.message.trim() || null,
      });

      if (error) throw error;
      
      toast({
        title: "Solicitação enviada!",
        description: "Nossa equipe entrará em contato para agendar a demonstração.",
      });
      
      setFormData({ name: "", email: "", company: "", phone: "", message: "" });
    } catch (error) {
      console.error("Error submitting lead:", error);
      toast({
        title: "Erro ao enviar",
        description: "Tente novamente ou entre em contato por email.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border-0 bg-card shadow-2xl">
      <CardContent className="p-6 md:p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="font-display text-lg font-bold text-foreground">
              Agende uma demonstração
            </h3>
            <p className="text-sm text-muted-foreground">
              Sem compromisso. Resposta em até 24h úteis.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="inst-name">Seu nome *</Label>
              <Input
                id="inst-name"
                placeholder="Nome completo"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="inst-company">Instituição *</Label>
              <Input
                id="inst-company"
                placeholder="Nome da escola ou rede"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="inst-email">Email institucional *</Label>
              <Input
                id="inst-email"
                type="email"
                placeholder="voce@escola.com.br"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="inst-phone">Telefone</Label>
              <Input
                id="inst-phone"
                type="tel"
                placeholder="(65) 9 9622-7110"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="inst-message">Como podemos ajudar?</Label>
            <Textarea
              id="inst-message"
              placeholder="Conte um pouco sobre sua escola e necessidades..."
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              rows={3}
            />
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full h-12 rounded-xl text-base font-semibold"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Calendar className="mr-2 h-5 w-5" />
                Solicitar demonstração
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
