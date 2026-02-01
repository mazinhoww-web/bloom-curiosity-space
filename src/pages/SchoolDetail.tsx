import { useState, useMemo, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { 
  School as SchoolIcon, 
  MapPin, 
  Phone, 
  Mail, 
  ArrowLeft,
  Share2,
  ShoppingCart,
  ExternalLink,
  Check,
  Copy,
  Plus,
  Minus,
  CheckCircle2
} from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { useCart, CartItem } from "@/hooks/use-cart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  School, 
  Grade, 
  MaterialList, 
  MaterialItem, 
  MaterialCategory 
} from "@/types/database";
import { useAnalytics } from "@/hooks/use-analytics";
import { useOwnedItems } from "@/hooks/use-owned-items";
interface MaterialItemWithCategory extends MaterialItem {
  material_categories: MaterialCategory | null;
}

interface MaterialListWithGrade extends MaterialList {
  grades: Grade;
  material_items: MaterialItemWithCategory[];
  is_official?: boolean;
}

export default function SchoolDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { toast } = useToast();
  const [selectedGradeId, setSelectedGradeId] = useState<string>("");
  const [copiedLink, setCopiedLink] = useState(false);
  const { trackSchoolView, trackListView } = useAnalytics();
  const { isInCart, toggleItem, addItem } = useCart();
  const { isOwned, toggleOwned, ownedCount, getShareableUrl, updateUrlWithOwned } = useOwnedItems();

  // Fetch school
  const { data: school, isLoading: isLoadingSchool } = useQuery({
    queryKey: ["school", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("schools")
        .select("*")
        .eq("slug", slug)
        .eq("is_active", true)
        .single();
      
      if (error) throw error;
      return data as School;
    },
    enabled: !!slug,
  });

  // Fetch grades
  const { data: grades } = useQuery({
    queryKey: ["grades"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("grades")
        .select("*")
        .order("order_index");
      
      if (error) throw error;
      return data as Grade[];
    },
  });

  // Fetch lists with items for this school
  const { data: lists, isLoading: isLoadingLists } = useQuery({
    queryKey: ["school-lists", school?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("material_lists")
        .select(`
          *,
          grades (*),
          material_items (
            *,
            material_categories (*)
          )
        `)
        .eq("school_id", school!.id)
        .eq("is_active", true)
        .order("year", { ascending: false });
      
      if (error) throw error;
      return data as MaterialListWithGrade[];
    },
    enabled: !!school?.id,
  });

  // Get available grades for this school
  const availableGrades = useMemo(() => {
    if (!lists || !grades) return [];
    const gradeIds = new Set(lists.map((list) => list.grade_id));
    return grades.filter((g) => gradeIds.has(g.id));
  }, [lists, grades]);

  // Get selected list
  const selectedList = useMemo(() => {
    if (!lists || !selectedGradeId) return null;
    return lists.find((list) => list.grade_id === selectedGradeId);
  }, [lists, selectedGradeId]);

  // Track school view when school loads
  useEffect(() => {
    if (school?.id) {
      trackSchoolView(school.id);
    }
  }, [school?.id, trackSchoolView]);

  // Track list view when a grade is selected
  useEffect(() => {
    if (selectedList && school?.id) {
      trackListView(selectedList.id, school.id, selectedList.grade_id);
    }
  }, [selectedList?.id, school?.id, trackListView]);

  // Group items by category
  const itemsByCategory = useMemo(() => {
    if (!selectedList?.material_items) return {};
    return selectedList.material_items.reduce((acc, item) => {
      const categoryName = item.material_categories?.name || "Outros";
      if (!acc[categoryName]) {
        acc[categoryName] = {
          category: item.material_categories,
          items: [],
        };
      }
      acc[categoryName].items.push(item);
      return acc;
    }, {} as Record<string, { category: MaterialCategory | null; items: MaterialItemWithCategory[] }>);
  }, [selectedList]);

  // Calculate totals (excluding owned items)
  const { totalEstimate, essentialCount, optionalCount, hasAnyPrice } = useMemo(() => {
    if (!selectedList?.material_items) return { totalEstimate: 0, essentialCount: 0, optionalCount: 0, hasAnyPrice: false };
    
    const items = selectedList.material_items;
    const essentialCount = items.filter(i => i.is_required !== false).length;
    const optionalCount = items.filter(i => i.is_required === false).length;
    const hasAnyPrice = items.some(i => i.price_estimate && i.price_estimate > 0);
    
    const totalEstimate = items
      .filter((item) => !isOwned(item.id))
      .reduce((sum, item) => {
        return sum + (item.price_estimate || 0) * (item.quantity || 1);
      }, 0);
      
    return { totalEstimate, essentialCount, optionalCount, hasAnyPrice };
  }, [selectedList, isOwned]);

  // Track purchase click
  const handlePurchaseClick = async (item: MaterialItem) => {
    if (!item.purchase_url || !school || !selectedList) return;

    try {
      await supabase.from("purchase_events").insert({
        item_id: item.id,
        list_id: selectedList.id,
        school_id: school.id,
        user_agent: navigator.userAgent,
        referrer: document.referrer,
      });
    } catch (error) {
      console.error("Failed to track purchase click:", error);
    }

    window.open(item.purchase_url, "_blank");
  };

  // Share functions - include owned items in URL
  const shareUrl = getShareableUrl(window.location.origin + window.location.pathname + (selectedGradeId ? `?grade=${selectedGradeId}` : ""));
  const shareText = school 
    ? `Confira a lista de materiais da ${school.name}${selectedGradeId ? ` - ${availableGrades.find(g => g.id === selectedGradeId)?.name}` : ""}${ownedCount > 0 ? ` (${ownedCount} itens já tenho)` : ""}` 
    : "";

  const handleShareWhatsApp = async () => {
    if (!school || !selectedList) return;

    try {
      await supabase.from("share_events").insert({
        list_id: selectedList.id,
        school_id: school.id,
        share_type: "whatsapp",
      });
    } catch (error) {
      console.error("Failed to track share:", error);
    }

    const url = `https://wa.me/?text=${encodeURIComponent(`${shareText}\n${shareUrl}`)}`;
    window.open(url, "_blank");
  };

  const handleCopyLink = async () => {
    if (!school || !selectedList) return;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);

      await supabase.from("share_events").insert({
        list_id: selectedList.id,
        school_id: school.id,
        share_type: "copy_link",
      });

      toast({
        title: "Link copiado!",
        description: "Agora você pode compartilhar com outros pais.",
      });
    } catch (error) {
      console.error("Failed to copy link:", error);
    }
  };

  if (isLoadingSchool) {
    return (
      <MainLayout>
        <div className="container py-8">
          <Skeleton className="mb-4 h-8 w-32" />
          <Skeleton className="mb-6 h-12 w-3/4" />
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Skeleton className="h-96 rounded-2xl" />
            </div>
            <Skeleton className="h-64 rounded-2xl" />
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!school) {
    return (
      <MainLayout>
        <div className="container py-16 text-center">
          <SchoolIcon className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
          <h1 className="mb-2 font-display text-2xl font-bold">Escola não encontrada</h1>
          <p className="mb-6 text-muted-foreground">
            A escola que você está procurando não existe ou foi desativada.
          </p>
          <Link to="/escolas">
            <Button>Ver todas as escolas</Button>
          </Link>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container py-8">
        {/* Back link */}
        <Link 
          to="/escolas" 
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para escolas
        </Link>

        {/* School header */}
        <div className="mb-8">
          <div className="mb-4 flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-fun">
              <SchoolIcon className="h-8 w-8 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-foreground md:text-3xl">
                {school.name}
              </h1>
              <div className="mt-1 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                {(school.city || school.state) && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {school.address || `${school.city}, ${school.state}`}
                  </span>
                )}
                {school.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-4 w-4" />
                    {school.phone}
                  </span>
                )}
                {school.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    {school.email}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main content */}
          <div className="lg:col-span-2">
            {/* Grade selector */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="font-display text-lg">Selecione a série</CardTitle>
              </CardHeader>
              <CardContent>
                {availableGrades.length > 0 ? (
                  <Select value={selectedGradeId} onValueChange={setSelectedGradeId}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Escolha a série do seu filho" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableGrades.map((grade) => (
                        <SelectItem key={grade.id} value={grade.id}>
                          {grade.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-muted-foreground">
                    Nenhuma lista de materiais disponível para esta escola.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Official badge + Cost summary + Add all button */}
            {selectedList && (
              <div className="space-y-6">
                {/* Official List Banner */}
                {(selectedList as any).is_official && (
                  <div className="rounded-xl border-2 border-success bg-gradient-to-r from-success/10 to-success/5 p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success text-success-foreground">
                        <Check className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-display font-semibold text-success">Lista Oficial da Escola</h3>
                        <p className="text-sm text-muted-foreground">
                          Esta é a lista oficial de materiais para {selectedList.grades?.name}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Cost Summary Card */}
                <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
                  <CardContent className="p-4">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">
                          {hasAnyPrice ? "Valor estimado da lista" : "Total de itens"}
                        </p>
                        {hasAnyPrice ? (
                          <p className="font-display text-2xl font-bold text-primary">
                            R$ {totalEstimate.toFixed(2)}
                            {ownedCount > 0 && (
                              <span className="ml-2 text-sm font-normal text-muted-foreground">
                                (já tenho {ownedCount})
                              </span>
                            )}
                          </p>
                        ) : (
                          <p className="font-display text-2xl font-bold text-foreground">
                            {selectedList.material_items?.length || 0} itens
                          </p>
                        )}
                        <div className="flex flex-wrap gap-2 pt-1">
                          {essentialCount > 0 && (
                            <Badge className="bg-primary/10 text-primary border-primary/20">
                              {essentialCount} essenciais
                            </Badge>
                          )}
                          {optionalCount > 0 && (
                            <Badge variant="outline" className="text-muted-foreground">
                              {optionalCount} opcionais
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Button
                        size="lg"
                        className="gap-2"
                        onClick={() => {
                          if (!selectedList?.material_items || !school) return;
                          let addedCount = 0;
                          selectedList.material_items.forEach((item) => {
                            if (!isInCart(item.id) && !isOwned(item.id)) {
                              addItem({
                                id: item.id,
                                name: item.name,
                                quantity: item.quantity || 1,
                                unit: item.unit,
                                price_estimate: item.price_estimate,
                                purchase_url: item.purchase_url,
                                brand_suggestion: item.brand_suggestion,
                                schoolId: school.id,
                                schoolName: school.name,
                                gradeName: selectedList.grades?.name || "",
                              });
                              addedCount++;
                            }
                          });
                          toast({
                            title: "Itens adicionados ao carrinho",
                            description: `${addedCount} itens foram adicionados.`,
                          });
                        }}
                      >
                        <ShoppingCart className="h-5 w-5" />
                        Adicionar Todos ao Carrinho
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                {Object.entries(itemsByCategory).map(([categoryName, { category, items }]) => (
                  <Card key={categoryName} className="overflow-hidden">
                    <CardHeader className="bg-muted/50">
                      <CardTitle className="flex items-center gap-2 font-display text-lg">
                        <div 
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: category?.color || "#6B7280" }}
                        />
                        {categoryName}
                        <Badge variant="secondary" className="ml-auto">
                          {items.length} {items.length === 1 ? "item" : "itens"}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="divide-y p-0">
                      {items.map((item) => {
                        const itemOwned = isOwned(item.id);
                        return (
                          <div 
                            key={item.id} 
                            className={`flex items-center gap-3 p-4 transition-colors ${
                              itemOwned ? "bg-muted/50" : ""
                            }`}
                          >
                            {/* Checkbox "Já tenho" */}
                            <div className="flex items-center">
                              <Checkbox
                                id={`owned-list-${item.id}`}
                                checked={itemOwned}
                                onCheckedChange={() => toggleOwned(item.id)}
                                aria-label="Já tenho este item"
                              />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`font-medium ${itemOwned ? "line-through text-muted-foreground" : "text-foreground"}`}>
                                  {item.quantity}x {item.name}
                                </span>
                                {item.is_required !== false ? (
                                  <Badge className="text-xs bg-primary/10 text-primary border-primary/20">
                                    Essencial
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-xs text-muted-foreground">
                                    Opcional
                                  </Badge>
                                )}
                                {itemOwned && (
                                  <Badge variant="secondary" className="text-xs gap-1 bg-success/10 text-success border-success/20">
                                    <CheckCircle2 className="h-3 w-3" />
                                    Já tenho
                                  </Badge>
                                )}
                              </div>
                              {item.description && (
                                <p className="mt-1 text-sm text-muted-foreground">
                                  {item.description}
                                </p>
                              )}
                              {item.brand_suggestion && (
                                <p className="mt-1 text-xs text-muted-foreground">
                                  Sugestão: {item.brand_suggestion}
                                </p>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {!itemOwned && item.price_estimate && (
                                <span className="text-sm font-medium text-foreground">
                                  R$ {(item.price_estimate * (item.quantity || 1)).toFixed(2)}
                                </span>
                              )}
                              {!itemOwned && (
                                <Button
                                  size="sm"
                                  variant={isInCart(item.id) ? "default" : "outline"}
                                  className="gap-1"
                                  onClick={() => {
                                    const cartItem: CartItem = {
                                      id: item.id,
                                      name: item.name,
                                      quantity: item.quantity || 1,
                                      unit: item.unit,
                                      price_estimate: item.price_estimate,
                                      purchase_url: item.purchase_url,
                                      brand_suggestion: item.brand_suggestion,
                                      schoolId: school!.id,
                                      schoolName: school!.name,
                                      gradeName: selectedList!.grades?.name || "",
                                    };
                                    toggleItem(cartItem);
                                  }}
                                >
                                  {isInCart(item.id) ? (
                                    <>
                                      <Check className="h-4 w-4" />
                                      <span className="hidden sm:inline">Adicionado</span>
                                    </>
                                  ) : (
                                    <>
                                      <Plus className="h-4 w-4" />
                                      <span className="hidden sm:inline">Adicionar</span>
                                    </>
                                  )}
                                </Button>
                              )}
                              {!itemOwned && item.purchase_url && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="gap-1"
                                  onClick={() => handlePurchaseClick(item)}
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {!selectedGradeId && availableGrades.length > 0 && (
              <Card className="border-dashed">
                <CardContent className="py-12 text-center">
                  <SchoolIcon className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                  <h3 className="mb-2 font-display text-lg font-semibold">
                    Selecione uma série
                  </h3>
                  <p className="text-muted-foreground">
                    Escolha a série acima para visualizar a lista de materiais.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Summary card */}
            {selectedList && (
              <Card className="sticky top-24 border-2">
                <CardHeader className="pb-3">
                  <CardTitle className="font-display text-lg">Resumo da Lista</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Série:</span>
                    <span className="font-medium">{selectedList.grades?.name}</span>
                  </div>
                  
                  {/* Items breakdown */}
                  <div className="rounded-lg bg-muted/50 p-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Itens essenciais:</span>
                      <span className="font-medium text-primary">{essentialCount}</span>
                    </div>
                    {optionalCount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Itens opcionais:</span>
                        <span className="font-medium">{optionalCount}</span>
                      </div>
                    )}
                    {ownedCount > 0 && (
                      <div className="flex justify-between text-sm border-t border-border/50 pt-2 mt-2">
                        <span className="text-muted-foreground">Já tenho:</span>
                        <span className="font-medium text-success">✓ {ownedCount}</span>
                      </div>
                    )}
                  </div>

                  {/* Cost summary */}
                  <div className="rounded-lg border-2 border-primary/20 bg-primary/5 p-4">
                    {hasAnyPrice ? (
                      <>
                        <p className="text-xs text-muted-foreground mb-1">
                          {ownedCount > 0 ? "Valor estimado restante" : "Valor estimado total"}
                        </p>
                        <p className="font-display text-2xl font-bold text-primary">
                          R$ {totalEstimate.toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          *Preços podem variar conforme a loja
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-xs text-muted-foreground mb-1">Total de itens</p>
                        <p className="font-display text-2xl font-bold text-foreground">
                          {(selectedList.material_items?.length || 0) - ownedCount} itens
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          para comprar
                        </p>
                      </>
                    )}
                  </div>

                  <div className="border-t pt-4">
                    <p className="mb-3 text-sm font-medium">Compartilhar lista:</p>
                    <div className="flex gap-2">
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
                        {copiedLink ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                        {copiedLink ? "Copiado!" : "Copiar"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
