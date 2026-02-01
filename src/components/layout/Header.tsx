/**
 * Header Component - Main Navigation
 * 
 * PERSONA ROUTING:
 * - Para Pais: / (Index), /escolas, /escola/:slug, /contribuir
 * - Para Escolas: /instituicoes, /escola-admin/*
 * - Para Lojas: /parceiros
 * - Para Marcas: /parceiros (marcas)
 */

import { Link } from "react-router-dom";
import { BookOpen, Menu, X, Upload, Users, Building2, Store, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { CartDrawer } from "@/components/cart/CartDrawer";

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
            to="/parceiros?tipo=marca" 
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
              to="/parceiros?tipo=marca" 
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
          </div>
        </nav>
      )}
    </header>
  );
}
