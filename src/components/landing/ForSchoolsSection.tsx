import { FileCheck, MessageSquareOff, Globe, Shield, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const benefits = [
  {
    icon: Globe,
    title: "Uma fonte única de verdade",
    description: "Publique a lista oficial e todos os pais acessam a versão atualizada.",
  },
  {
    icon: MessageSquareOff,
    title: "Menos mensagens no WhatsApp",
    description: "Pais encontram a lista sozinhos, sem precisar perguntar na secretaria.",
  },
  {
    icon: FileCheck,
    title: "Centralização de listas",
    description: "Todas as séries em um só lugar, organizadas e sempre acessíveis.",
  },
  {
    icon: Shield,
    title: "Controle total",
    description: "Você decide quando publicar e pode atualizar a qualquer momento.",
  },
];

export function ForSchoolsSection() {
  return (
    <section className="py-20 md:py-28 bg-background">
      <div className="container">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          {/* Left: Content */}
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-secondary/10 px-4 py-2 text-sm font-medium text-secondary">
              🏫 Para Escolas
            </div>
            <h2 className="mb-6 font-display text-3xl font-bold text-foreground md:text-4xl">
              Reduza o retrabalho da secretaria
            </h2>
            <p className="mb-8 text-lg text-muted-foreground leading-relaxed">
              Centralize as listas de materiais em um único lugar. Os pais acessam diretamente, 
              sem precisar de atendimento individual ou mensagens repetitivas.
            </p>

            {/* Benefits List */}
            <div className="space-y-4">
              {benefits.map((benefit) => (
                <div key={benefit.title} className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary/10">
                    <benefit.icon className="h-5 w-5 text-secondary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{benefit.title}</h3>
                    <p className="text-sm text-muted-foreground">{benefit.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="mt-8">
              <Link to="/auth">
                <Button size="lg" variant="outline" className="gap-2">
                  Cadastrar minha escola
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Right: Visual */}
          <div className="relative">
            <div className="rounded-2xl bg-gradient-to-br from-secondary/20 to-primary/20 p-8 md:p-12">
              <div className="space-y-4">
                {/* Mock list cards */}
                <div className="rounded-xl bg-card p-4 shadow-card">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center text-lg">📝</div>
                      <div>
                        <div className="font-semibold text-foreground">1º Ano - Fundamental</div>
                        <div className="text-sm text-muted-foreground">32 itens • Atualizada hoje</div>
                      </div>
                    </div>
                  <span className="rounded-full bg-emerald-100 dark:bg-emerald-900/30 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                      Oficial
                    </span>
                  </div>
                </div>
                <div className="rounded-xl bg-card p-4 shadow-card opacity-80">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-secondary/20 flex items-center justify-center text-lg">📝</div>
                    <div>
                      <div className="font-semibold text-foreground">2º Ano - Fundamental</div>
                      <div className="text-sm text-muted-foreground">28 itens • Atualizada ontem</div>
                    </div>
                  </div>
                </div>
                <div className="rounded-xl bg-card p-4 shadow-card opacity-60">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-accent/20 flex items-center justify-center text-lg">📝</div>
                    <div>
                      <div className="font-semibold text-foreground">3º Ano - Fundamental</div>
                      <div className="text-sm text-muted-foreground">35 itens</div>
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
