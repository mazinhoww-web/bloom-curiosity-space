import { FileText, Users } from "lucide-react";

export function BrandsStats() {
  return (
    <section className="bg-background py-16 md:py-20">
      <div className="container">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="mb-4 font-display text-2xl font-bold text-foreground md:text-3xl">
            O que é a Lista Pronta?
          </h2>
          <p className="mb-12 text-muted-foreground md:text-lg">
            A Lista Pronta é a solução de listas de materiais escolares que milhões de famílias 
            utilizam para fazer suas compras de volta às aulas.
          </p>
        </div>

        {/* Stats circles */}
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16">
          <div className="flex flex-col items-center">
            <div className="mb-4 flex h-36 w-36 flex-col items-center justify-center rounded-full border-4 border-primary/30 bg-primary/5 md:h-44 md:w-44">
              <span className="font-display text-3xl font-bold text-primary md:text-4xl">89%</span>
              <div className="mt-1 flex items-center gap-1 text-muted-foreground">
                <FileText className="h-4 w-4" />
                <span className="text-xs">dos pais</span>
              </div>
            </div>
            <p className="max-w-[160px] text-center text-sm text-muted-foreground">
              dos pais pesquisados compraram a maioria ou todos os itens da lista
            </p>
          </div>

          <div className="flex flex-col items-center">
            <div className="mb-4 flex h-36 w-36 flex-col items-center justify-center rounded-full border-4 border-secondary/30 bg-secondary/5 md:h-44 md:w-44">
              <span className="font-display text-3xl font-bold text-secondary md:text-4xl">84%</span>
              <div className="mt-1 flex items-center gap-1 text-muted-foreground">
                <Users className="h-4 w-4" />
                <span className="text-xs">propensos</span>
              </div>
            </div>
            <p className="max-w-[160px] text-center text-sm text-muted-foreground">
              dos pais provavelmente comprarão uma marca recomendada pelo professor
            </p>
          </div>
        </div>

        {/* Highlight box */}
        <div className="mx-auto mt-12 max-w-xl rounded-2xl border-2 border-primary/20 bg-primary/5 p-6 text-center">
          <p className="font-display text-lg font-semibold text-foreground md:text-xl">
            Com mais de <span className="text-primary">2 milhões de listas verificadas</span>,
            <br />
            a Lista Pronta é líder em listas de materiais escolares.
          </p>
        </div>
      </div>
    </section>
  );
}
