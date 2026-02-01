const brandNames = [
  "Faber-Castell",
  "Tilibra",
  "BIC",
  "Acrilex",
  "Staedtler",
  "Pilot",
  "Compactor",
  "Foroni",
  "Maped",
  "Cis",
  "Koala",
  "Dello",
  "Pentel",
  "3M",
  "Scotch",
  "UHU",
];

export function BrandsLogos() {
  return (
    <section className="bg-background py-16 md:py-20">
      <div className="container">
        <h2 className="mb-12 text-center font-display text-2xl font-bold text-foreground md:text-3xl">
          Junte-se a uma lista crescente de marcas líderes.
        </h2>

        <div className="grid grid-cols-4 gap-4 md:grid-cols-6 lg:grid-cols-8">
          {brandNames.map((brand) => (
            <div
              key={brand}
              className="flex h-16 items-center justify-center rounded-xl border bg-muted/30 px-3 transition-all hover:border-primary/30 hover:bg-muted/50"
            >
              <span className="text-center text-xs font-medium text-muted-foreground md:text-sm">
                {brand}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
