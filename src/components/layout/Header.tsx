/**
 * Header Component - Main Navigation
 * 
 * PERSONA ROUTING:
 * - Para Pais: / (Index), /escolas, /escola/:slug, /contribuir
 * - Para Escolas: /instituicoes, /escola-admin/*
 * - Para Lojas: /parceiros
 * - Para Marcas: /parceiros (marcas)
 */

import { Link, useNavigate } from "react-router-dom";
import { BookOpen, Menu, X, Upload, Users, Building2, Store, Tag, LogIn, LogOut, Settings, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, isAdmin, isSchoolAdmin, isPartner, signOut, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
    setIsMenuOpen(false);
  };

  const getUserInitials = () => {
    if (!user?.email) return "U";
    return user.email.charAt(0).toUpperCase();
  };

  const getPrimaryDashboard = () => {
    if (isAdmin) return { path: "/admin", label: "Painel Admin", icon: Settings };
    if (isSchoolAdmin) return { path: "/escola-admin", label: "Painel Escola", icon: Building2 };
    if (isPartner) return { path: "/parceiros", label: "Área do Parceiro", icon: Store };
    return { path: "/", label: "Início", icon: LayoutDashboard };
  };

  const primaryDashboard = getPrimaryDashboard();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-fun">
            <BookOpen className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-display text-xl font-bold text-foreground">
            Lista <span className="text-primary">Escolar</span>
          </span>
        </Link>

        {/* Desktop Navigation - Personas diretas */}
        <nav className="hidden items-center gap-1 md:flex">
          <Link 
            to="/" 
            className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-primary flex items-center gap-1.5"
          >
            <Users className="h-4 w-4" />
            Para Pais
          </Link>
          
          <Link 
            to="/instituicoes" 
            className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-primary flex items-center gap-1.5"
          >
            <Building2 className="h-4 w-4" />
            Para Escolas
          </Link>
          
          <Link 
            to="/parceiros" 
            className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-primary flex items-center gap-1.5"
          >
            <Store className="h-4 w-4" />
            Para Lojas
          </Link>
          
          <Link 
            to="/marcas" 
            className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-primary flex items-center gap-1.5"
          >
            <Tag className="h-4 w-4" />
            Para Marcas
          </Link>

          <div className="mx-2 h-6 w-px bg-border" />

          <Link to="/contribuir">
            <Button variant="default" size="sm" className="gap-1">
              <Upload className="h-4 w-4" />
              Contribuir
            </Button>
          </Link>

          {/* Auth Section - Desktop */}
          {isLoading ? (
            <Button variant="outline" size="sm" disabled className="gap-1">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            </Button>
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden lg:inline max-w-[120px] truncate">
                    {user.email?.split('@')[0]}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{user.email}</p>
                  <p className="text-xs text-muted-foreground">
                    {isAdmin ? "Administrador" : isSchoolAdmin ? "Admin Escola" : isPartner ? "Parceiro" : "Usuário"}
                  </p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to={primaryDashboard.path} className="flex items-center gap-2 cursor-pointer">
                    <primaryDashboard.icon className="h-4 w-4" />
                    {primaryDashboard.label}
                  </Link>
                </DropdownMenuItem>
                {isAdmin && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link to="/admin/escolas" className="flex items-center gap-2 cursor-pointer">
                        <Building2 className="h-4 w-4" />
                        Gerenciar Escolas
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/admin/listas" className="flex items-center gap-2 cursor-pointer">
                        <LayoutDashboard className="h-4 w-4" />
                        Gerenciar Listas
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
                {isSchoolAdmin && (
                  <DropdownMenuItem asChild>
                    <Link to="/escola-admin/listas" className="flex items-center gap-2 cursor-pointer">
                      <LayoutDashboard className="h-4 w-4" />
                      Minhas Listas
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive cursor-pointer">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link to="/auth">
              <Button variant="outline" size="sm" className="gap-1">
                <LogIn className="h-4 w-4" />
                Entrar
              </Button>
            </Link>
          )}

          <CartDrawer />
        </nav>

        {/* Mobile Cart + Menu */}
        <div className="flex items-center gap-2 md:hidden">
          <CartDrawer />
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <nav className="border-t bg-card p-4 md:hidden">
          <div className="flex flex-col gap-1">
            {/* User Info - Mobile */}
            {user && (
              <>
                <div className="rounded-lg px-3 py-3 bg-muted/50 mb-2">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {getUserInitials()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm truncate max-w-[200px]">{user.email}</p>
                      <p className="text-xs text-muted-foreground">
                        {isAdmin ? "Administrador" : isSchoolAdmin ? "Admin Escola" : isPartner ? "Parceiro" : "Usuário"}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Dashboard Link based on role */}
                <Link 
                  to={primaryDashboard.path}
                  className="rounded-lg px-3 py-3 text-sm font-medium transition-colors bg-primary/10 text-primary flex items-center gap-3"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20">
                    <primaryDashboard.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{primaryDashboard.label}</p>
                    <p className="text-xs text-muted-foreground">Acessar seu painel</p>
                  </div>
                </Link>

                <div className="my-2 border-t" />
              </>
            )}

            {/* Personas principais */}
            <Link 
              to="/" 
              className="rounded-lg px-3 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted flex items-center gap-3"
              onClick={() => setIsMenuOpen(false)}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <Users className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="font-medium">Para Pais</p>
                <p className="text-xs text-muted-foreground">Encontre listas de materiais</p>
              </div>
            </Link>
            
            <Link 
              to="/instituicoes" 
              className="rounded-lg px-3 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted flex items-center gap-3"
              onClick={() => setIsMenuOpen(false)}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary/10">
                <Building2 className="h-4 w-4 text-secondary" />
              </div>
              <div>
                <p className="font-medium">Para Escolas</p>
                <p className="text-xs text-muted-foreground">Publique listas oficiais</p>
              </div>
            </Link>
            
            <Link 
              to="/parceiros" 
              className="rounded-lg px-3 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted flex items-center gap-3"
              onClick={() => setIsMenuOpen(false)}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10">
                <Store className="h-4 w-4 text-accent" />
              </div>
              <div>
                <p className="font-medium">Para Lojas</p>
                <p className="text-xs text-muted-foreground">Gere vendas e tráfego</p>
              </div>
            </Link>
            
            <Link 
              to="/marcas" 
              className="rounded-lg px-3 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted flex items-center gap-3"
              onClick={() => setIsMenuOpen(false)}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <Tag className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="font-medium">Para Marcas</p>
                <p className="text-xs text-muted-foreground">Aumente sua visibilidade</p>
              </div>
            </Link>
            
            <div className="my-3 border-t" />
            
            {/* CTA Contribuir */}
            <Link 
              to="/contribuir" 
              className="rounded-lg px-3 py-3 text-sm font-medium transition-colors bg-primary text-primary-foreground flex items-center justify-center gap-2"
              onClick={() => setIsMenuOpen(false)}
            >
              <Upload className="h-4 w-4" />
              Contribuir Lista
            </Link>

            {/* Auth Button - Mobile */}
            {isLoading ? (
              <div className="rounded-lg px-3 py-3 text-sm font-medium transition-colors border border-border flex items-center justify-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Carregando...
              </div>
            ) : user ? (
              <button 
                onClick={handleSignOut}
                className="rounded-lg px-3 py-3 text-sm font-medium transition-colors border border-destructive text-destructive flex items-center justify-center gap-2 hover:bg-destructive/10"
              >
                <LogOut className="h-4 w-4" />
                Sair
              </button>
            ) : (
              <Link 
                to="/auth" 
                className="rounded-lg px-3 py-3 text-sm font-medium transition-colors border border-border flex items-center justify-center gap-2"
                onClick={() => setIsMenuOpen(false)}
              >
                <LogIn className="h-4 w-4" />
                Entrar
              </Link>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
