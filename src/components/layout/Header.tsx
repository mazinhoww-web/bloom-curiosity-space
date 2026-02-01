/**
 * Header Component - Main Navigation
 * 
 * PERSONA ROUTING:
 * - Pais/Mães: / (Index), /escolas, /escola/:slug, /contribuir
 * - Escolas: /instituicoes, /escola-admin/*
 * - Parceiros/Lojas: /parceiros
 * - Admin Plataforma: /admin/*
 */

import { Link } from "react-router-dom";
import { BookOpen, Menu, X, Upload, ChevronDown, Users, Building2, Store, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { CartDrawer } from "@/components/cart/CartDrawer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-1 md:flex">
          {/* Para Pais - Primary audience */}
          <Link 
            to="/escolas" 
            className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-primary"
          >
            Buscar Escolas
          </Link>
          
          <Link to="/contribuir">
            <Button variant="ghost" size="sm" className="gap-1 text-primary">
              <Upload className="h-4 w-4" />
              Contribuir
            </Button>
          </Link>

          {/* Dropdown for Personas */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1">
                Soluções
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                Para cada público
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              {/* Pais */}
              <DropdownMenuItem asChild>
                <Link to="/" className="flex items-center gap-3 cursor-pointer">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                    <Users className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Para Pais</p>
                    <p className="text-xs text-muted-foreground">Encontre listas de materiais</p>
                  </div>
                </Link>
              </DropdownMenuItem>
              
              {/* Escolas */}
              <DropdownMenuItem asChild>
                <Link to="/instituicoes" className="flex items-center gap-3 cursor-pointer">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary/10">
                    <Building2 className="h-4 w-4 text-secondary" />
                  </div>
                  <div>
                    <p className="font-medium">Para Escolas</p>
                    <p className="text-xs text-muted-foreground">Gerencie suas listas</p>
                  </div>
                </Link>
              </DropdownMenuItem>
              
              {/* Parceiros */}
              <DropdownMenuItem asChild>
                <Link to="/parceiros" className="flex items-center gap-3 cursor-pointer">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10">
                    <Store className="h-4 w-4 text-accent" />
                  </div>
                  <div>
                    <p className="font-medium">Para Parceiros</p>
                    <p className="text-xs text-muted-foreground">Lojas e fornecedores</p>
                  </div>
                </Link>
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              {/* Admin */}
              <DropdownMenuItem asChild>
                <Link to="/admin" className="flex items-center gap-3 cursor-pointer">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">Área Admin</p>
                    <p className="text-xs text-muted-foreground">Gestão da plataforma</p>
                  </div>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

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
            {/* Section: Para Pais */}
            <p className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Para Pais
            </p>
            <Link 
              to="/" 
              className="rounded-lg px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted flex items-center gap-2"
              onClick={() => setIsMenuOpen(false)}
            >
              <Users className="h-4 w-4 text-primary" />
              Início
            </Link>
            <Link 
              to="/escolas" 
              className="rounded-lg px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              onClick={() => setIsMenuOpen(false)}
            >
              Buscar Escolas
            </Link>
            <Link 
              to="/contribuir" 
              className="rounded-lg px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-muted flex items-center gap-2"
              onClick={() => setIsMenuOpen(false)}
            >
              <Upload className="h-4 w-4" />
              Contribuir Lista
            </Link>
            
            <div className="my-2 border-t" />
            
            {/* Section: Outras Personas */}
            <p className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Soluções
            </p>
            <Link 
              to="/instituicoes" 
              className="rounded-lg px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted flex items-center gap-2"
              onClick={() => setIsMenuOpen(false)}
            >
              <Building2 className="h-4 w-4 text-secondary" />
              Para Escolas
            </Link>
            <Link 
              to="/parceiros" 
              className="rounded-lg px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted flex items-center gap-2"
              onClick={() => setIsMenuOpen(false)}
            >
              <Store className="h-4 w-4 text-accent" />
              Para Parceiros
            </Link>
            
            <div className="my-2 border-t" />
            
            <Link 
              to="/admin"
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted flex items-center gap-2"
              onClick={() => setIsMenuOpen(false)}
            >
              <Shield className="h-4 w-4" />
              Área Admin
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
