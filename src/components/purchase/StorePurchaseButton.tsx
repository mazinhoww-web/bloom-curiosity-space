import { useState } from "react";
import { ExternalLink, Store, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePartnerStores, useLinkResolver } from "@/hooks/use-partner-stores";
import { Skeleton } from "@/components/ui/skeleton";

interface StorePurchaseButtonProps {
  itemId: string;
  itemName: string;
  schoolId?: string;
  listId?: string;
  size?: "sm" | "default" | "lg";
  variant?: "default" | "outline" | "ghost";
}

export function StorePurchaseButton({
  itemId,
  itemName,
  schoolId,
  listId,
  size = "sm",
  variant = "outline",
}: StorePurchaseButtonProps) {
  const { stores, isLoading: isLoadingStores } = usePartnerStores();
  const { openPurchaseLink, isResolving } = useLinkResolver();
  const [selectedStore, setSelectedStore] = useState<string | null>(null);

  const handleStoreClick = async (storeId: string) => {
    setSelectedStore(storeId);
    await openPurchaseLink(itemId, storeId, schoolId, listId);
    setSelectedStore(null);
  };

  if (isLoadingStores) {
    return <Skeleton className="h-9 w-24" />;
  }

  if (stores.length === 0) {
    return null;
  }

  // If only one store, show simple button
  if (stores.length === 1) {
    const store = stores[0];
    return (
      <Button
        size={size}
        variant={variant}
        className="gap-1"
        disabled={isResolving}
        onClick={() => handleStoreClick(store.id)}
      >
        {isResolving && selectedStore === store.id ? (
          <span className="animate-spin">⏳</span>
        ) : (
          <ExternalLink className="h-4 w-4" />
        )}
        <span className="hidden sm:inline">Comprar</span>
      </Button>
    );
  }

  // Multiple stores - show dropdown
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size={size}
          variant={variant}
          className="gap-1"
          disabled={isResolving}
        >
          {isResolving ? (
            <span className="animate-spin">⏳</span>
          ) : (
            <Store className="h-4 w-4" />
          )}
          <span className="hidden sm:inline">Comprar</span>
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {stores.map((store) => (
          <DropdownMenuItem
            key={store.id}
            onClick={() => handleStoreClick(store.id)}
            disabled={isResolving && selectedStore === store.id}
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            {store.name}
            {isResolving && selectedStore === store.id && (
              <span className="ml-2 animate-spin">⏳</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
