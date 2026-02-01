import { AlertTriangle, FileQuestion, RefreshCcw, MessageSquare } from "lucide-react";

const problems = [
  {
    icon: FileQuestion,
    title: "Listas descentralizadas",
    description: "PDFs em emails, fotos em grupos de WhatsApp, versões diferentes circulando entre pais. Nenhuma fonte oficial consolidada.",
  },
  {
    icon: AlertTriangle,
    title: "Informação desatualizada",
    description: "Atualizações não chegam a todos. Pais compram itens errados. Reclamações chegam à secretaria.",
  },
  {
    icon: RefreshCcw,
    title: "Retrabalho constante",
    description: "Secretaria responde às mesmas perguntas repetidamente. Coordenação refaz listas manualmente a cada ano.",
  },
  {
    icon: MessageSquare,
    title: "Comunicação fragmentada",
    description: "Cada série, cada turma, cada canal com uma versão diferente. Impossível garantir consistência.",
  },
];

export function ProblemSection() {
  return (
    <section className="py-20 md:py-28 bg-muted/30">
      <div className="container">
        {/* Header */}
        <div className="mb-16 text-center">
          <p className="mb-4 text-sm font-semibold uppercase tracking-wider text-primary">
            O Problema
          </p>
          <h2 className="mb-4 font-display text-3xl font-bold text-foreground md:text-4xl">
            A gestão de listas escolares é ineficiente
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Instituições de ensino perdem tempo e credibilidade com processos manuais 
            que poderiam ser automatizados e centralizados.
          </p>
        </div>

        {/* Problems Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {problems.map((problem) => (
            <div 
              key={problem.title}
              className="group rounded-2xl border border-destructive/20 bg-card p-6 transition-all hover:border-destructive/40"
            >
              <div className="flex gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-destructive/10">
                  <problem.icon className="h-6 w-6 text-destructive" />
                </div>
                <div>
                  <h3 className="mb-2 font-display text-lg font-bold text-foreground">
                    {problem.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {problem.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
