import { Search, ChevronRight, Heart } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function FinalCTA() {
  const [cep, setCep] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (cep.trim()) {
      navigate(`/escolas?cep=${cep.replace(/\D/g, "")}`);
    }
  };

  const formatCep = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 5) return numbers;
    return `${numbers.slice(0, 5)}-${numbers.slice(5, 8)}`;
  };

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

          {/* Search Form */}
          <form onSubmit={handleSearch} className="mx-auto max-w-lg">
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Input
                  type="text"
                  placeholder="Digite o CEP da escola"
                  value={cep}
                  onChange={(e) => setCep(formatCep(e.target.value))}
                  maxLength={9}
                  className="h-14 rounded-xl border-0 bg-white pl-5 pr-12 text-lg shadow-xl placeholder:text-muted-foreground/70 focus-visible:ring-4 focus-visible:ring-white/30"
                />
                <Search className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              </div>
              <Button 
                type="submit" 
                size="lg"
                className="h-14 rounded-xl bg-accent px-8 text-lg font-bold shadow-xl transition-all hover:scale-105 hover:bg-accent/90"
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
