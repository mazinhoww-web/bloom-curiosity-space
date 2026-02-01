import { ChevronRight, Heart } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CepAutocomplete } from "@/components/search/CepAutocomplete";
import { normalizeCep, isCepSearch } from "@/lib/school-utils";

export function FinalCTA() {
  const [cep, setCep] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCep = normalizeCep(cep);
    if (cleanCep.length >= 5) {
      navigate(`/escolas?cep=${cleanCep}`);
    }
  };

  const handleCepSelect = (selectedCep: string) => {
    const cleanCep = normalizeCep(selectedCep);
    if (cleanCep.length >= 5) {
      navigate(`/escolas?cep=${cleanCep}`);
    }
  };

  const isValidCep = isCepSearch(cep);

  return (
    <section className="py-20 md:py-28 bg-gradient-to-br from-primary via-primary to-secondary">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          {/* Empathy */}
          <div className="mb-6 inline-flex items-center gap-2 text-white/80">
            <Heart className="h-5 w-5" />
            <span className="text-sm font-medium">Comece o ano letivo tranquilo</span>
          </div>

          {/* Headline */}
          <h2 className="mb-6 font-display text-3xl font-bold text-white md:text-4xl">
            Pronto para encontrar a lista?
          </h2>
          <p className="mb-10 text-lg text-white/90">
            Digite o CEP e veja a lista de materiais da escola do seu filho agora mesmo.
          </p>

          {/* Search Form with Autocomplete */}
          <form onSubmit={handleSearch} className="mx-auto max-w-lg">
            <div className="flex flex-col gap-3 sm:flex-row">
              <CepAutocomplete
                value={cep}
                onChange={setCep}
                onSelect={handleCepSelect}
                placeholder="Digite o CEP da escola"
                className="flex-1"
                inputClassName="h-14 rounded-xl border-0 bg-white pl-5 pr-12 text-lg shadow-xl placeholder:text-muted-foreground/70 focus-visible:ring-4 focus-visible:ring-white/30"
              />
              <Button 
                type="submit" 
                size="lg"
                disabled={!isValidCep}
                className="h-14 rounded-xl bg-accent px-8 text-lg font-bold shadow-xl transition-all hover:scale-105 hover:bg-accent/90 disabled:opacity-50"
              >
                Buscar
                <ChevronRight className="ml-1 h-5 w-5" />
              </Button>
            </div>
          </form>

          {/* Final Reassurance */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4 text-sm text-white/80">
            <span>✓ Gratuito</span>
            <span className="hidden sm:inline">•</span>
            <span>✓ Sem cadastro</span>
            <span className="hidden sm:inline">•</span>
            <span>✓ Leva menos de 1 minuto</span>
          </div>
        </div>
      </div>
    </section>
  );
}
