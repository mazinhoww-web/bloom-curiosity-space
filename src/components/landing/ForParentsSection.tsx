import { CheckCircle2, Clock, Share2, ShoppingBag, UserX, Smartphone } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const benefits = [
  {
    icon: UserX,
    title: "Sem cadastro",
    description: "Acesse as listas sem precisar criar conta ou fazer login.",
  },
  {
    icon: Clock,
    title: "Economize tempo",
    description: "Encontre a lista em segundos, sem precisar ir até a escola.",
  },
  {
    icon: Share2,
    title: "Compartilhe fácil",
    description: "Envie a lista pelo WhatsApp para outros pais em um clique.",
  },
  {
    icon: ShoppingBag,
    title: "Links de compra",
    description: "Acesse diretamente as lojas com os melhores preços.",
  },
  {
    icon: Smartphone,
    title: "Acesse do celular",
    description: "Funciona perfeitamente em qualquer dispositivo.",
  },
  {
    icon: CheckCircle2,
    title: "Lista organizada",
    description: "Itens separados por categoria para facilitar suas compras.",
  },
];

export function ForParentsSection() {
  return (
    <section className="py-20 md:py-28 bg-muted/30">
      <div className="container">
        {/* Header */}
        <div className="mb-16 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
            👨‍👩‍👧‍👦 Para Pais e Responsáveis
          </div>
          <h2 className="mb-4 font-display text-3xl font-bold text-foreground md:text-4xl">
            Simplificamos a sua vida
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Chega de fotos de listas no grupo do WhatsApp. Tudo organizado, acessível e fácil de compartilhar.
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {benefits.map((benefit, index) => (
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
