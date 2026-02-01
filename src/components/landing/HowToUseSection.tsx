import { Search, MousePointer, Share2, ArrowDown } from "lucide-react";

const steps = [
  {
    number: "1",
    icon: Search,
    title: "Busque pelo CEP",
    description: "Digite o CEP da escola ou do bairro. Mostramos todas as escolas próximas.",
    color: "bg-primary",
  },
  {
    number: "2",
    icon: MousePointer,
    title: "Escolha a série",
    description: "Selecione a série do seu filho. A lista aparece completa e organizada.",
    color: "bg-secondary",
  },
  {
    number: "3",
    icon: Share2,
    title: "Use como quiser",
    description: "Compre online, imprima a lista ou compartilhe com outros pais da turma.",
    color: "bg-accent",
  },
];

export function HowToUseSection() {
  return (
    <section className="py-20 md:py-28 bg-background">
      <div className="container">
        {/* Header */}
        <div className="mb-16 text-center">
          <h2 className="mb-4 font-display text-3xl font-bold text-foreground md:text-4xl">
            Como funciona?
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Três passos simples. Menos de um minuto.
          </p>
        </div>

        {/* Steps */}
        <div className="mx-auto max-w-2xl">
          <div className="space-y-6">
            {steps.map((step, index) => (
              <div key={step.number} className="relative">
                {/* Step Card */}
                <div className="group flex gap-6 rounded-2xl border bg-card p-6 shadow-card transition-all hover:shadow-lg">
                  {/* Number & Icon */}
                  <div className="flex flex-col items-center">
                    <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full ${step.color} shadow-lg`}>
                      <step.icon className="h-7 w-7 text-white" />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 pt-1">
                    <div className="mb-1 text-sm font-medium text-muted-foreground">
                      Passo {step.number}
                    </div>
                    <h3 className="mb-2 font-display text-xl font-bold text-foreground">
                      {step.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>

                {/* Connector Arrow */}
                {index < steps.length - 1 && (
                  <div className="flex justify-center py-2">
                    <ArrowDown className="h-6 w-6 text-muted-foreground/30" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
