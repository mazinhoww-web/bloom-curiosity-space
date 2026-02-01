import { Shield, Eye, Lock, UserX } from "lucide-react";

const trustPoints = [
  {
    icon: UserX,
    title: "Sem login, sem cadastro",
    description: "Você acessa as listas diretamente, sem criar conta nem fornecer dados pessoais.",
  },
  {
    icon: Lock,
    title: "Sem dados sensíveis",
    description: "Não pedimos nome, email, telefone ou qualquer informação sua. Simples assim.",
  },
  {
    icon: Eye,
    title: "Transparência total",
    description: "Você vê exatamente de onde vem cada lista. Sem segredos, sem letras miúdas.",
  },
  {
    icon: Shield,
    title: "Fonte confiável",
    description: "Listas oficiais enviadas pelas próprias escolas ou verificadas pela comunidade.",
  },
];

export function TrustSection() {
  return (
    <section className="py-20 md:py-28 bg-background">
      <div className="container">
        {/* Header */}
        <div className="mb-16 text-center">
          <h2 className="mb-4 font-display text-3xl font-bold text-foreground md:text-4xl">
            Sua privacidade importa
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Acreditamos que você não precisa entregar seus dados para acessar uma lista de materiais.
          </p>
        </div>

        {/* Trust Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {trustPoints.map((point) => (
            <div 
              key={point.title}
              className="group rounded-2xl border bg-card p-6 text-center transition-all hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 transition-transform group-hover:scale-110">
                <point.icon className="h-7 w-7 text-primary" />
              </div>
              <h3 className="mb-2 font-display text-lg font-bold text-foreground">
                {point.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {point.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
