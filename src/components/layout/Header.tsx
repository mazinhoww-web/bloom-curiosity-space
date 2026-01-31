import { Link } from "react-router-dom";
import { BookOpen, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

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
        <nav className="hidden items-center gap-6 md:flex">
          <Link 
            to="/" 
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            Início
          </Link>
          <Link 
            to="/escolas" 
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            Escolas
          </Link>
          <Link to="/admin">
            <Button variant="outline" size="sm">
              Área Admin
            </Button>
          </Link>
        </nav>

        {/* Mobile Menu Button */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="md:hidden"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <nav className="border-t bg-card p-4 md:hidden">
          <div className="flex flex-col gap-3">
            <Link 
              to="/" 
              className="rounded-lg px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              onClick={() => setIsMenuOpen(false)}
            >
              Início
            </Link>
            <Link 
              to="/escolas" 
              className="rounded-lg px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              onClick={() => setIsMenuOpen(false)}
            >
              Escolas
            </Link>
            <Link 
              to="/admin"
              onClick={() => setIsMenuOpen(false)}
            >
              <Button variant="outline" size="sm" className="w-full">
                Área Admin
              </Button>
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
