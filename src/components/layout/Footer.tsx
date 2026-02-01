/**
 * Footer Component
 * 
 * PERSONA ROUTING MAP:
 * 
 * 1. PAIS/MÃES (B2C Primary)
 *    - / (Index) - Landing page com busca por CEP
 *    - /escolas - Lista de escolas com filtros
 *    - /escola/:slug - Detalhes da escola e listas
 *    - /contribuir - Upload de listas
 * 
 * 2. ESCOLAS / ADMIN ESCOLAR (B2B)
 *    - /instituicoes - Landing page B2B para escolas
 *    - /escola-admin - Dashboard do admin escolar
 *    - /escola-admin/listas - Gerenciamento de listas
 *    - /escola-admin/preview - Preview público da escola
 * 
 * 3. PARCEIROS / LOJAS (B2B)
 *    - /parceiros - Landing page para parceiros
 * 
 * 4. ADMIN PLATAFORMA (Internal)
 *    - /admin - Dashboard geral
 *    - /admin/escolas - Gerenciamento de escolas
 *    - /admin/listas - Gerenciamento de listas
 *    - /admin/analytics - Métricas e relatórios
 */

import { BookOpen, Heart, Users, Building2, Store, Tag } from "lucide-react";
import { Link } from "react-router-dom";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-muted/50">
      <div className="container py-12">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link to="/" className="inline-flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
                <BookOpen className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-display text-xl font-bold text-foreground">
                Lista <span className="text-primary">Escolar</span>
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm text-muted-foreground">
              Facilitando a vida de pais e escolas na organização de materiais escolares.
            </p>
            <div className="mt-4 space-y-1 text-sm text-muted-foreground">
              <p>📧 listapronta@gmail.com</p>
              <p>📞 (65) 9 9622-7110</p>
            </div>
          </div>

          {/* Para Pais */}
          <div>
            <h4 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
              <Users className="h-4 w-4 text-primary" />
              Para Pais
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="text-muted-foreground transition-colors hover:text-primary">
                  Início
                </Link>
              </li>
              <li>
                <Link to="/escolas" className="text-muted-foreground transition-colors hover:text-primary">
                  Buscar Escolas
                </Link>
              </li>
              <li>
                <Link to="/contribuir" className="text-muted-foreground transition-colors hover:text-primary">
                  Contribuir Lista
                </Link>
              </li>
            </ul>
          </div>

          {/* Para Escolas */}
          <div>
            <h4 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
              <Building2 className="h-4 w-4 text-secondary" />
              Para Escolas
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/instituicoes" className="text-muted-foreground transition-colors hover:text-primary">
                  Soluções para Escolas
                </Link>
              </li>
              <li>
                <Link to="/escola-admin" className="text-muted-foreground transition-colors hover:text-primary">
                  Portal da Escola
                </Link>
              </li>
              <li>
                <Link to="/auth" className="text-muted-foreground transition-colors hover:text-primary">
                  Acessar Conta
                </Link>
              </li>
            </ul>
          </div>

          {/* Para Lojas + Marcas */}
          <div>
            <h4 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
              <Store className="h-4 w-4 text-accent" />
              Para Lojas
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/parceiros" className="text-muted-foreground transition-colors hover:text-primary">
                  Seja Parceiro
                </Link>
              </li>
            </ul>

            <h4 className="mb-4 mt-6 flex items-center gap-2 text-sm font-semibold text-foreground">
              <Tag className="h-4 w-4 text-primary" />
              Para Marcas
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/parceiros?tipo=marca" className="text-muted-foreground transition-colors hover:text-primary">
                  Aumente Visibilidade
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t pt-8 md:flex-row">
          <p className="text-sm text-muted-foreground">
            © {currentYear} Lista Escolar. Todos os direitos reservados.
          </p>
          <p className="flex items-center gap-1 text-sm text-muted-foreground">
            Feito com <Heart className="h-3.5 w-3.5 fill-destructive text-destructive" /> no Brasil
          </p>
        </div>
      </div>
    </footer>
  );
}
