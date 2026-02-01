import { useState } from "react";
import { CheckCircle2, Share2, Copy, ExternalLink, Store, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { usePartnerStores } from "@/hooks/use-partner-stores";

interface SuccessStepProps {
  schoolSlug: string | null;
  schoolName: string;
  gradeName: string;
  itemsCount: number;
  onReset: () => void;
}

export function SuccessStep({
  schoolSlug,
  schoolName,
  gradeName,
  itemsCount,
  onReset,
}: SuccessStepProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const { stores } = usePartnerStores();

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
      const text = `📚 Lista de materiais de ${schoolName} - ${gradeName}`;
      const url = `https://wa.me/?text=${encodeURIComponent(text + "\n" + publicUrl)}`;
      window.open(url, "_blank");
    }
  };

  return (
    <div className="space-y-6 text-center">
      {/* Success Icon */}
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-success/10">
        <CheckCircle2 className="h-12 w-12 text-success" />
      </div>

      {/* Title */}
      <div>
        <h2 className="font-display text-2xl font-bold text-success">
          Lista publicada! 🎉
        </h2>
        <p className="mt-2 text-muted-foreground">
          {itemsCount} itens adicionados para {schoolName} - {gradeName}
        </p>
      </div>

      {/* Public Link */}
      {publicUrl && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <p className="mb-2 text-sm font-medium">Link público da lista:</p>
            <div className="flex items-center gap-2 rounded-lg bg-background p-2">
              <span className="flex-1 truncate text-sm text-muted-foreground">
                {publicUrl}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0"
                onClick={handleCopyLink}
              >
                {copied ? (
                  <Check className="h-4 w-4 text-success" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Share Buttons */}
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
            <Check className="h-4 w-4" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
          {copied ? "Copiado!" : "Copiar link"}
        </Button>
      </div>

      {/* Partner Stores Preview */}
      {stores.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <p className="mb-3 text-sm font-medium flex items-center justify-center gap-2">
              <Store className="h-4 w-4" />
              Lojas parceiras disponíveis
            </p>
            <div className="flex justify-center gap-4">
              {stores.slice(0, 4).map((store) => (
                <div
                  key={store.id}
                  className="flex flex-col items-center gap-1"
                >
                  {store.logo_url ? (
                    <img
                      src={store.logo_url}
                      alt={store.name}
                      className="h-10 w-10 rounded-lg object-contain"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                      <Store className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {store.name}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* View List Button */}
      {publicUrl && (
        <Button asChild size="lg" className="w-full gap-2">
          <Link to={`/escola/${schoolSlug}`}>
            <ExternalLink className="h-4 w-4" />
            Ver lista publicada
          </Link>
        </Button>
      )}

      {/* Upload Another */}
      <Button
        variant="ghost"
        className="w-full"
        onClick={onReset}
      >
        Enviar outra lista
      </Button>
    </div>
  );
}
