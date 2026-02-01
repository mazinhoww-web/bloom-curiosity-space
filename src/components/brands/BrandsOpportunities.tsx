import { CheckCircle2, Megaphone, Gift, Users, FileText, Palette } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const opportunities = [
  {
    icon: FileText,
    title: "Patrocínio de listas",
    description: "Sua marca em destaque nas listas de materiais mais acessadas",
  },
  {
    icon: Megaphone,
    title: "Campanhas omnichannel",
    description: "Marketing para nossos públicos através de múltiplos canais",
  },
  {
    icon: Users,
    title: "Campanhas com influenciadores",
    description: "Parcerias com educadores e pais influenciadores",
  },
  {
    icon: Gift,
    title: "Amostras para professores e pais",
    description: "Distribuição de produtos para teste e avaliação",
  },
  {
    icon: CheckCircle2,
    title: "Sorteios e promoções",
    description: "Engajamento através de concursos e brindes",
  },
  {
    icon: Palette,
    title: "Conteúdo personalizado",
    description: "Criação de conteúdo educativo e promocional",
  },
];

export function BrandsOpportunities() {
  return (
    <section className="bg-muted/30 py-16 md:py-20">
      <div className="container">
        <div className="grid items-start gap-12 lg:grid-cols-2">
          {/* Left: Carousel/Logo showcase */}
          <div>
            <Card className="overflow-hidden">
              <CardContent className="p-6">
                <div className="mb-4 flex items-center gap-3">
                  <Badge className="bg-primary/10 text-primary hover:bg-primary/20">
                    Parceria de sucesso
                  </Badge>
                </div>
                <p className="mb-6 text-lg font-medium text-foreground">
                  "Junto com nossos patrocinadores, queremos realizar os desejos das salas de aula!"
                </p>
                
                {/* Partner logos placeholder */}
                <div className="flex flex-wrap items-center gap-4">
                  {["Faber-Castell", "Tilibra", "BIC", "Acrilex"].map((brand) => (
                    <div
                      key={brand}
                      className="flex h-10 items-center justify-center rounded-lg bg-muted px-4"
                    >
                      <span className="text-sm font-medium text-muted-foreground">{brand}</span>
                    </div>
                  ))}
                </div>

                <p className="mt-4 text-sm text-muted-foreground">
                  Sorteios e promoções
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Right: Opportunities list */}
          <div>
            <h2 className="mb-6 font-display text-2xl font-bold text-foreground md:text-3xl">
              Oportunidades de marketing para marcas.
            </h2>
            <p className="mb-8 text-muted-foreground">
              Oferecemos oportunidades de marketing personalizadas com base nos seus objetivos. 
              Exemplos incluem:
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              {opportunities.map((opp) => (
                <div
                  key={opp.title}
                  className="flex items-start gap-3 rounded-xl border bg-card p-4 transition-colors hover:border-primary/50"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <opp.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{opp.title}</p>
                    <p className="text-sm text-muted-foreground">{opp.description}</p>
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
