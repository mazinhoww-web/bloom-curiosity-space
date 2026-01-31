import { Search, ListChecks, Share2 } from "lucide-react";

const steps = [
  {
    icon: Search,
    title: "Busque a escola",
    description: "Digite o CEP ou nome da escola para encontrar as listas de materiais disponíveis.",
    color: "bg-primary",
  },
  {
    icon: ListChecks,
    title: "Escolha a série",
    description: "Selecione a série do seu filho e visualize todos os itens necessários organizados por categoria.",
    color: "bg-secondary",
  },
  {
    icon: Share2,
    title: "Compartilhe e compre",
    description: "Compartilhe a lista com outros pais pelo WhatsApp ou acesse os links diretos para compra.",
    color: "bg-accent",
  },
];

export function HowItWorks() {
  return (
    <section className="bg-muted/30 py-16 md:py-24">
      <div className="container">
        <div className="mb-12 text-center">
          <h2 className="mb-4 font-display text-3xl font-bold text-foreground md:text-4xl">
            Como funciona?
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Em apenas 3 passos simples você encontra e organiza os materiais escolares do seu filho.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {steps.map((step, index) => (
            <div 
              key={step.title}
              className="group relative animate-fade-in rounded-2xl bg-card p-8 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
              style={{ animationDelay: `${index * 150}ms` }}
            >
              {/* Step number */}
              <div className="absolute -top-4 right-6 flex h-8 w-8 items-center justify-center rounded-full bg-muted font-display text-lg font-bold text-muted-foreground">
                {index + 1}
              </div>

              {/* Icon */}
              <div className={`mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl ${step.color} shadow-fun transition-transform group-hover:scale-110`}>
                <step.icon className="h-7 w-7 text-white" />
              </div>

              {/* Content */}
              <h3 className="mb-3 font-display text-xl font-bold text-foreground">
                {step.title}
              </h3>
              <p className="text-muted-foreground">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
