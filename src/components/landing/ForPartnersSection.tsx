import { Target, BarChart3, Users, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const benefits = [
  {
    icon: Target,
    title: "Onde a decisão acontece",
    description: "Esteja presente no momento exato em que os pais decidem onde comprar.",
  },
  {
    icon: Users,
    title: "Tráfego qualificado",
    description: "Pais com intenção real de compra, já com a lista em mãos.",
  },
  {
    icon: BarChart3,
    title: "Dados estruturados",
    description: "Insights sobre demanda por região, série e categoria de produto.",
  },
  {
    icon: Zap,
    title: "Integração simples",
    description: "Links afiliados com tracking completo de conversão.",
  },
];

export function ForPartnersSection() {
  return (
    <section className="py-20 md:py-28 bg-muted/30">
      <div className="container">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          {/* Left: Visual */}
          <div className="order-2 lg:order-1">
            <div className="rounded-2xl bg-gradient-to-br from-accent/20 to-secondary/20 p-8 md:p-12">
              {/* Stats mockup */}
              <div className="space-y-6">
                <div className="flex items-center justify-between rounded-xl bg-card p-4 shadow-card">
                  <div>
                    <div className="text-2xl font-bold text-foreground">12.4K</div>
                    <div className="text-sm text-muted-foreground">Cliques este mês</div>
                  </div>
                  <div className="h-12 w-12 rounded-lg bg-accent/20 flex items-center justify-center">
                    <Target className="h-6 w-6 text-accent" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-xl bg-card p-4 shadow-card">
                    <div className="text-xl font-bold text-foreground">8.2%</div>
                    <div className="text-xs text-muted-foreground">Taxa de conversão</div>
                  </div>
                  <div className="rounded-xl bg-card p-4 shadow-card">
                    <div className="text-xl font-bold text-foreground">R$ 142</div>
                    <div className="text-xs text-muted-foreground">Ticket médio</div>
                  </div>
                </div>
                <div className="rounded-xl bg-card p-4 shadow-card">
                  <div className="mb-2 text-sm font-medium text-foreground">Top Regiões</div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">São Paulo, SP</span>
                      <span className="font-medium text-foreground">34%</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full w-[34%] bg-accent rounded-full" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Content */}
          <div className="order-1 lg:order-2">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-accent/10 px-4 py-2 text-sm font-medium text-accent">
              🛒 Para Parceiros e Varejistas
            </div>
            <h2 className="mb-6 font-display text-3xl font-bold text-foreground md:text-4xl">
              Acesso direto ao momento de compra
            </h2>
            <p className="mb-8 text-lg text-muted-foreground leading-relaxed">
              Conecte sua loja a milhares de pais que estão decidindo onde comprar os materiais escolares. 
              Tráfego qualificado com alta intenção de conversão.
            </p>

            {/* Benefits Grid */}
            <div className="grid gap-4 sm:grid-cols-2">
              {benefits.map((benefit) => (
                <div key={benefit.title} className="flex gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10">
                    <benefit.icon className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground text-sm">{benefit.title}</h3>
                    <p className="text-xs text-muted-foreground">{benefit.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="mt-8">
              <Link to="/parceiros">
                <Button size="lg" className="gap-2 bg-accent hover:bg-accent/90">
                  Seja um parceiro
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
