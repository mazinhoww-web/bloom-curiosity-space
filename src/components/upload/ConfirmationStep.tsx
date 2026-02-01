import { Eye, School, GraduationCap, Package, Send, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExtractedItem } from "@/hooks/use-public-upload";

interface ConfirmationStepProps {
  schoolName: string;
  gradeName: string;
  items: ExtractedItem[];
  onBack: () => void;
  onConfirm: () => void;
  isPublishing: boolean;
}

export function ConfirmationStep({
  schoolName,
  gradeName,
  items,
  onBack,
  onConfirm,
  isPublishing,
}: ConfirmationStepProps) {
  // Group items by category
  const itemsByCategory = items.reduce((acc, item) => {
    const category = item.category || "Outros";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as Record<string, ExtractedItem[]>);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Eye className="h-8 w-8 text-primary" />
        </div>
        <h2 className="font-display text-2xl font-bold">Revise antes de enviar</h2>
        <p className="mt-2 text-muted-foreground">
          Confira se está tudo certo
        </p>
      </div>

      {/* Summary */}
      <Card className="bg-muted/50">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <School className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Escola</p>
              <p className="font-medium">{schoolName}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10">
              <GraduationCap className="h-5 w-5 text-secondary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Série</p>
              <p className="font-medium">{gradeName}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
              <Package className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total de itens</p>
              <p className="font-medium">{items.length} materiais</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Items Preview */}
      <div className="space-y-3 max-h-60 overflow-y-auto">
        {Object.entries(itemsByCategory).map(([category, categoryItems]) => (
          <Card key={category}>
            <CardHeader className="py-2 px-4">
              <CardTitle className="text-sm flex items-center justify-between">
                {category}
                <Badge variant="secondary" className="text-xs">
                  {categoryItems.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3 pt-0">
              <ul className="space-y-1">
                {categoryItems.map((item, i) => (
                  <li
                    key={i}
                    className="text-sm text-muted-foreground flex items-center gap-2"
                  >
                    <span className="text-primary font-medium">{item.quantity}x</span>
                    <span className="truncate">{item.name}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Notice */}
      <div className="rounded-lg bg-muted/50 p-4 text-center">
        <p className="text-sm text-muted-foreground">
          ⚡ Após o envio, a lista ficará disponível imediatamente para outros pais consultarem.
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={onBack}
          disabled={isPublishing}
          className="gap-1"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
        <Button
          size="lg"
          className="flex-1 gap-2"
          onClick={onConfirm}
          disabled={isPublishing}
        >
          {isPublishing ? (
            "Enviando..."
          ) : (
            <>
              <Send className="h-4 w-4" />
              Enviar lista
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
