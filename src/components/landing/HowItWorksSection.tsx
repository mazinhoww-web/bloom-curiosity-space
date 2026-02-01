import { Search, ListChecks, ShoppingCart, ArrowRight } from "lucide-react";

const steps = [
  {
    number: "1",
    icon: Search,
    title: "Busque a escola",
    description: "Digite o CEP ou nome da escola e encontre rapidamente.",
    color: "bg-primary",
    iconColor: "text-primary",
  },
  {
    number: "2",
    icon: ListChecks,
    title: "Escolha a série",
    description: "Selecione a série do seu filho e veja todos os itens organizados.",
    color: "bg-secondary",
    iconColor: "text-secondary",
  },
  {
    number: "3",
    icon: ShoppingCart,
    title: "Compre ou compartilhe",
    description: "Acesse links para compra ou envie a lista pelo WhatsApp.",
    color: "bg-accent",
    iconColor: "text-accent",
  },
];

export function HowItWorksSection() {
  return (
    <section className="py-20 md:py-28 bg-background">
      <div className="container">
        {/* Header */}
        <div className="mb-16 text-center">
          <h2 className="mb-4 font-display text-3xl font-bold text-foreground md:text-4xl">
            Como funciona?
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Em 3 passos simples você encontra e organiza os materiais escolares do seu filho.
          </p>
        </div>

        {/* Steps */}
        <div className="relative mx-auto max-w-4xl">
          {/* Connection Line (desktop) */}
          <div className="absolute left-0 right-0 top-16 hidden h-0.5 bg-gradient-to-r from-primary via-secondary to-accent md:block" />

          <div className="grid gap-8 md:grid-cols-3">
            {steps.map((step, index) => (
              <div 
                key={step.number}
                className="group relative text-center"
              >
                {/* Number Circle */}
                <div className={`relative z-10 mx-auto mb-6 flex h-32 w-32 items-center justify-center rounded-full ${step.color}/10 transition-all group-hover:scale-110`}>
                  <div className={`flex h-20 w-20 items-center justify-center rounded-full ${step.color} shadow-lg`}>
                    <step.icon className="h-10 w-10 text-white" />
                  </div>
                  {/* Step Number Badge */}
                  <div className="absolute -right-1 -top-1 flex h-8 w-8 items-center justify-center rounded-full bg-foreground font-display text-sm font-bold text-background shadow-md">
                    {step.number}
                  </div>
                </div>

                {/* Arrow (between steps on desktop) */}
                {index < steps.length - 1 && (
                  <div className="absolute right-0 top-16 hidden translate-x-1/2 md:block">
                    <ArrowRight className="h-6 w-6 text-muted-foreground/30" />
                  </div>
                )}

                {/* Content */}
                <h3 className="mb-3 font-display text-xl font-bold text-foreground">
                  {step.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
