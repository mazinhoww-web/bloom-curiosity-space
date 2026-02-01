import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  Upload,
  Brain,
  ListChecks,
  ShoppingCart,
  Users,
  School,
  Store,
  Tag,
  ArrowRight,
  CheckCircle2,
  BarChart3,
  Zap,
  TrendingUp,
  MapPin,
  Send,
} from "lucide-react";

export default function Partners() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    partnerType: "escola",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.email.trim()) {
      toast({
        title: "Preencha os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    // Simulate submission
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    toast({
      title: "Mensagem enviada!",
      description: "Entraremos em contato em breve.",
    });
    
    setFormData({ name: "", email: "", partnerType: "escola", message: "" });
    setIsSubmitting(false);
  };

  return (
    <MainLayout>
      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-secondary py-20 md:py-32">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute left-[10%] top-[20%] h-32 w-32 rounded-full bg-white blur-3xl" />
          <div className="absolute right-[20%] bottom-[20%] h-40 w-40 rounded-full bg-white blur-3xl" />
        </div>
        
        <div className="container relative">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="font-display text-4xl font-bold tracking-tight text-white md:text-5xl lg:text-6xl">
              Listas escolares.
              <br />
              <span className="text-accent">Automatizadas. Compráveis.</span>
            </h1>
            <p className="mt-6 text-xl text-white/90 md:text-2xl">
              Do upload ao carrinho, sem fricção.
            </p>
            <Button
              size="lg"
              variant="secondary"
              className="mt-10 gap-2 text-lg"
              onClick={() => {
                document.getElementById("contato")?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              Fale conosco
              <ArrowRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* PARA ESCOLAS */}
      <section className="py-16 md:py-24">
        <div className="container">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
                <School className="h-4 w-4" />
                Para Escolas
              </div>
              <h2 className="font-display text-3xl font-bold md:text-4xl">
                Simplifique a vida dos pais.
                <br />
                <span className="text-primary">Sem custo para você.</span>
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Sua escola envia a lista em qualquer formato. 
                Nossa IA organiza e publica automaticamente.
              </p>
            </div>
            
            <div className="grid gap-4 sm:grid-cols-2">
              <Card className="border-2 border-transparent transition-all hover:border-primary/20 hover:shadow-lg">
                <CardContent className="p-6">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    <Upload className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold">Upload fácil</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    PDF, foto, planilha. Qualquer formato serve.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="border-2 border-transparent transition-all hover:border-primary/20 hover:shadow-lg">
                <CardContent className="p-6">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/10">
                    <Brain className="h-6 w-6 text-secondary" />
                  </div>
                  <h3 className="font-semibold">IA normaliza tudo</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Categorização e padronização automáticas.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="border-2 border-transparent transition-all hover:border-primary/20 hover:shadow-lg">
                <CardContent className="p-6">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
                    <Users className="h-6 w-6 text-accent" />
                  </div>
                  <h3 className="font-semibold">Menos dúvidas</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Pais encontram tudo online, sem ligar para a secretaria.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="border-2 border-transparent transition-all hover:border-primary/20 hover:shadow-lg">
                <CardContent className="p-6">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-success/10">
                    <CheckCircle2 className="h-6 w-6 text-success" />
                  </div>
                  <h3 className="font-semibold">100% gratuito</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Sem custos, sem contratos, sem complicação.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* PARA VAREJISTAS */}
      <section className="bg-muted/30 py-16 md:py-24">
        <div className="container">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div className="order-2 lg:order-1">
              <div className="grid gap-4 sm:grid-cols-2">
                <Card className="border-2 border-transparent transition-all hover:border-secondary/20 hover:shadow-lg">
                  <CardContent className="p-6">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/10">
                      <ShoppingCart className="h-6 w-6 text-secondary" />
                    </div>
                    <h3 className="font-semibold">Carrinhos prontos</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Listas inteiras montadas para sua loja. Um clique.
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="border-2 border-transparent transition-all hover:border-secondary/20 hover:shadow-lg">
                  <CardContent className="p-6">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                      <TrendingUp className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold">Tráfego qualificado</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Pais prontos para comprar, não apenas navegando.
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="border-2 border-transparent transition-all hover:border-secondary/20 hover:shadow-lg">
                  <CardContent className="p-6">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
                      <BarChart3 className="h-6 w-6 text-accent" />
                    </div>
                    <h3 className="font-semibold">Dados de demanda</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Saiba o que as escolas da região estão pedindo.
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="border-2 border-transparent transition-all hover:border-secondary/20 hover:shadow-lg">
                  <CardContent className="p-6">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-success/10">
                      <Zap className="h-6 w-6 text-success" />
                    </div>
                    <h3 className="font-semibold">Integração simples</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Links afiliados. Sem desenvolvimento necessário.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
            
            <div className="order-1 lg:order-2">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-secondary/10 px-4 py-2 text-sm font-medium text-secondary">
                <Store className="h-4 w-4" />
                Para Varejistas
              </div>
              <h2 className="font-display text-3xl font-bold md:text-4xl">
                Venda listas completas.
                <br />
                <span className="text-secondary">Não itens avulsos.</span>
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Conectamos sua loja a milhares de pais 
                que precisam comprar a lista inteira.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* PARA MARCAS */}
      <section className="py-16 md:py-24">
        <div className="container">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-accent/10 px-4 py-2 text-sm font-medium text-accent">
                <Tag className="h-4 w-4" />
                Para Marcas
              </div>
              <h2 className="font-display text-3xl font-bold md:text-4xl">
                Esteja presente
                <br />
                <span className="text-accent">no momento da decisão.</span>
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Quando a lista pede "caderno 96 folhas", 
                sua marca pode ser a escolha sugerida.
              </p>
            </div>
            
            <div className="space-y-4">
              <Card className="border-l-4 border-l-accent transition-all hover:shadow-lg">
                <CardContent className="flex items-start gap-4 p-6">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10">
                    <Brain className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Substituição inteligente</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Sugira seu produto quando a lista mencionar categoria genérica.
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-l-4 border-l-accent transition-all hover:shadow-lg">
                <CardContent className="flex items-start gap-4 p-6">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10">
                    <ShoppingCart className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Momento da compra</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Não é awareness. É conversão. Pais estão comprando agora.
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-l-4 border-l-accent transition-all hover:shadow-lg">
                <CardContent className="flex items-start gap-4 p-6">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10">
                    <MapPin className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Insights regionais</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Descubra o que cada região e série está comprando.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section className="bg-muted/30 py-16 md:py-24">
        <div className="container">
          <div className="mb-12 text-center">
            <h2 className="font-display text-3xl font-bold md:text-4xl">
              Como funciona
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Da lista ao carrinho em 5 passos simples.
            </p>
          </div>
          
          <div className="mx-auto max-w-4xl">
            <div className="relative">
              {/* Connection line */}
              <div className="absolute left-6 top-8 hidden h-[calc(100%-4rem)] w-0.5 bg-gradient-to-b from-primary via-secondary to-accent md:left-1/2 md:-translate-x-1/2 md:block" />
              
              <div className="space-y-8 md:space-y-12">
                {[
                  { icon: Upload, title: "Upload", desc: "Escola envia a lista em qualquer formato", color: "bg-primary" },
                  { icon: Brain, title: "IA processa", desc: "Itens são normalizados e categorizados", color: "bg-secondary" },
                  { icon: ListChecks, title: "Lista publicada", desc: "Disponível para busca por CEP e escola", color: "bg-accent" },
                  { icon: Store, title: "Carrinhos por loja", desc: "Cada varejista parceiro recebe links prontos", color: "bg-primary" },
                  { icon: Users, title: "Pais compram", desc: "Um clique leva ao carrinho completo", color: "bg-success" },
                ].map((step, index) => (
                  <div
                    key={step.title}
                    className={`relative flex items-start gap-6 md:gap-12 ${
                      index % 2 === 1 ? "md:flex-row-reverse" : ""
                    }`}
                  >
                    <div className={`flex-1 ${index % 2 === 1 ? "md:text-right" : ""}`}>
                      <h3 className="text-xl font-semibold">{step.title}</h3>
                      <p className="mt-1 text-muted-foreground">{step.desc}</p>
                    </div>
                    
                    <div className={`relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${step.color} shadow-lg`}>
                      <step.icon className="h-6 w-6 text-white" />
                    </div>
                    
                    <div className="hidden flex-1 md:block" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA / FORMULÁRIO */}
      <section id="contato" className="py-16 md:py-24">
        <div className="container">
          <div className="mx-auto max-w-2xl">
            <div className="mb-10 text-center">
              <h2 className="font-display text-3xl font-bold md:text-4xl">
                Vamos conversar?
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Conte como podemos ajudar sua escola, loja ou marca.
              </p>
            </div>
            
            <Card className="shadow-xl">
              <CardContent className="p-6 md:p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome *</Label>
                      <Input
                        id="name"
                        placeholder="Seu nome"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="seu@email.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <Label>Tipo de parceria</Label>
                    <RadioGroup
                      value={formData.partnerType}
                      onValueChange={(value) => setFormData({ ...formData, partnerType: value })}
                      className="grid grid-cols-3 gap-4"
                    >
                      <div>
                        <RadioGroupItem
                          value="escola"
                          id="escola"
                          className="peer sr-only"
                        />
                        <Label
                          htmlFor="escola"
                          className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-muted bg-transparent p-4 transition-all hover:bg-muted peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                        >
                          <School className="mb-2 h-6 w-6" />
                          <span className="text-sm font-medium">Escola</span>
                        </Label>
                      </div>
                      <div>
                        <RadioGroupItem
                          value="varejista"
                          id="varejista"
                          className="peer sr-only"
                        />
                        <Label
                          htmlFor="varejista"
                          className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-muted bg-transparent p-4 transition-all hover:bg-muted peer-data-[state=checked]:border-secondary peer-data-[state=checked]:bg-secondary/5"
                        >
                          <Store className="mb-2 h-6 w-6" />
                          <span className="text-sm font-medium">Varejista</span>
                        </Label>
                      </div>
                      <div>
                        <RadioGroupItem
                          value="marca"
                          id="marca"
                          className="peer sr-only"
                        />
                        <Label
                          htmlFor="marca"
                          className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-muted bg-transparent p-4 transition-all hover:bg-muted peer-data-[state=checked]:border-accent peer-data-[state=checked]:bg-accent/5"
                        >
                          <Tag className="mb-2 h-6 w-6" />
                          <span className="text-sm font-medium">Marca</span>
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="message">Mensagem (opcional)</Label>
                    <Textarea
                      id="message"
                      placeholder="Como podemos ajudar?"
                      rows={4}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    />
                  </div>
                  
                  <Button
                    type="submit"
                    size="lg"
                    className="w-full gap-2"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      "Enviando..."
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Enviar mensagem
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
