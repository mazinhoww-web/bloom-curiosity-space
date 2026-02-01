import { Upload, ChevronRight, Heart } from "lucide-react";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CepAutocomplete } from "@/components/search/CepAutocomplete";
import { normalizeCep, isCepSearch } from "@/lib/school-utils";

export function HeroSearch() {
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
    <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary to-secondary py-20 md:py-28 lg:py-36">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute left-[5%] top-[15%] h-32 w-32 rounded-full bg-white blur-3xl" />
        <div className="absolute right-[10%] top-[25%] h-40 w-40 rounded-full bg-accent blur-3xl" />
        <div className="absolute bottom-[15%] left-[15%] h-36 w-36 rounded-full bg-secondary blur-3xl" />
        <div className="absolute bottom-[20%] right-[20%] h-28 w-28 rounded-full bg-white blur-3xl" />
      </div>

      {/* Floating Icons */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute left-[8%] top-[20%] text-4xl opacity-20 animate-float">📚</div>
        <div className="absolute right-[12%] top-[15%] text-3xl opacity-20 animate-float" style={{ animationDelay: "1s" }}>✏️</div>
        <div className="absolute bottom-[25%] left-[12%] text-3xl opacity-20 animate-float" style={{ animationDelay: "0.5s" }}>🎒</div>
        <div className="absolute bottom-[30%] right-[8%] text-4xl opacity-20 animate-float" style={{ animationDelay: "1.5s" }}>📐</div>
      </div>

      <div className="container relative z-10">
        <div className="mx-auto max-w-3xl text-center">
          {/* Empathy Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm">
            <Heart className="h-4 w-4" />
            Feito para facilitar a sua vida
          </div>

          {/* Headline - Empática */}
          <h1 className="mb-6 font-display text-4xl font-bold tracking-tight text-white md:text-5xl lg:text-6xl">
            Chega de correr atrás da{" "}
            <span className="relative inline-block">
              <span className="relative z-10">lista de materiais</span>
              <span className="absolute bottom-1 left-0 right-0 h-3 bg-accent/40 -z-0" />
            </span>
          </h1>

          {/* Subheadline - Prática */}
          <p className="mb-10 text-lg text-white/90 md:text-xl leading-relaxed">
            Encontre a lista da escola do seu filho em segundos. 
            Organizada, pronta para compartilhar e com links diretos para compra.
          </p>

          {/* Search Form with Autocomplete */}
          <form onSubmit={handleSearch} className="mx-auto max-w-lg">
            <div className="flex flex-col gap-3 sm:flex-row">
              <CepAutocomplete
                value={cep}
                onChange={setCep}
                onSelect={handleCepSelect}
                placeholder="Digite o CEP da escola (mín. 5 dígitos)"
                className="flex-1"
                inputClassName="h-14 rounded-xl border-0 bg-white pl-5 pr-12 text-lg shadow-xl placeholder:text-muted-foreground/70 focus-visible:ring-4 focus-visible:ring-white/30"
              />
              <Button 
                type="submit" 
                size="lg"
                disabled={!isValidCep}
                className="h-14 rounded-xl bg-accent px-8 text-lg font-bold shadow-xl transition-all hover:scale-105 hover:bg-accent/90 hover:shadow-2xl disabled:opacity-50 disabled:hover:scale-100"
              >
                Buscar escola
                <ChevronRight className="ml-1 h-5 w-5" />
              </Button>
            </div>
            {cep && !isValidCep && (
              <p className="mt-2 text-sm text-white/70">
                Digite pelo menos 5 dígitos do CEP
              </p>
            )}
          </form>

          {/* Secondary CTA */}
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <span className="text-white/70 text-sm">Tem a lista em PDF ou foto?</span>
            <Link to="/contribuir">
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2 border-white/30 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 hover:text-white"
              >
                <Upload className="h-4 w-4" />
                Ajude outros pais
              </Button>
            </Link>
          </div>

          {/* Reassurance */}
          <p className="mt-10 text-sm text-white/70">
            ✓ Sem cadastro &nbsp;&nbsp; ✓ 100% gratuito &nbsp;&nbsp; ✓ Acesso imediato
          </p>
        </div>
      </div>
    </section>
  );
}
