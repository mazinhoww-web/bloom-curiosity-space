import { Check, Edit2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ExtractedItem {
  name: string;
  quantity: number;
  unit: string;
  category: string;
  brand_suggestion?: string;
}

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
  const groupedItems = items.reduce((acc, item) => {
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
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Check className="h-6 w-6 text-primary" />
        </div>
        <h2 className="font-display text-xl font-bold text-foreground">
          Confirme a lista
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Verifique se os itens estão corretos antes de publicar
        </p>
      </div>

      {/* School & Grade Info */}
      <div className="flex flex-wrap gap-2 justify-center">
        <Badge variant="secondary" className="text-sm">
          {schoolName}
        </Badge>
        <Badge variant="outline" className="text-sm">
          {gradeName}
        </Badge>
      </div>

      {/* Items List by Category */}
      <div className="max-h-64 space-y-4 overflow-y-auto rounded-lg border bg-muted/30 p-4">
        {Object.entries(groupedItems).map(([category, categoryItems]) => (
          <div key={category}>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {category} ({categoryItems.length})
            </h3>
            <div className="space-y-1.5">
              {categoryItems.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-md bg-card px-3 py-2 text-sm"
                >
                  <span className="truncate flex-1">{item.name}</span>
                  <span className="ml-2 shrink-0 text-muted-foreground">
                    {item.quantity} {item.unit}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="text-center text-sm text-muted-foreground">
        Total: <strong className="text-foreground">{items.length} itens</strong>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          className="flex-1 gap-2"
          onClick={onBack}
          disabled={isPublishing}
        >
          <Edit2 className="h-4 w-4" />
          Editar
        </Button>
        <Button
          className="flex-1 gap-2"
          onClick={onConfirm}
          disabled={isPublishing || items.length === 0}
        >
          {isPublishing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Publicando...
            </>
          ) : (
            <>
              <Check className="h-4 w-4" />
              Publicar lista
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
