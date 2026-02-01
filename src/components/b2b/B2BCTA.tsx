import { ArrowRight, Calendar, Plug } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function B2BCTA() {
  return (
    <section className="py-20 md:py-28 bg-foreground">
      <div className="container">
        <div className="mx-auto max-w-3xl text-center">
          {/* Headline */}
          <h2 className="mb-6 font-display text-3xl font-bold text-background md:text-4xl">
            Pronto para modernizar a gestão de listas?
          </h2>
          <p className="mb-10 text-lg text-muted leading-relaxed">
            Converse com nosso time para entender como a plataforma pode se adaptar 
            às necessidades da sua instituição.
          </p>

          {/* CTAs */}
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Link to="/auth">
              <Button 
                size="lg"
                className="h-14 w-full rounded-xl bg-primary px-8 text-lg font-semibold shadow-xl transition-all hover:scale-105 sm:w-auto"
              >
                <Calendar className="mr-2 h-5 w-5" />
                Agendar demonstração
              </Button>
            </Link>
            <Button 
              size="lg"
              variant="outline"
              className="h-14 w-full rounded-xl border-muted-foreground/30 bg-transparent px-8 text-lg font-semibold text-background hover:bg-muted-foreground/10 hover:text-background sm:w-auto"
            >
              <Plug className="mr-2 h-5 w-5" />
              Solicitar integração
            </Button>
          </div>

          {/* Contact Info */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-muted">
            <span>📧 contato@listaescolar.com.br</span>
            <span className="hidden sm:inline">•</span>
            <span>📞 (11) 99999-9999</span>
          </div>

          {/* Trust */}
          <p className="mt-8 text-xs text-muted-foreground">
            Sem compromisso. Demonstração personalizada. Resposta em até 24h úteis.
          </p>
        </div>
      </div>
    </section>
  );
}
