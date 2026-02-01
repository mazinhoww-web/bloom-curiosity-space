import { Search, Upload, ChevronRight } from "lucide-react";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function HeroSearch() {
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
          {/* Headline */}
          <h1 className="mb-6 font-display text-4xl font-bold tracking-tight text-white md:text-5xl lg:text-6xl">
            A lista de materiais da{" "}
            <span className="relative inline-block">
              <span className="relative z-10">escola do seu filho</span>
              <span className="absolute bottom-1 left-0 right-0 h-3 bg-accent/40 -z-0" />
            </span>
            {" "}em um só lugar
          </h1>

          {/* Subheadline */}
          <p className="mb-10 text-lg text-white/90 md:text-xl leading-relaxed">
            Busque pelo CEP, encontre a escola, veja a lista completa de materiais 
            e compre com links diretos para as melhores lojas.
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
                className="h-14 rounded-xl bg-accent px-8 text-lg font-bold shadow-xl transition-all hover:scale-105 hover:bg-accent/90 hover:shadow-2xl"
              >
                Buscar escolas
                <ChevronRight className="ml-1 h-5 w-5" />
              </Button>
            </div>
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
                Contribuir com uma lista
              </Button>
            </Link>
          </div>

          {/* Trust Indicators */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-sm text-white/80">
            <div className="flex items-center gap-2">
              <span className="text-xl">🏫</span>
              <span>+500 escolas</span>
            </div>
            <div className="h-4 w-px bg-white/30 hidden sm:block" />
            <div className="flex items-center gap-2">
              <span className="text-xl">🛒</span>
              <span>Links diretos de compra</span>
            </div>
            <div className="h-4 w-px bg-white/30 hidden sm:block" />
            <div className="flex items-center gap-2">
              <span className="text-xl">💬</span>
              <span>Compartilhe pelo WhatsApp</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
