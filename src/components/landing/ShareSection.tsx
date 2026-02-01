import { Link2, MessageCircle, Users, Heart } from "lucide-react";

const shareOptions = [
  {
    icon: Link2,
    title: "Link público",
    description: "Cada lista tem um link único. Cole onde quiser: email, redes sociais, qualquer lugar.",
  },
  {
    icon: MessageCircle,
    title: "WhatsApp",
    description: "Com um toque, envie a lista pelo WhatsApp para quem você quiser.",
  },
  {
    icon: Users,
    title: "Grupo da turma",
    description: "Compartilhe no grupo dos pais. Todo mundo acessa a mesma lista atualizada.",
  },
];

export function ShareSection() {
  return (
    <section className="py-20 md:py-28 bg-muted/30">
      <div className="container">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          {/* Left: Content */}
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-secondary/10 px-4 py-2 text-sm font-medium text-secondary">
              <Heart className="h-4 w-4" />
              Ajude outros pais
            </div>
            <h2 className="mb-6 font-display text-3xl font-bold text-foreground md:text-4xl">
              Compartilhe com a turma
            </h2>
            <p className="mb-8 text-lg text-muted-foreground leading-relaxed">
              Encontrou a lista? Que tal enviar para os outros pais da sala? 
              Assim, todo mundo economiza tempo juntos.
            </p>

            {/* Share Options */}
            <div className="space-y-4">
              {shareOptions.map((option) => (
                <div key={option.title} className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary/10">
                    <option.icon className="h-5 w-5 text-secondary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{option.title}</h3>
                    <p className="text-sm text-muted-foreground">{option.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Visual */}
          <div className="relative">
            <div className="rounded-2xl bg-gradient-to-br from-secondary/20 to-primary/20 p-8 md:p-12">
              {/* WhatsApp Preview Mock */}
              <div className="mx-auto max-w-sm">
                <div className="rounded-2xl bg-card p-4 shadow-lg">
                  {/* Chat Header */}
                  <div className="mb-4 flex items-center gap-3 border-b pb-3">
                    <div className="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-lg">👨‍👩‍👧</div>
                    <div>
                      <div className="font-semibold text-foreground text-sm">Pais do 2º Ano B</div>
                      <div className="text-xs text-muted-foreground">24 participantes</div>
                    </div>
                  </div>
                  
                  {/* Messages */}
                  <div className="space-y-3">
                    <div className="rounded-lg bg-muted/50 p-3 text-sm">
                      <div className="font-medium text-primary text-xs mb-1">Fernanda</div>
                      <p className="text-foreground">Gente, achei a lista de materiais aqui:</p>
                      <div className="mt-2 rounded-lg bg-primary/10 p-2 text-xs">
                        <div className="font-medium text-primary">📝 Lista de Materiais</div>
                        <div className="text-muted-foreground">Colégio São Paulo - 2º Ano</div>
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <div className="rounded-lg bg-emerald-100 dark:bg-emerald-900/30 p-3 text-sm max-w-[80%]">
                        <p className="text-foreground">Obrigada! Já consegui ver tudo aqui 🙏</p>
                      </div>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-3 text-sm">
                      <div className="font-medium text-secondary text-xs mb-1">Carlos</div>
                      <p className="text-foreground">Muito prático! Vou comprar hoje mesmo</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
