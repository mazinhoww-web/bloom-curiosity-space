import { useState, useCallback } from "react";
import { Plus, Trash2, Edit3, Check, X, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ExtractedItem } from "@/hooks/use-public-upload";

const CATEGORIES = [
  "Cadernos",
  "Escrita",
  "Papelaria",
  "Organização",
  "Desenho e Arte",
  "Matemática",
  "Corte e Colagem",
  "Higiene",
  "Outros",
];

interface ManualEntryStepProps {
  items: ExtractedItem[];
  onUpdateItems: (items: ExtractedItem[]) => void;
  onFinish: () => void;
}

export function ManualEntryStep({
  items,
  onUpdateItems,
  onFinish,
}: ManualEntryStepProps) {
  const [newItemName, setNewItemName] = useState("");
  const [newItemQty, setNewItemQty] = useState("1");
  const [newItemCategory, setNewItemCategory] = useState("Outros");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<ExtractedItem | null>(null);

  const handleAddItem = useCallback(() => {
    if (!newItemName.trim()) return;

    const newItem: ExtractedItem = {
      name: newItemName.trim(),
      quantity: parseInt(newItemQty) || 1,
      unit: "un",
      category: newItemCategory,
    };

    onUpdateItems([...items, newItem]);
    setNewItemName("");
    setNewItemQty("1");
  }, [newItemName, newItemQty, newItemCategory, items, onUpdateItems]);

  const handleDeleteItem = useCallback(
    (index: number) => {
      onUpdateItems(items.filter((_, i) => i !== index));
    },
    [items, onUpdateItems]
  );

  const handleEditItem = useCallback((index: number) => {
    setEditingIndex(index);
    setEditForm({ ...items[index] });
  }, [items]);

  const handleSaveEdit = useCallback(() => {
    if (editingIndex === null || !editForm) return;
    const newItems = [...items];
    newItems[editingIndex] = editForm;
    onUpdateItems(newItems);
    setEditingIndex(null);
    setEditForm(null);
  }, [editingIndex, editForm, items, onUpdateItems]);

  const handleCancelEdit = useCallback(() => {
    setEditingIndex(null);
    setEditForm(null);
  }, []);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAddItem();
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
          <Package className="h-8 w-8 text-accent" />
        </div>
        <h2 className="font-display text-2xl font-bold">Adicione os itens</h2>
        <p className="mt-2 text-muted-foreground">
          Digite cada material da lista
        </p>
      </div>

      {/* Add New Item Form */}
      <Card className="border-2 border-dashed border-primary/30 bg-primary/5">
        <CardContent className="p-4 space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="Nome do item (ex: Caderno 96 folhas)"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1"
              autoFocus
            />
            <Input
              type="number"
              min="1"
              value={newItemQty}
              onChange={(e) => setNewItemQty(e.target.value)}
              className="w-16"
              placeholder="Qtd"
            />
          </div>
          <div className="flex gap-2">
            <Select value={newItemCategory} onValueChange={setNewItemCategory}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={handleAddItem}
              disabled={!newItemName.trim()}
              className="gap-1"
            >
              <Plus className="h-4 w-4" />
              Adicionar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Items List */}
      {items.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
            {items.length} {items.length === 1 ? "item adicionado" : "itens adicionados"}
          </p>
          <div className="max-h-64 overflow-y-auto rounded-lg border divide-y">
            {items.map((item, index) => (
              <div key={index} className="p-3 bg-card">
                {editingIndex === index ? (
                  <div className="space-y-2">
                    <Input
                      value={editForm?.name || ""}
                      onChange={(e) =>
                        setEditForm((f) =>
                          f ? { ...f, name: e.target.value } : null
                        )
                      }
                    />
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        min="1"
                        value={editForm?.quantity || 1}
                        onChange={(e) =>
                          setEditForm((f) =>
                            f
                              ? { ...f, quantity: parseInt(e.target.value) || 1 }
                              : null
                          )
                        }
                        className="w-20"
                      />
                      <Select
                        value={editForm?.category || "Outros"}
                        onValueChange={(v) =>
                          setEditForm((f) => (f ? { ...f, category: v } : null))
                        }
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {cat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={handleCancelEdit}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      <Button size="icon" onClick={handleSaveEdit}>
                        <Check className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded bg-muted text-sm font-medium text-primary">
                      {item.quantity}x
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.category}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleEditItem(index)}
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleDeleteItem(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
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

      {items.length === 0 && (
        <p className="text-center text-sm text-muted-foreground">
          Adicione pelo menos um item para continuar
        </p>
      )}
    </div>
  );
}
