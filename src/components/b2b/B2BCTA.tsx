import { InstitutionContactForm } from "./InstitutionContactForm";

export function B2BCTA() {
  return (
    <section id="contato" className="py-20 md:py-28 bg-foreground">
      <div className="container">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          {/* Left: Text */}
          <div>
            <h2 className="mb-6 font-display text-3xl font-bold text-background md:text-4xl">
              Pronto para modernizar a gestão de listas?
            </h2>
            <p className="mb-8 text-lg text-muted leading-relaxed">
              Converse com nosso time para entender como a plataforma pode se adaptar 
              às necessidades da sua instituição.
            </p>

            {/* Value props */}
            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/20">
                  <span className="text-primary text-sm">✓</span>
                </div>
                <div>
                  <p className="font-medium text-background">Demonstração personalizada</p>
                  <p className="text-sm text-muted">Mostramos como funciona para sua realidade</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/20">
                  <span className="text-primary text-sm">✓</span>
                </div>
                <div>
                  <p className="font-medium text-background">Suporte de implantação</p>
                  <p className="text-sm text-muted">Ajudamos a migrar suas listas existentes</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/20">
                  <span className="text-primary text-sm">✓</span>
                </div>
                <div>
                  <p className="font-medium text-background">Sem compromisso</p>
                  <p className="text-sm text-muted">Avalie antes de qualquer decisão</p>
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted">
              <span>📧 listapronta@gmail.com</span>
              <span className="hidden sm:inline">•</span>
              <span>📞 (65) 9 9622-7110</span>
            </div>
          </div>

          {/* Right: Form */}
          <div>
            <InstitutionContactForm />
          </div>
        </div>
      </div>
    </section>
  );
}
