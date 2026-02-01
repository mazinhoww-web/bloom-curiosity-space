import { useState, useCallback } from "react";
import { Edit3, Trash2, Plus, Check, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

interface ReviewStepProps {
  items: ExtractedItem[];
  onUpdateItems: (items: ExtractedItem[]) => void;
  onPublish: () => void;
  isPublishing: boolean;
}

export function ReviewStep({
  items,
  onUpdateItems,
  onPublish,
  isPublishing,
}: ReviewStepProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<ExtractedItem | null>(null);

  const handleEdit = useCallback((index: number) => {
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

  const handleDelete = useCallback((index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    onUpdateItems(newItems);
  }, [items, onUpdateItems]);

  const handleAddItem = useCallback(() => {
    const newItem: ExtractedItem = {
      name: "Novo item",
      quantity: 1,
      unit: "un",
      category: "Outros",
    };
    onUpdateItems([...items, newItem]);
    handleEdit(items.length);
  }, [items, onUpdateItems, handleEdit]);

  // Group items by category
  const itemsByCategory = items.reduce((acc, item, index) => {
    const category = item.category || "Outros";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push({ item, index });
    return acc;
  }, {} as Record<string, { item: ExtractedItem; index: number }[]>);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Edit3 className="h-8 w-8 text-primary" />
        </div>
        <h2 className="font-display text-2xl font-bold">Revise os itens</h2>
        <p className="mt-2 text-muted-foreground">
          {items.length} itens encontrados. Edite se necessário.
        </p>
      </div>

      {/* Items by Category */}
      <div className="space-y-4">
        {Object.entries(itemsByCategory).map(([category, categoryItems]) => (
          <Card key={category}>
            <CardHeader className="py-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Package className="h-4 w-4" />
                {category}
                <Badge variant="secondary" className="ml-auto">
                  {categoryItems.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="divide-y p-0">
              {categoryItems.map(({ item, index }) => (
                <div key={index} className="p-3">
                  {editingIndex === index ? (
                    // Edit mode
                    <div className="space-y-3">
                      <Input
                        value={editForm?.name || ""}
                        onChange={(e) =>
                          setEditForm((f) => f ? { ...f, name: e.target.value } : null)
                        }
                        placeholder="Nome do item"
                      />
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          min={1}
                          value={editForm?.quantity || 1}
                          onChange={(e) =>
                            setEditForm((f) =>
                              f ? { ...f, quantity: parseInt(e.target.value) || 1 } : null
                            )
                          }
                          className="w-20"
                        />
                        <Input
                          value={editForm?.unit || "un"}
                          onChange={(e) =>
                            setEditForm((f) => f ? { ...f, unit: e.target.value } : null)
                          }
                          placeholder="Unidade"
                          className="w-24"
                        />
                        <Select
                          value={editForm?.category || "Outros"}
                          onValueChange={(v) =>
                            setEditForm((f) => f ? { ...f, category: v } : null)
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
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={handleCancelEdit}
                        >
                          Cancelar
                        </Button>
                        <Button
                          size="sm"
                          className="flex-1 gap-1"
                          onClick={handleSaveEdit}
                        >
                          <Check className="h-3 w-3" />
                          Salvar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // View mode
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <p className="font-medium">
                          <span className="text-primary">{item.quantity}x</span>{" "}
                          {item.name}
                        </p>
                        {item.brand_suggestion && (
                          <p className="text-sm text-muted-foreground">
                            Marca sugerida: {item.brand_suggestion}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleEdit(index)}
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add Item Button */}
      <Button
        variant="outline"
        className="w-full gap-2"
        onClick={handleAddItem}
      >
        <Plus className="h-4 w-4" />
        Adicionar item
      </Button>

      {/* Publish Button */}
      <Button
        size="lg"
        className="w-full gap-2"
        onClick={onPublish}
        disabled={items.length === 0 || isPublishing}
      >
        {isPublishing ? (
          <>Publicando...</>
        ) : (
          <>
            <Check className="h-4 w-4" />
            Publicar lista ({items.length} itens)
          </>
        )}
      </Button>
    </div>
  );
}
