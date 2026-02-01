import { GraduationCap, Users, ShoppingCart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function BrandsAudiences() {
  return (
    <section className="bg-background py-16 md:py-20">
      <div className="container">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* Left: Content */}
          <div>
            <h2 className="mb-6 font-display text-2xl font-bold text-foreground md:text-3xl">
              Nossos públicos.
            </h2>
            <p className="mb-6 text-muted-foreground md:text-lg">
              Através de diversos meios de alcance, engajamos famílias com filhos no 
              ensino básico, professores, e líderes de escolas e redes escolares, 
              entendendo suas necessidades.
            </p>
            <p className="mb-8 text-muted-foreground md:text-lg">
              Nossos públicos optaram por receber nosso conteúdo e são altamente engajados. 
              Enquanto somos especialistas em materiais de volta às aulas, compartilhamos 
              conteúdo significativo e expertise durante todo o ano.
            </p>

            <ul className="space-y-4">
              {[
                {
                  icon: GraduationCap,
                  text: "Educadores engajados interessados em ferramentas e recursos de sala de aula",
                },
                {
                  icon: Users,
                  text: "Administradores escolares apoiando professores e famílias",
                },
                {
                  icon: ShoppingCart,
                  text: "Famílias comprando materiais de volta às aulas e recursos educacionais",
                },
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <item.icon className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <span className="text-sm text-muted-foreground">{item.text}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Right: Illustration */}
          <div className="relative">
            <Card className="mx-auto max-w-sm">
              <CardContent className="p-6">
                <div className="mb-4 text-center">
                  <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20">
                    <Users className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-display text-lg font-semibold text-foreground">
                    Comunidade Engajada
                  </h3>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                    <span className="text-sm text-foreground">Famílias ativas</span>
                    <span className="font-semibold text-primary">500K+</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                    <span className="text-sm text-foreground">Escolas cadastradas</span>
                    <span className="font-semibold text-secondary">180K+</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                    <span className="text-sm text-foreground">Listas verificadas</span>
                    <span className="font-semibold text-accent-foreground">2M+</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Decorative elements */}
            <div className="absolute -right-4 top-1/4 h-20 w-20 rounded-full bg-primary/5 blur-2xl" />
            <div className="absolute -left-4 bottom-1/4 h-16 w-16 rounded-full bg-secondary/5 blur-2xl" />
          </div>
        </div>
      </div>
    </section>
  );
}
