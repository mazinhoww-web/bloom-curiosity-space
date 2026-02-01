import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, ChevronsUpDown, School, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";

interface ManagedSchool {
  school_id: string;
  school_name: string;
  school_slug: string;
  role: string;
  created_at: string;
}

export function SchoolSwitcher() {
  const { user, schoolId } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  // Fetch schools managed by the user
  const { data: managedSchools, isLoading } = useQuery({
    queryKey: ["managed-schools", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase.rpc("get_user_managed_schools", {
        p_user_id: user.id,
      });
      if (error) throw error;
      return (data as ManagedSchool[]) || [];
    },
    enabled: !!user?.id,
  });

  const currentSchool = managedSchools?.find((s) => s.school_id === schoolId);
  const hasMultipleSchools = (managedSchools?.length || 0) > 1;

  // If user only has one school, don't show the switcher
  if (!hasMultipleSchools && !isLoading) {
    return null;
  }

  if (isLoading) {
    return <Skeleton className="h-10 w-48" />;
  }

  const handleSchoolChange = (school: ManagedSchool) => {
    // For now, we'll navigate to a route with the school context
    // In a full implementation, this would update the AuthContext
    window.location.href = `/escola-admin?school=${school.school_id}`;
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label="Selecionar escola"
          className="w-full justify-between gap-2"
        >
          <div className="flex items-center gap-2 truncate">
            <School className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="truncate">
              {currentSchool?.school_name || "Selecionar escola"}
            </span>
          </div>
          <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar escola..." />
          <CommandList>
            <CommandEmpty>Nenhuma escola encontrada.</CommandEmpty>
            <CommandGroup heading="Suas escolas">
              {managedSchools?.map((school) => (
                <CommandItem
                  key={school.school_id}
                  onSelect={() => handleSchoolChange(school)}
                  className="cursor-pointer"
                >
                  <School className="mr-2 h-4 w-4" />
                  <div className="flex flex-col">
                    <span className="truncate">{school.school_name}</span>
                    <span className="text-xs text-muted-foreground">
                      {school.role === "school_admin" ? "Administrador" : "Editor"}
                    </span>
                  </div>
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4",
                      schoolId === school.school_id ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup>
              <CommandItem
                onSelect={() => {
                  navigate("/escolas");
                  setOpen(false);
                }}
                className="cursor-pointer"
              >
                <Plus className="mr-2 h-4 w-4" />
                Reivindicar outra escola
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
