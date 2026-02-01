import { TrendingDown, CheckCircle, Zap, BarChart3 } from "lucide-react";

const benefits = [
  {
    icon: TrendingDown,
    metric: "80%",
    title: "Menos dúvidas na secretaria",
    description: "Pais encontram a lista sozinhos. Menos ligações, menos emails, menos atendimentos repetitivos.",
  },
  {
    icon: CheckCircle,
    metric: "Zero",
    title: "Erros de versão",
    description: "Uma única fonte de verdade elimina o risco de pais acessarem listas desatualizadas.",
  },
  {
    icon: Zap,
    metric: "5min",
    title: "Para publicar uma lista",
    description: "Importe via planilha ou crie diretamente na plataforma. Publicação instantânea.",
  },
  {
    icon: BarChart3,
    metric: "100%",
    title: "Visibilidade de acesso",
    description: "Saiba exatamente quantos pais visualizaram cada lista. Dados para decisões.",
  },
];

export function BenefitsB2BSection() {
  return (
    <section className="py-20 md:py-28 bg-background">
      <div className="container">
        {/* Header */}
        <div className="mb-16 text-center">
          <p className="mb-4 text-sm font-semibold uppercase tracking-wider text-primary">
            Resultados
          </p>
          <h2 className="mb-4 font-display text-3xl font-bold text-foreground md:text-4xl">
            Impacto mensurável na operação
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Benefícios concretos que afetam diretamente a eficiência administrativa 
            e a satisfação das famílias.
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map((benefit) => (
            <div 
              key={benefit.title}
              className="group rounded-2xl border bg-card p-6 text-center transition-all hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <benefit.icon className="h-7 w-7 text-primary" />
              </div>
              <div className="mb-2 font-display text-4xl font-bold text-primary">
                {benefit.metric}
              </div>
              <h3 className="mb-2 font-display text-lg font-bold text-foreground">
                {benefit.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
