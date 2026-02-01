import { Camera, FileText, PenLine, Sparkles, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ContributeIntroProps {
  onStart: () => void;
}

export function ContributeIntro({ onStart }: ContributeIntroProps) {
  return (
    <div className="space-y-6 text-center">
      {/* Icon */}
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
        <Heart className="h-8 w-8 text-primary" />
      </div>

      {/* Title */}
      <div className="space-y-2">
        <h1 className="font-display text-2xl font-bold text-foreground">
          Contribua com uma lista
        </h1>
        <p className="text-muted-foreground">
          Ajude outros pais a encontrar a lista de materiais da escola.
          É rápido, gratuito e anônimo.
        </p>
      </div>

      {/* Methods */}
      <div className="grid gap-3 text-left">
        <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Camera className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium">Fotografe a lista</p>
            <p className="text-xs text-muted-foreground">Use a câmera do celular</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary/10">
            <FileText className="h-5 w-5 text-secondary" />
          </div>
          <div>
            <p className="text-sm font-medium">Envie o arquivo</p>
            <p className="text-xs text-muted-foreground">PDF, Word ou imagem</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10">
            <PenLine className="h-5 w-5 text-accent" />
          </div>
          <div>
            <p className="text-sm font-medium">Digite manualmente</p>
            <p className="text-xs text-muted-foreground">Item por item</p>
          </div>
        </div>
      </div>

      {/* AI Badge */}
      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <Sparkles className="h-3.5 w-3.5 text-primary" />
        <span>IA extrai os itens automaticamente</span>
      </div>

      {/* CTA */}
      <Button size="lg" className="w-full" onClick={onStart}>
        Começar agora
      </Button>
    </div>
  );
}
