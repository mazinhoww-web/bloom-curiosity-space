import { Shield, CheckCircle2, AlertTriangle, FileEdit } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type ListStatus = "draft" | "published" | "flagged" | "official";

interface ListStatusBadgeProps {
  status: ListStatus;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
  className?: string;
}

const statusConfig: Record<ListStatus, {
  label: string;
  userLabel: string;
  icon: typeof Shield;
  variant: "default" | "secondary" | "destructive" | "outline";
  className: string;
}> = {
  official: {
    label: "Oficial",
    userLabel: "Lista Oficial da Escola",
    icon: Shield,
    variant: "default",
    className: "bg-success text-success-foreground hover:bg-success/90",
  },
  published: {
    label: "Publicada",
    userLabel: "Lista Revisada",
    icon: CheckCircle2,
    variant: "secondary",
    className: "bg-primary/10 text-primary hover:bg-primary/20",
  },
  flagged: {
    label: "Sinalizada",
    userLabel: "Em Revisão",
    icon: AlertTriangle,
    variant: "outline",
    className: "border-warning text-warning",
  },
  draft: {
    label: "Rascunho",
    userLabel: "Rascunho",
    icon: FileEdit,
    variant: "outline",
    className: "text-muted-foreground",
  },
};

export function ListStatusBadge({
  status,
  size = "md",
  showIcon = true,
  className,
}: ListStatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-0.5",
    lg: "text-base px-3 py-1",
  };

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-3.5 w-3.5",
    lg: "h-4 w-4",
  };

  return (
    <Badge
      variant={config.variant}
      className={cn(
        "gap-1 font-medium",
        sizeClasses[size],
        config.className,
        className
      )}
    >
      {showIcon && <Icon className={iconSizes[size]} />}
      {config.label}
    </Badge>
  );
}

// User-facing banner component for official/published lists
interface ListStatusBannerProps {
  status: ListStatus;
  gradeName?: string;
  className?: string;
}

export function ListStatusBanner({
  status,
  gradeName,
  className,
}: ListStatusBannerProps) {
  if (status === "draft" || status === "flagged") return null;

  const config = statusConfig[status];
  const Icon = config.icon;

  if (status === "official") {
    return (
      <div
        className={cn(
          "rounded-xl border-2 border-success bg-gradient-to-r from-success/10 to-success/5 p-4",
          className
        )}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success text-success-foreground">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-success">
              {config.userLabel}
            </h3>
            {gradeName && (
              <p className="text-sm text-muted-foreground">
                Esta é a lista oficial de materiais para {gradeName}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (status === "published") {
    return (
      <div
        className={cn(
          "rounded-xl border border-primary/20 bg-primary/5 p-3",
          className
        )}
      >
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-primary">
            {config.userLabel}
          </span>
        </div>
      </div>
    );
  }

  return null;
}
