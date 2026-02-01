import { CheckCircle2, Clock, RefreshCcw, ShoppingBag, ListChecks, Smile } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const benefits = [
  {
    icon: ListChecks,
    title: "Listas organizadas",
    description: "Todos os itens separados por categoria. Você sabe exatamente o que comprar.",
  },
  {
    icon: CheckCircle2,
    title: "Menos erros",
    description: "A lista oficial da escola, sem confusão com versões antigas ou incompletas.",
  },
  {
    icon: RefreshCcw,
    title: "Menos retrabalho",
    description: "Nada de voltar à papelaria porque faltou algo. Tudo listado de uma vez.",
  },
  {
    icon: ShoppingBag,
    title: "Compra facilitada",
    description: "Links diretos para as melhores lojas. Compare preços sem sair de casa.",
  },
  {
    icon: Clock,
    title: "Economize tempo",
    description: "Encontre a lista em segundos. Sem filas, sem telefonemas, sem espera.",
  },
  {
    icon: Smile,
    title: "Menos estresse",
    description: "Comece o ano letivo tranquilo, sabendo que está tudo certo.",
  },
];

export function BenefitsSection() {
  return (
    <section className="py-20 md:py-28 bg-muted/30">
      <div className="container">
        {/* Header */}
        <div className="mb-16 text-center">
          <h2 className="mb-4 font-display text-3xl font-bold text-foreground md:text-4xl">
            Por que usar a Lista Escolar?
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Sabemos como é corrido o início do ano. Por isso, simplificamos tudo para você.
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {benefits.map((benefit) => (
            <Card 
              key={benefit.title}
              className="group border-0 bg-card shadow-card transition-all hover:-translate-y-1 hover:shadow-lg"
            >
              <CardContent className="p-6">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary">
                  <benefit.icon className="h-6 w-6 text-primary transition-colors group-hover:text-primary-foreground" />
                </div>
                <h3 className="mb-2 font-display text-lg font-bold text-foreground">
                  {benefit.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {benefit.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
