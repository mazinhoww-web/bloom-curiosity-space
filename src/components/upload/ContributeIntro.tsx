import { Heart, Users, Clock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ContributeIntroProps {
  onStart: () => void;
}

export function ContributeIntro({ onStart }: ContributeIntroProps) {
  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-accent/20 to-primary/20">
          <Heart className="h-10 w-10 text-accent" />
        </div>
        <h1 className="font-display text-3xl font-bold text-foreground md:text-4xl">
          Ajude outros pais
        </h1>
        <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
          Compartilhe a lista de materiais da escola do seu filho e economize 
          tempo de centenas de famílias.
        </p>
      </div>

      {/* Benefits */}
      <div className="grid gap-4">
        <div className="flex items-start gap-4 rounded-xl bg-muted/50 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Ajuda coletiva</h3>
            <p className="text-sm text-muted-foreground">
              Um pai envia, dezenas economizam tempo procurando
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4 rounded-xl bg-muted/50 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary/10">
            <Clock className="h-5 w-5 text-secondary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Rápido e simples</h3>
            <p className="text-sm text-muted-foreground">
              Menos de 2 minutos. Foto, PDF ou digitar os itens
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4 rounded-xl bg-muted/50 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10">
            <CheckCircle2 className="h-5 w-5 text-accent" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Sem cadastro</h3>
            <p className="text-sm text-muted-foreground">
              Não pedimos login, email ou dados pessoais
            </p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="space-y-4">
        <Button
          size="lg"
          className="w-full h-14 rounded-xl text-lg font-semibold shadow-lg"
          onClick={onStart}
        >
          Começar agora
        </Button>
        
        <p className="text-center text-sm text-muted-foreground">
          Sua contribuição fica disponível imediatamente para outros pais
        </p>
      </div>
    </div>
  );
}
