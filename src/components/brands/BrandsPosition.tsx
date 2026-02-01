import { School, Users, ShoppingBag } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function BrandsPosition() {
  return (
    <section className="bg-muted/30 py-16 md:py-20">
      <div className="container">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* Left: Cards illustration */}
          <div className="relative">
            <div className="grid gap-4 sm:grid-cols-2">
              <Card className="transform transition-transform hover:-translate-y-1">
                <CardContent className="p-4">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <School className="h-5 w-5 text-primary" />
                  </div>
                  <p className="text-sm text-foreground">
                    Escolas gerenciam listas de forma conveniente
                  </p>
                </CardContent>
              </Card>

              <Card className="transform transition-transform hover:-translate-y-1 sm:mt-6">
                <CardContent className="p-4">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10">
                    <Users className="h-5 w-5 text-secondary" />
                  </div>
                  <p className="text-sm text-foreground">
                    Famílias compram materiais com facilidade
                  </p>
                </CardContent>
              </Card>

              <Card className="transform transition-transform hover:-translate-y-1 sm:col-span-2 sm:mx-auto sm:max-w-[200px]">
                <CardContent className="p-4">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-accent/20">
                    <ShoppingBag className="h-5 w-5 text-accent-foreground" />
                  </div>
                  <p className="text-sm text-foreground">
                    Varejistas potencializam suas vendas
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Right: Content */}
          <div>
            <h2 className="mb-6 font-display text-2xl font-bold text-foreground md:text-3xl">
              Nossa posição única no processo de volta às aulas.
            </h2>
            <p className="text-muted-foreground md:text-lg">
              Por mais de 5 anos, fornecemos o produto que escolas e redes escolares 
              dependem para gerenciar convenientemente suas listas de materiais e que, 
              por sua vez, famílias confiam para facilitar suas compras.
            </p>
            <p className="mt-4 text-muted-foreground md:text-lg">
              Ao longo dos anos, grandes varejistas como Kalunga, Amazon, Magazine Luiza 
              e outros têm recorrido a nós para impulsionar seus sistemas de listas de 
              materiais escolares. É essa posição única que nos torna especialistas em 
              materiais de volta às aulas.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
