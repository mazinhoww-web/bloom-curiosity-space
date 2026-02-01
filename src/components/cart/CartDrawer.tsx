import { ShoppingCart, Trash2, ExternalLink, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useCart, CartItem } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export function CartDrawer() {
  const { items, removeItem, clearCart, totalItems, totalEstimate, itemsWithPurchaseUrl, toggleOwned, ownedCount, itemsNotOwned } = useCart();
  const { toast } = useToast();

  const handleBuyAll = async () => {
    if (itemsWithPurchaseUrl.length === 0) {
      toast({
        title: "Nenhum item com link de compra",
        description: "Adicione itens com links de compra disponíveis.",
        variant: "destructive",
      });
      return;
    }

    // Track purchase clicks
    for (const item of itemsWithPurchaseUrl) {
      try {
        await supabase.from("purchase_events").insert({
          item_id: item.id,
          list_id: item.id, // We'd need to store list_id in cart item for proper tracking
          school_id: item.schoolId,
          user_agent: navigator.userAgent,
          referrer: document.referrer || null,
        });
      } catch (error) {
        console.error("Failed to track purchase:", error);
      }
    }

    // Open all purchase links in new tabs
    itemsWithPurchaseUrl.forEach((item, index) => {
      setTimeout(() => {
        window.open(item.purchase_url!, "_blank");
      }, index * 300); // Stagger to avoid popup blockers
    });

    toast({
      title: `Abrindo ${itemsWithPurchaseUrl.length} link(s) de compra`,
      description: "Verifique se seu navegador não bloqueou as janelas.",
    });
  };

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  // Group items by school
  const itemsBySchool = items.reduce((acc, item) => {
    if (!acc[item.schoolName]) {
      acc[item.schoolName] = [];
    }
    acc[item.schoolName].push(item);
    return acc;
  }, {} as Record<string, CartItem[]>);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <ShoppingCart className="h-5 w-5" />
          {totalItems > 0 && (
            <Badge 
              className="absolute -right-2 -top-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {totalItems}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="flex w-full flex-col sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 font-display">
            <ShoppingCart className="h-5 w-5" />
            Meu Carrinho
            {totalItems > 0 && (
              <div className="flex gap-2">
                <Badge variant="secondary">{totalItems} itens</Badge>
                {ownedCount > 0 && (
                  <Badge variant="outline" className="text-success border-success">
                    {ownedCount} já tenho
                  </Badge>
                )}
              </div>
            )}
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
            <ShoppingCart className="h-16 w-16 text-muted-foreground/50" />
            <div>
              <p className="font-medium">Seu carrinho está vazio</p>
              <p className="text-sm text-muted-foreground">
                Adicione itens da lista de materiais
              </p>
            </div>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 -mx-6 px-6">
              <div className="space-y-6 py-4">
                {Object.entries(itemsBySchool).map(([schoolName, schoolItems]) => (
                  <div key={schoolName}>
                    <h3 className="mb-3 text-sm font-medium text-muted-foreground">
                      {schoolName}
                    </h3>
                    <div className="space-y-3">
                      {schoolItems.map((item) => (
                        <div
                          key={item.id}
                          className={`flex items-start gap-3 rounded-lg border p-3 transition-colors ${
                            item.owned ? "bg-muted/50 border-muted" : ""
                          }`}
                        >
                          <div className="flex items-center pt-1">
                            <Checkbox
                              id={`owned-${item.id}`}
                              checked={item.owned || false}
                              onCheckedChange={() => toggleOwned(item.id)}
                              aria-label="Já tenho este item"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`font-medium truncate ${item.owned ? "line-through text-muted-foreground" : ""}`}>
                              {item.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {item.quantity} {item.unit || "un"} • {item.gradeName}
                            </p>
                            {item.brand_suggestion && (
                              <p className="text-xs text-muted-foreground">
                                Sugestão: {item.brand_suggestion}
                              </p>
                            )}
                            {item.owned ? (
                              <p className="mt-1 text-xs font-medium text-success flex items-center gap-1">
                                <Check className="h-3 w-3" />
                                Já tenho
                              </p>
                            ) : item.price_estimate ? (
                              <p className="mt-1 text-sm font-medium text-primary">
                                {formatPrice(item.price_estimate * (item.quantity || 1))}
                              </p>
                            ) : null}
                          </div>
                          <div className="flex items-center gap-1">
                            {item.purchase_url && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => window.open(item.purchase_url!, "_blank")}
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => removeItem(item.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <Separator />

            <div className="space-y-4 pt-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Falta comprar ({itemsNotOwned.length} itens):
                </span>
                <span className="text-lg font-bold">
                  {formatPrice(totalEstimate)}
                </span>
              </div>

              <SheetFooter className="flex-col gap-2 sm:flex-col">
                <Button
                  onClick={handleBuyAll}
                  className="w-full gap-2"
                  disabled={itemsWithPurchaseUrl.length === 0}
                >
                  <ExternalLink className="h-4 w-4" />
                  Comprar Tudo ({itemsWithPurchaseUrl.length} links)
                </Button>
                <Button
                  variant="outline"
                  onClick={clearCart}
                  className="w-full gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Limpar Carrinho
                </Button>
              </SheetFooter>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
