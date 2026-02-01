import { Shield, ToggleRight, History, Users, Lock, Eye } from "lucide-react";

const capabilities = [
  {
    icon: Shield,
    title: "Controle administrativo",
    description: "Defina quem pode criar, editar e publicar listas. Permissões granulares por função.",
  },
  {
    icon: ToggleRight,
    title: "Ativação e desativação",
    description: "Publique listas quando estiverem prontas. Desative versões antigas com um clique.",
  },
  {
    icon: History,
    title: "Histórico completo",
    description: "Rastreie todas as alterações. Saiba quem editou o quê e quando.",
  },
  {
    icon: Users,
    title: "Multi-usuário",
    description: "Coordenadores, secretaria e direção trabalhando na mesma plataforma.",
  },
  {
    icon: Lock,
    title: "Dados protegidos",
    description: "Infraestrutura segura. Backup automático. Conformidade com LGPD.",
  },
  {
    icon: Eye,
    title: "Visibilidade total",
    description: "Dashboard com métricas de acesso. Saiba quantos pais visualizaram cada lista.",
  },
];

export function GovernanceSection() {
  return (
    <section className="py-20 md:py-28 bg-muted/30">
      <div className="container">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          {/* Left: Visual */}
          <div className="order-2 lg:order-1">
            <div className="rounded-2xl bg-foreground p-8 md:p-10">
              {/* Admin Panel Mock */}
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-muted-foreground/20 pb-4">
                  <div className="text-lg font-semibold text-background">Painel de Controle</div>
                  <div className="text-sm text-muted">Colégio São Paulo</div>
                </div>
                
                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="rounded-lg bg-muted-foreground/10 p-3 text-center">
                    <div className="text-2xl font-bold text-background">12</div>
                    <div className="text-xs text-muted">Listas ativas</div>
                  </div>
                  <div className="rounded-lg bg-muted-foreground/10 p-3 text-center">
                    <div className="text-2xl font-bold text-background">847</div>
                    <div className="text-xs text-muted">Visualizações</div>
                  </div>
                  <div className="rounded-lg bg-muted-foreground/10 p-3 text-center">
                    <div className="text-2xl font-bold text-background">3</div>
                    <div className="text-xs text-muted">Editores</div>
                  </div>
                </div>

                {/* Lists */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between rounded-lg bg-muted-foreground/10 p-3">
                    <div>
                      <div className="font-medium text-background text-sm">1º Ano - Fundamental</div>
                      <div className="text-xs text-muted">Atualizada há 2 dias</div>
                    </div>
                    <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-medium text-emerald-400">
                      Publicada
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-muted-foreground/10 p-3">
                    <div>
                      <div className="font-medium text-background text-sm">2º Ano - Fundamental</div>
                      <div className="text-xs text-muted">Rascunho</div>
                    </div>
                    <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-medium text-amber-400">
                      Pendente
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Content */}
          <div className="order-1 lg:order-2">
            <p className="mb-4 text-sm font-semibold uppercase tracking-wider text-primary">
              Governança
            </p>
            <h2 className="mb-6 font-display text-3xl font-bold text-foreground md:text-4xl">
              Controle total sobre suas listas
            </h2>
            <p className="mb-8 text-lg text-muted-foreground leading-relaxed">
              Ferramentas administrativas para garantir que as informações corretas 
              cheguem às pessoas certas, no momento certo.
            </p>

            {/* Capabilities Grid */}
            <div className="grid gap-4 sm:grid-cols-2">
              {capabilities.map((cap) => (
                <div key={cap.title} className="flex gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <cap.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground text-sm">{cap.title}</h3>
                    <p className="text-xs text-muted-foreground">{cap.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
