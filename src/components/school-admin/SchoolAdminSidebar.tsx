import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  Eye,
  LogOut,
  GraduationCap,
  School,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const menuItems = [
  {
    title: "Dashboard",
    url: "/escola-admin",
    icon: LayoutDashboard,
  },
  {
    title: "Listas de Materiais",
    url: "/escola-admin/listas",
    icon: FileText,
  },
  {
    title: "Preview Público",
    url: "/escola-admin/preview",
    icon: Eye,
  },
];

export function SchoolAdminSidebar() {
  const location = useLocation();
  const { signOut, user, schoolId } = useAuth();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  // Fetch school name
  const { data: school } = useQuery({
    queryKey: ["school-admin-school", schoolId],
    queryFn: async () => {
      if (!schoolId) return null;
      const { data, error } = await supabase
        .from("schools")
        .select("name, slug")
        .eq("id", schoolId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!schoolId,
  });

  const isActive = (path: string) => {
    if (path === "/escola-admin") {
      return location.pathname === "/escola-admin";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader className="border-b p-4">
        <Link to="/escola-admin" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary shadow-fun">
            <School className="h-5 w-5 text-secondary-foreground" />
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <span className="block truncate font-display text-sm font-bold text-foreground">
                {school?.name || "Minha Escola"}
              </span>
              <p className="text-xs text-muted-foreground">Painel da Escola</p>
            </div>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                  >
                    <Link to={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-4">
        {!collapsed && user && (
          <p className="mb-2 truncate text-xs text-muted-foreground">
            {user.email}
          </p>
        )}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size={collapsed ? "icon" : "sm"}
            className={cn("gap-2", collapsed ? "w-full" : "")}
            onClick={signOut}
          >
            <LogOut className="h-4 w-4" />
            {!collapsed && "Sair"}
          </Button>
          {!collapsed && school?.slug && (
            <Link to={`/escola/${school.slug}`} target="_blank">
              <Button variant="ghost" size="sm">
                Ver página
              </Button>
            </Link>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
