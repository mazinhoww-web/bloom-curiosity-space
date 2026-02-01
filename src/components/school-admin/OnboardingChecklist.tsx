import { CheckCircle2, Circle, ArrowRight, Sparkles, FileText, Shield, ClipboardCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface OnboardingChecklistProps {
  hasLists: boolean;
  hasOfficialList: boolean;
  hasItemsReviewed: boolean; // At least one list with items
  schoolSlug?: string;
}

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  icon: React.ElementType;
  action?: {
    label: string;
    to: string;
  };
}

export function OnboardingChecklist({
  hasLists,
  hasOfficialList,
  hasItemsReviewed,
  schoolSlug,
}: OnboardingChecklistProps) {
  const items: ChecklistItem[] = [
    {
      id: "create-list",
      title: "Criar sua primeira lista",
      description: "Crie uma lista de materiais para uma série",
      completed: hasLists,
      icon: FileText,
      action: !hasLists
        ? { label: "Criar Lista", to: "/escola-admin/listas" }
        : undefined,
    },
    {
      id: "add-items",
      title: "Adicionar itens à lista",
      description: "Revise e adicione os materiais necessários",
      completed: hasItemsReviewed,
      icon: ClipboardCheck,
      action: hasLists && !hasItemsReviewed
        ? { label: "Adicionar Itens", to: "/escola-admin/listas" }
        : undefined,
    },
    {
      id: "mark-official",
      title: "Marcar lista como oficial",
      description: "Destaque a lista oficial para os pais",
      completed: hasOfficialList,
      icon: Shield,
      action: hasItemsReviewed && !hasOfficialList
        ? { label: "Marcar Oficial", to: "/escola-admin/listas" }
        : undefined,
    },
  ];

  const completedCount = items.filter((i) => i.completed).length;
  const totalCount = items.length;
  const progressPercent = (completedCount / totalCount) * 100;
  const isComplete = completedCount === totalCount;

  if (isComplete) {
    return null; // Hide checklist when complete
  }

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="font-display text-lg">
                Bem-vindo! Vamos começar
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Complete os passos abaixo para publicar sua lista oficial
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-primary">
              {completedCount}/{totalCount}
            </p>
            <p className="text-xs text-muted-foreground">concluído</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress bar */}
        <div className="space-y-1">
          <Progress value={progressPercent} className="h-2" />
          <p className="text-xs text-muted-foreground text-right">
            {Math.round(progressPercent)}% completo
          </p>
        </div>

        {/* Checklist items */}
        <div className="space-y-3">
          {items.map((item, index) => {
            const Icon = item.icon;
            const isNext = !item.completed && items.slice(0, index).every((i) => i.completed);

            return (
              <div
                key={item.id}
                className={cn(
                  "flex items-center gap-3 rounded-lg border p-3 transition-all",
                  item.completed
                    ? "border-success/30 bg-success/5"
                    : isNext
                    ? "border-primary/30 bg-primary/5"
                    : "border-muted bg-muted/30 opacity-60"
                )}
              >
                {/* Status icon */}
                <div
                  className={cn(
                    "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full",
                    item.completed
                      ? "bg-success text-success-foreground"
                      : isNext
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {item.completed ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <Icon className="h-4 w-4" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      "font-medium",
                      item.completed && "text-success line-through"
                    )}
                  >
                    {item.title}
                  </p>
                  <p className="text-sm text-muted-foreground truncate">
                    {item.description}
                  </p>
                </div>

                {/* Action button */}
                {item.action && (
                  <Link to={item.action.to}>
                    <Button size="sm" className="gap-1 flex-shrink-0">
                      {item.action.label}
                      <ArrowRight className="h-3 w-3" />
                    </Button>
                  </Link>
                )}

                {/* Completed badge */}
                {item.completed && (
                  <span className="text-xs font-medium text-success flex-shrink-0">
                    ✓ Feito
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* View public page hint */}
        {hasOfficialList && schoolSlug && (
          <div className="rounded-lg border border-success/30 bg-success/5 p-3 text-center">
            <p className="text-sm text-success font-medium">
              🎉 Parabéns! Sua lista oficial está publicada.
            </p>
            <Link to={`/escola/${schoolSlug}`} target="_blank">
              <Button variant="link" size="sm" className="text-success">
                Ver página pública →
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
