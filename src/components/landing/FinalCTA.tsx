import { Search, ChevronRight } from "lucide-react";
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
          {/* Headline */}
          <h2 className="mb-6 font-display text-3xl font-bold text-white md:text-4xl">
            Pronto para encontrar a lista de materiais?
          </h2>
          <p className="mb-10 text-lg text-white/90">
            Digite o CEP da escola e comece agora mesmo. É grátis e não precisa de cadastro.
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

          {/* Reassurance */}
          <p className="mt-8 text-sm text-white/70">
            ✓ Sem cadastro &nbsp;&nbsp; ✓ 100% gratuito &nbsp;&nbsp; ✓ Acesso imediato
          </p>
        </div>
      </div>
    </section>
  );
}
