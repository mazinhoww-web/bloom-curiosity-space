import { BookOpen, Heart } from "lucide-react";
import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="border-t bg-muted/50">
      <div className="container py-8">
        <div className="flex flex-col items-center gap-6 md:flex-row md:justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <BookOpen className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-display text-lg font-bold text-foreground">
              Lista <span className="text-primary">Escolar</span>
            </span>
          </Link>

          {/* Links */}
          <nav className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
            <Link to="/" className="transition-colors hover:text-primary">
              Início
            </Link>
            <Link to="/escolas" className="transition-colors hover:text-primary">
              Escolas
            </Link>
            <Link to="/admin" className="transition-colors hover:text-primary">
              Admin
            </Link>
          </nav>

          {/* Copyright */}
          <p className="flex items-center gap-1 text-sm text-muted-foreground">
            Feito com <Heart className="h-3.5 w-3.5 fill-destructive text-destructive" /> em {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </footer>
  );
}
