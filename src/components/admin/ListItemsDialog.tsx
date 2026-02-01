import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Trash2,
  Loader2,
  Package,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { MaterialList, MaterialItem, MaterialCategory, Grade } from "@/types/database";

interface ListWithDetails extends MaterialList {
  schools: { id: string; name: string } | null;
  grades: Grade | null;
}

interface ListItemsDialogProps {
  open: boolean;
  onClose: () => void;
  list: ListWithDetails | null;
}

interface ItemWithCategory extends MaterialItem {
  material_categories: MaterialCategory | null;
}

export function ListItemsDialog({ open, onClose, list }: ListItemsDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [categoryId, setCategoryId] = useState("");
  const [priceEstimate, setPriceEstimate] = useState("");
  const [purchaseUrl, setPurchaseUrl] = useState("");
  const [description, setDescription] = useState("");
  const [brandSuggestion, setBrandSuggestion] = useState("");
  const [isRequired, setIsRequired] = useState(true);

  // Fetch items
  const { data: items, isLoading } = useQuery({
    queryKey: ["list-items", list?.id],
    queryFn: async () => {
      if (!list) return [];
      const { data, error } = await supabase
        .from("material_items")
        .select(`*, material_categories (*)`)
        .eq("list_id", list.id)
        .order("created_at");
      if (error) throw error;
      return data as ItemWithCategory[];
    },
    enabled: !!list?.id,
  });

  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ["all-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("material_categories")
        .select("*")
        .order("order_index");
      if (error) throw error;
      return data as MaterialCategory[];
    },
  });

  const resetForm = () => {
    setName("");
    setQuantity(1);
    setCategoryId("");
    setPriceEstimate("");
    setPurchaseUrl("");
    setDescription("");
    setBrandSuggestion("");
    setIsRequired(true);
    setIsAdding(false);
  };

  const addMutation = useMutation({
    mutationFn: async () => {
      if (!list) return;
      const { error } = await supabase.from("material_items").insert({
        list_id: list.id,
        name,
        quantity,
        category_id: categoryId || null,
        price_estimate: priceEstimate ? parseFloat(priceEstimate) : null,
        purchase_url: purchaseUrl || null,
        description: description || null,
        brand_suggestion: brandSuggestion || null,
        is_required: isRequired,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["list-items", list?.id] });
      queryClient.invalidateQueries({ queryKey: ["admin-lists"] });
      toast({ title: "Item adicionado" });
      resetForm();
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Erro ao adicionar item",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase
        .from("material_items")
        .delete()
        .eq("id", itemId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["list-items", list?.id] });
      queryClient.invalidateQueries({ queryKey: ["admin-lists"] });
      toast({ title: "Item removido" });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Erro ao remover item",
      });
    },
  });

  if (!list) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="font-display">
            Itens da Lista - {list.grades?.name}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">{list.schools?.name}</p>
        </DialogHeader>

        {/* Add item form */}
        {isAdding ? (
          <div className="rounded-lg border bg-muted/30 p-4">
            <h3 className="mb-4 font-medium">Novo Item</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label>Nome do item *</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Caderno 96 folhas"
                />
              </div>

              <div className="space-y-2">
                <Label>Quantidade</Label>
                <Input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                />
              </div>

              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Preço estimado (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={priceEstimate}
                  onChange={(e) => setPriceEstimate(e.target.value)}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label>Sugestão de marca</Label>
                <Input
                  value={brandSuggestion}
                  onChange={(e) => setBrandSuggestion(e.target.value)}
                  placeholder="Ex: Faber-Castell"
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label>Link de compra</Label>
                <Input
                  value={purchaseUrl}
                  onChange={(e) => setPurchaseUrl(e.target.value)}
                  placeholder="https://..."
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label>Descrição</Label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detalhes adicionais..."
                />
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={isRequired}
                  onCheckedChange={setIsRequired}
                />
                <Label>Item obrigatório</Label>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <Button
                onClick={() => addMutation.mutate()}
                disabled={!name.trim() || addMutation.isPending}
              >
                {addMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Adicionar
              </Button>
              <Button variant="outline" onClick={resetForm}>
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <Button onClick={() => setIsAdding(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Adicionar Item
          </Button>
        )}

        {/* Items list */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : items && items.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Qtd</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Preço</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div>
                        <span className="font-medium">{item.name}</span>
                        {!item.is_required && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            Opcional
                          </Badge>
                        )}
                        {item.description && (
                          <p className="text-xs text-muted-foreground">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>
                      {item.material_categories ? (
                        <Badge
                          variant="secondary"
                          style={{
                            backgroundColor: `${item.material_categories.color}20`,
                            color: item.material_categories.color || undefined,
                          }}
                        >
                          {item.material_categories.name}
                        </Badge>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>
                      {item.price_estimate
                        ? `R$ ${item.price_estimate.toFixed(2)}`
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {item.purchase_url && (
                          <Button
                            variant="ghost"
                            size="icon"
                            asChild
                          >
                            <a href={item.purchase_url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteMutation.mutate(item.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="py-8 text-center">
            <Package className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
            <p className="text-muted-foreground">Nenhum item cadastrado</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
