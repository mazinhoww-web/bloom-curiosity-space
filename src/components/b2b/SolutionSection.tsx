import { Database, Layers, Globe, CheckCircle2 } from "lucide-react";

const features = [
  {
    icon: Database,
    title: "Fonte única de verdade",
    description: "Uma única versão oficial de cada lista, acessível por todos os stakeholders.",
    points: [
      "Eliminação de versões conflitantes",
      "Histórico de alterações completo",
      "Versionamento automático",
    ],
  },
  {
    icon: Layers,
    title: "Estruturação por série",
    description: "Listas organizadas hierarquicamente por nível, série e turma.",
    points: [
      "Categorização padronizada de itens",
      "Templates reutilizáveis entre anos",
      "Importação em lote via planilha",
    ],
  },
  {
    icon: Globe,
    title: "Distribuição pública",
    description: "Pais acessam as listas diretamente, sem intermediários.",
    points: [
      "Link permanente por série",
      "Acesso sem cadastro",
      "Compartilhamento facilitado",
    ],
  },
];

export function SolutionSection() {
  return (
    <section className="py-20 md:py-28 bg-background">
      <div className="container">
        {/* Header */}
        <div className="mb-16 text-center">
          <p className="mb-4 text-sm font-semibold uppercase tracking-wider text-primary">
            A Solução
          </p>
          <h2 className="mb-4 font-display text-3xl font-bold text-foreground md:text-4xl">
            Infraestrutura digital para listas de materiais
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Uma plataforma que centraliza a gestão e automatiza a distribuição 
            de listas para toda a comunidade escolar.
          </p>
        </div>

        {/* Features */}
        <div className="grid gap-8 lg:grid-cols-3">
          {features.map((feature) => (
            <div 
              key={feature.title}
              className="group rounded-2xl border bg-card p-8 transition-all hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
                <feature.icon className="h-7 w-7 text-primary" />
              </div>
              <h3 className="mb-3 font-display text-xl font-bold text-foreground">
                {feature.title}
              </h3>
              <p className="mb-6 text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
              <ul className="space-y-2">
                {feature.points.map((point) => (
                  <li key={point} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span className="text-muted-foreground">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
