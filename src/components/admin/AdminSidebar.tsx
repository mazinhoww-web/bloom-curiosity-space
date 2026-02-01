import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  School,
  FileText,
  BarChart3,
  Users,
  LogOut,
  GraduationCap,
  Menu,
  ClipboardCheck,
  Settings,
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
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

const menuItems = [
  {
    title: "Dashboard",
    url: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "Escolas",
    url: "/admin/escolas",
    icon: School,
  },
  {
    title: "Listas de Materiais",
    url: "/admin/listas",
    icon: FileText,
  },
  {
    title: "Requisições",
    url: "/admin/requisicoes",
    icon: ClipboardCheck,
  },
  {
    title: "Analytics",
    url: "/admin/analytics",
    icon: BarChart3,
  },
  {
    title: "Leads",
    url: "/admin/leads",
    icon: Users,
  },
  {
    title: "Configurações",
    url: "/admin/configuracoes",
    icon: Settings,
  },
];

export function AdminSidebar() {
  const location = useLocation();
  const { signOut, user } = useAuth();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  const isActive = (path: string) => {
    if (path === "/admin") {
      return location.pathname === "/admin";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader className="border-b p-4">
        <Link to="/admin" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-fun">
            <GraduationCap className="h-5 w-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div>
              <span className="font-display text-lg font-bold text-foreground">
                Lista Escolar
              </span>
              <p className="text-xs text-muted-foreground">Admin</p>
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
          {!collapsed && (
            <Link to="/">
              <Button variant="ghost" size="sm">
                Ver site
              </Button>
            </Link>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
