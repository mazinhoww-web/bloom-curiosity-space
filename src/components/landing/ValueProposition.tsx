import { Lightbulb, Layers, TrendingUp, Eye } from "lucide-react";

const values = [
  {
    icon: Lightbulb,
    title: "Clareza",
    description: "Informação objetiva e fácil de entender para todos os públicos.",
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    icon: Layers,
    title: "Simplicidade",
    description: "Encontre o que precisa em poucos cliques, sem complicação.",
    color: "text-secondary",
    bgColor: "bg-secondary/10",
  },
  {
    icon: TrendingUp,
    title: "Escalabilidade",
    description: "Infraestrutura preparada para milhares de escolas e acessos.",
    color: "text-accent",
    bgColor: "bg-accent/10",
  },
  {
    icon: Eye,
    title: "Transparência",
    description: "Dados abertos e claros sobre lojas, preços e disponibilidade.",
    color: "text-green-600",
    bgColor: "bg-green-100",
  },
];

export function ValueProposition() {
  return (
    <section className="py-20 md:py-28 bg-background">
      <div className="container">
        {/* Header */}
        <div className="mb-16 text-center">
          <h2 className="mb-4 font-display text-3xl font-bold text-foreground md:text-4xl">
            Por que usar a Lista Escolar?
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Construímos uma plataforma pensada para resolver problemas reais de pais, escolas e varejistas.
          </p>
        </div>

        {/* Values Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {values.map((value, index) => (
            <div 
              key={value.title}
              className="group rounded-2xl border bg-card p-8 text-center transition-all hover:-translate-y-1 hover:shadow-lg"
            >
              <div className={`mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl ${value.bgColor} transition-transform group-hover:scale-110`}>
                <value.icon className={`h-8 w-8 ${value.color}`} />
              </div>
              <h3 className="mb-3 font-display text-xl font-bold text-foreground">
                {value.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {value.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
