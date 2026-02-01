import { ArrowRight, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function B2BHero() {
  return (
    <section className="relative overflow-hidden bg-foreground py-20 md:py-28 lg:py-36">
      {/* Subtle Grid Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="h-full w-full" style={{
          backgroundImage: `linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }} />
      </div>

      <div className="container relative z-10">
        <div className="mx-auto max-w-3xl text-center">
          {/* Institutional Badge */}
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-muted-foreground/20 bg-muted-foreground/10 px-4 py-2 text-sm font-medium text-muted">
            <Building2 className="h-4 w-4" />
            Infraestrutura para Gestão Educacional
          </div>

          {/* Headline - Institutional */}
          <h1 className="mb-6 font-display text-4xl font-bold tracking-tight text-background md:text-5xl lg:text-6xl">
            Padronize a distribuição de listas de materiais
          </h1>

          {/* Subheadline - Strategic */}
          <p className="mb-10 text-lg text-muted md:text-xl leading-relaxed">
            Centralize, governe e distribua as listas de materiais da sua instituição 
            em uma única fonte de verdade. Reduza retrabalho administrativo e elimine erros de comunicação.
          </p>

          {/* CTA */}
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Button 
              size="lg"
              className="h-14 rounded-xl bg-primary px-8 text-lg font-semibold shadow-xl transition-all hover:scale-105"
              onClick={() => document.getElementById("contato")?.scrollIntoView({ behavior: "smooth" })}
            >
              Falar com o time
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              size="lg"
              variant="outline"
              className="h-14 rounded-xl border-muted-foreground/30 bg-transparent px-8 text-lg font-semibold text-background hover:bg-muted-foreground/10 hover:text-background"
              onClick={() => document.getElementById("contato")?.scrollIntoView({ behavior: "smooth" })}
            >
              Ver demonstração
            </Button>
          </div>

          {/* Credibility */}
          <p className="mt-12 text-sm text-muted-foreground">
            Utilizado por escolas particulares, redes de ensino e sistemas educacionais em todo o Brasil.
          </p>
        </div>
      </div>
    </section>
  );
}
