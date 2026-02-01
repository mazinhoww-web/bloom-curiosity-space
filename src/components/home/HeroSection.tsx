import { Search, Upload } from "lucide-react";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function HeroSection() {
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
    <section className="gradient-hero relative overflow-hidden py-16 md:py-24 lg:py-32">
      {/* Decorative elements */}
      <div className="absolute left-0 top-0 h-full w-full">
        <div className="absolute left-[10%] top-[20%] h-16 w-16 animate-float rounded-2xl bg-white/10" />
        <div className="absolute right-[15%] top-[30%] h-12 w-12 animate-float rounded-xl bg-white/10" style={{ animationDelay: "1s" }} />
        <div className="absolute bottom-[20%] left-[20%] h-20 w-20 animate-float rounded-3xl bg-white/10" style={{ animationDelay: "0.5s" }} />
        <div className="absolute bottom-[30%] right-[10%] h-14 w-14 animate-float rounded-2xl bg-white/10" style={{ animationDelay: "1.5s" }} />
      </div>

      <div className="container relative">
        <div className="mx-auto max-w-3xl text-center">
          {/* Badge */}
          <div className="mb-6 inline-flex items-center rounded-full bg-white/20 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm">
            ✨ Encontre listas de materiais em segundos
          </div>

          {/* Title */}
          <h1 className="mb-6 font-display text-4xl font-bold tracking-tight text-white md:text-5xl lg:text-6xl">
            Listas de materiais{" "}
            <span className="relative whitespace-nowrap">
              <span className="relative">escolares</span>
            </span>{" "}
            simplificadas
          </h1>

          {/* Subtitle */}
          <p className="mb-10 text-lg text-white/90 md:text-xl">
            Busque por CEP, encontre a escola do seu filho e acesse a lista completa 
            de materiais com preços e links para compra.
          </p>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="mx-auto flex max-w-md flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Input
                type="text"
                placeholder="Digite o CEP da escola"
                value={cep}
                onChange={(e) => setCep(formatCep(e.target.value))}
                maxLength={9}
                className="h-14 rounded-xl border-0 bg-white pl-5 pr-12 text-lg shadow-lg placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-white"
              />
              <Search className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            </div>
            <Button 
              type="submit" 
              size="lg"
              className="h-14 rounded-xl bg-accent px-8 text-lg font-semibold shadow-lg transition-transform hover:scale-105 hover:bg-accent/90"
            >
              Buscar
            </Button>
          </form>

          {/* CTA for contributing */}
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <span className="text-white/70 text-sm">Tem a lista da escola?</span>
            <Link to="/contribuir">
              <Button variant="secondary" size="sm" className="gap-2">
                <Upload className="h-4 w-4" />
                Contribuir lista
              </Button>
            </Link>
          </div>

          {/* Trust text */}
          <p className="mt-6 text-sm text-white/70">
            📚 Mais de 500 escolas cadastradas • 🛒 Links diretos para compra • 💬 Compartilhe com outros pais
          </p>
        </div>
      </div>
    </section>
  );
}
