import { ArrowRight, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";

export function BrandsHero() {
  const scrollToContact = () => {
    document.getElementById("contato-marcas")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-secondary/5 py-16 md:py-24">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -left-20 bottom-0 h-72 w-72 rounded-full bg-secondary/5 blur-3xl" />
      </div>

      <div className="container relative">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* Left: Content */}
          <div>
            <h1 className="mb-6 font-display text-4xl font-bold leading-tight text-foreground md:text-5xl lg:text-6xl">
              Conecte sua marca
              <br />
              <span className="text-primary">à comunidade escolar</span>
            </h1>
            <p className="mb-8 text-lg text-muted-foreground md:text-xl">
              Oportunidades de engajamento direto com famílias e escolas 
              através da maior plataforma de listas de materiais do Brasil.
            </p>

            <Button size="lg" onClick={scrollToContact} className="gap-2">
              Falar com especialista
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Right: Illustration */}
          <div className="relative">
            <div className="relative mx-auto max-w-md">
              {/* Main card */}
              <div className="rounded-2xl border bg-card p-6 shadow-xl">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    <ShoppingCart className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Lista de Materiais</p>
                    <p className="text-sm text-muted-foreground">5º Ano - Ensino Fundamental</p>
                  </div>
                </div>
                
                {/* Sample list items */}
                <div className="space-y-3">
                  {[
                    { name: "Caderno universitário 10 matérias", brand: "Sua marca aqui" },
                    { name: "Lápis de cor 24 cores", brand: "Patrocinado" },
                    { name: "Tesoura escolar sem ponta", brand: "" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                      <span className="text-sm text-foreground">{item.name}</span>
                      {item.brand && (
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                          {item.brand}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Floating badge */}
              <div className="absolute -right-4 -top-4 rounded-xl border bg-card px-4 py-2 shadow-lg">
                <p className="text-sm font-semibold text-primary">+2M listas</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
