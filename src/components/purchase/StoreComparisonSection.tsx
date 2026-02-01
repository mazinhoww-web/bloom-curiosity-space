import { useState } from "react";
import { Store, ExternalLink, ShoppingCart, ChevronDown, ChevronUp, Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useStoreCarts, useStoreCartActions } from "@/hooks/use-store-carts";

interface StoreComparisonSectionProps {
  listId: string | null | undefined;
  schoolId?: string;
}

export function StoreComparisonSection({ listId, schoolId }: StoreComparisonSectionProps) {
  const { storeCarts, totalItems, isLoading, error } = useStoreCarts(listId);
  const { openAllItemsInStore, openSingleItem, isOpening } = useStoreCartActions();
  const [expandedStore, setExpandedStore] = useState<string | null>(null);

  if (isLoading) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-40 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || storeCarts.length === 0) {
    return null;
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const handleBuyAll = (storeCart: typeof storeCarts[0]) => {
    openAllItemsInStore(storeCart, schoolId, listId || undefined);
  };

  const toggleExpanded = (storeId: string) => {
    setExpandedStore(expandedStore === storeId ? null : storeId);
  };

  return (
    <Card className="mt-6 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-display text-lg">
          <Store className="h-5 w-5 text-primary" />
          Escolha sua Loja
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Compare preços e compre todos os {totalItems} itens na loja de sua preferência
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {storeCarts.map((storeCart) => (
            <Card key={storeCart.store_id} className="relative overflow-hidden">
              <CardContent className="p-4">
                {/* Store Header */}
                <div className="mb-3 flex items-center gap-3">
                  {storeCart.logo_url ? (
                    <img
                      src={storeCart.logo_url}
                      alt={storeCart.store_name}
                      className="h-10 w-10 rounded-lg object-contain"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                      <Store className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold">{storeCart.store_name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {totalItems} itens disponíveis
                    </p>
                  </div>
                </div>

                {/* Price Estimate */}
                <div className="mb-4">
                  {storeCart.total_estimate ? (
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-primary">
                        {formatCurrency(storeCart.total_estimate)}
                      </span>
                      {storeCart.items_without_price > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          estimado
                        </Badge>
                      )}
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      Preço varia conforme busca
                    </span>
                  )}
                  {storeCart.items_without_price > 0 && storeCart.total_estimate && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {storeCart.items_with_price} com preço • {storeCart.items_without_price} sem preço
                    </p>
                  )}
                </div>

                {/* Buy All Button */}
                <Button
                  className="w-full gap-2"
                  onClick={() => handleBuyAll(storeCart)}
                  disabled={isOpening}
                >
                  <ShoppingCart className="h-4 w-4" />
                  Comprar tudo aqui
                </Button>

                {/* Expandable Items List */}
                <Collapsible
                  open={expandedStore === storeCart.store_id}
                  onOpenChange={() => toggleExpanded(storeCart.store_id)}
                >
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2 w-full gap-1 text-xs"
                    >
                      {expandedStore === storeCart.store_id ? (
                        <>
                          <ChevronUp className="h-3 w-3" />
                          Ocultar itens
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-3 w-3" />
                          Ver itens individuais
                        </>
                      )}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2">
                    <div className="max-h-60 space-y-2 overflow-y-auto rounded-lg bg-muted/50 p-2">
                      {storeCart.items.map((item) => (
                        <div
                          key={item.item_id}
                          className="flex items-center justify-between rounded-md bg-background p-2 text-sm"
                        >
                          <div className="flex-1 truncate">
                            <span className="font-medium">{item.quantity}x</span>{" "}
                            <span>{item.name}</span>
                            {item.price_estimate && (
                              <span className="ml-2 text-muted-foreground">
                                ({formatCurrency(item.price_estimate * item.quantity)})
                              </span>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 shrink-0"
                            onClick={() =>
                              openSingleItem(
                                item.url,
                                storeCart.store_id,
                                item.item_id,
                                schoolId,
                                listId || undefined
                              )
                            }
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Disclaimer */}
        <p className="mt-4 text-center text-xs text-muted-foreground/70">
          *Preços podem variar. Ao clicar, você será redirecionado para a loja parceira.
        </p>
      </CardContent>
    </Card>
  );
}
