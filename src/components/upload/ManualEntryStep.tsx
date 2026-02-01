import { useState } from "react";
import { Plus, Trash2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ExtractedItem {
  name: string;
  quantity: number;
  unit: string;
  category: string;
  brand_suggestion?: string;
}

interface ManualEntryStepProps {
  items: ExtractedItem[];
  onUpdateItems: (items: ExtractedItem[]) => void;
  onFinish: () => void;
}

const CATEGORIES = [
  "Cadernos",
  "Livros",
  "Material de escrita",
  "Papelaria",
  "Artes",
  "Higiene",
  "Uniforme",
  "Outros",
];

export function ManualEntryStep({ items, onUpdateItems, onFinish }: ManualEntryStepProps) {
  const [newItem, setNewItem] = useState<Partial<ExtractedItem>>({
    name: "",
    quantity: 1,
    unit: "un",
    category: "Material de escrita",
  });

  const handleAddItem = () => {
    if (!newItem.name?.trim()) return;

    onUpdateItems([
      ...items,
      {
        name: newItem.name.trim(),
        quantity: newItem.quantity || 1,
        unit: newItem.unit || "un",
        category: newItem.category || "Outros",
        brand_suggestion: newItem.brand_suggestion,
      },
    ]);

    setNewItem({
      name: "",
      quantity: 1,
      unit: "un",
      category: "Material de escrita",
    });
  };

  const handleRemoveItem = (index: number) => {
    onUpdateItems(items.filter((_, i) => i !== index));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && newItem.name?.trim()) {
      e.preventDefault();
      handleAddItem();
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="font-display text-xl font-bold text-foreground">
          Adicione os itens da lista
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Digite cada material escolar
        </p>
      </div>

      {/* Add Item Form */}
      <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
        <div className="space-y-2">
          <Label htmlFor="itemName">Nome do item *</Label>
          <Input
            id="itemName"
            placeholder="Ex: Caderno universitário 10 matérias"
            value={newItem.name || ""}
            onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
            onKeyPress={handleKeyPress}
          />
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="space-y-2">
            <Label htmlFor="quantity">Qtd</Label>
            <Input
              id="quantity"
              type="number"
              min={1}
              value={newItem.quantity || 1}
              onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 1 })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="unit">Unidade</Label>
            <Input
              id="unit"
              placeholder="un"
              value={newItem.unit || "un"}
              onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Categoria</Label>
            <select
              id="category"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={newItem.category || ""}
              onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full gap-2"
          onClick={handleAddItem}
          disabled={!newItem.name?.trim()}
        >
          <Plus className="h-4 w-4" />
          Adicionar item
        </Button>
      </div>

      {/* Items List */}
      {items.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              {items.length} {items.length === 1 ? "item" : "itens"} adicionados
            </span>
          </div>
          <div className="max-h-48 space-y-2 overflow-y-auto">
            {items.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between rounded-lg border bg-card p-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.quantity} {item.unit} • {item.category}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => handleRemoveItem(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Finish Button */}
      <Button
        size="lg"
        className="w-full gap-2"
        onClick={onFinish}
        disabled={items.length === 0}
      >
        <Check className="h-4 w-4" />
        Revisar e publicar ({items.length} {items.length === 1 ? "item" : "itens"})
      </Button>
    </div>
  );
}
