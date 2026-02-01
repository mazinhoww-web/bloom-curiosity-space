import { useState } from "react";
import { Heart, Share2, Copy, ExternalLink, Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface ThankYouStepProps {
  schoolSlug: string | null;
  schoolName: string;
  gradeName: string;
  itemsCount: number;
  onReset: () => void;
}

export function ThankYouStep({
  schoolSlug,
  schoolName,
  gradeName,
  itemsCount,
  onReset,
}: ThankYouStepProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const publicUrl = schoolSlug
    ? `${window.location.origin}/escola/${schoolSlug}`
    : null;

  const handleCopyLink = () => {
    if (publicUrl) {
      navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      toast({ title: "Link copiado!" });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShareWhatsApp = () => {
    if (publicUrl) {
      const text = `📚 Lista de materiais de ${schoolName} - ${gradeName}\n\nAcesse e confira os ${itemsCount} itens:`;
      const url = `https://wa.me/?text=${encodeURIComponent(text + "\n" + publicUrl)}`;
      window.open(url, "_blank");
    }
  };

  return (
    <div className="space-y-8 text-center">
      {/* Celebration */}
      <div className="relative">
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-accent/20 to-primary/20">
          <Heart className="h-12 w-12 text-accent fill-accent" />
        </div>
        <Sparkles className="absolute top-0 right-1/4 h-6 w-6 text-secondary animate-pulse" />
        <Sparkles className="absolute bottom-2 left-1/4 h-4 w-4 text-primary animate-pulse delay-300" />
      </div>

      {/* Message */}
      <div>
        <h2 className="font-display text-3xl font-bold text-foreground">
          Obrigado! 💚
        </h2>
        <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
          Sua contribuição vai ajudar dezenas de famílias a economizar tempo.
        </p>
      </div>

      {/* Summary */}
      <Card className="bg-muted/50 border-0">
        <CardContent className="p-5">
          <div className="flex flex-col gap-1">
            <p className="text-sm text-muted-foreground">Lista publicada</p>
            <p className="font-semibold text-foreground">{schoolName}</p>
            <p className="text-sm text-muted-foreground">
              {gradeName} • {itemsCount} itens
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Review Notice */}
      <div className="rounded-xl bg-primary/5 border border-primary/20 p-4">
        <p className="text-sm text-foreground">
          ✨ Sua lista já está disponível para consulta.
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Nossa equipe pode fazer pequenos ajustes para melhorar a qualidade
        </p>
      </div>

      {/* Share */}
      {publicUrl && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-foreground">
            Compartilhe com outros pais da turma:
          </p>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 gap-2"
              onClick={handleShareWhatsApp}
            >
              <Share2 className="h-4 w-4" />
              WhatsApp
            </Button>
            <Button
              variant="outline"
              className="flex-1 gap-2"
              onClick={handleCopyLink}
            >
              {copied ? (
                <Check className="h-4 w-4 text-success" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              {copied ? "Copiado!" : "Copiar link"}
            </Button>
          </div>
        </div>
      )}

      {/* View List */}
      {publicUrl && (
        <Button asChild size="lg" className="w-full gap-2">
          <Link to={`/escola/${schoolSlug}`}>
            <ExternalLink className="h-4 w-4" />
            Ver lista publicada
          </Link>
        </Button>
      )}

      {/* Upload Another */}
      <Button variant="ghost" className="w-full" onClick={onReset}>
        Enviar outra lista
      </Button>
    </div>
  );
}
