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
  ArrowRight,
  ShoppingCart,
  Target,
  BarChart3,
  Database,
  Link2,
  Code,
  Layers,
  TrendingUp,
  Users,
  MapPin,
  Send,
  DollarSign,
  Percent,
  Eye,
} from "lucide-react";

export default function Partners() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    company: "",
    email: "",
    partnerType: "varejo",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.email.trim() || !formData.company.trim()) {
      toast({
        title: "Preencha os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    toast({
      title: "Mensagem enviada!",
      description: "Nossa equipe comercial entrará em contato em até 24h.",
    });
    
    setFormData({ name: "", company: "", email: "", partnerType: "varejo", message: "" });
    setIsSubmitting(false);
  };

  return (
    <MainLayout>
      {/* HERO - Focado em decisão de compra */}
      <section className="relative overflow-hidden bg-foreground py-20 md:py-28 lg:py-36">
        <div className="absolute inset-0 opacity-5">
          <div className="h-full w-full" style={{
            backgroundImage: `linear-gradient(hsl(var(--accent)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--accent)) 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }} />
        </div>

        <div className="container relative z-10">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-2 text-sm font-medium text-accent">
              <Target className="h-4 w-4" />
              Plataforma de Afiliação para Materiais Escolares
            </div>

            <h1 className="mb-6 font-display text-4xl font-bold tracking-tight text-background md:text-5xl lg:text-6xl">
              Esteja onde a decisão de compra acontece
            </h1>

            <p className="mb-10 text-lg text-muted md:text-xl leading-relaxed">
              Milhares de pais acessam listas de materiais prontos para comprar. 
              Conecte sua loja, marca ou plataforma a esse fluxo de alta conversão.
            </p>

            <Button 
              size="lg"
              className="h-14 rounded-xl bg-accent px-8 text-lg font-semibold shadow-xl transition-all hover:scale-105 hover:bg-accent/90"
              onClick={() => document.getElementById("contato")?.scrollIntoView({ behavior: "smooth" })}
            >
              Quero ser parceiro
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* CONTEXTO - Alta intenção de compra */}
      <section className="py-20 md:py-28 bg-background">
        <div className="container">
          <div className="mb-16 text-center">
            <p className="mb-4 text-sm font-semibold uppercase tracking-wider text-accent">
              O Contexto
            </p>
            <h2 className="mb-4 font-display text-3xl font-bold text-foreground md:text-4xl">
              Pais compram exatamente o que a escola pede
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              Diferente de e-commerce tradicional, aqui não há navegação. 
              Há uma lista definida e intenção de compra imediata.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <Card className="border-0 bg-muted/50 p-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
                <ShoppingCart className="h-8 w-8 text-accent" />
              </div>
              <div className="mb-2 font-display text-4xl font-bold text-foreground">100%</div>
              <h3 className="mb-2 font-semibold text-foreground">Intenção de compra</h3>
              <p className="text-sm text-muted-foreground">
                Não é tráfego de curiosidade. São pais que precisam comprar agora.
              </p>
            </Card>

            <Card className="border-0 bg-muted/50 p-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <div className="mb-2 font-display text-4xl font-bold text-foreground">R$ 350</div>
              <h3 className="mb-2 font-semibold text-foreground">Ticket médio</h3>
              <p className="text-sm text-muted-foreground">
                Listas completas, não itens avulsos. Carrinhos maiores, margens melhores.
              </p>
            </Card>

            <Card className="border-0 bg-muted/50 p-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary/10">
                <TrendingUp className="h-8 w-8 text-secondary" />
              </div>
              <div className="mb-2 font-display text-4xl font-bold text-foreground">Jan-Fev</div>
              <h3 className="mb-2 font-semibold text-foreground">Sazonalidade previsível</h3>
              <p className="text-sm text-muted-foreground">
                Demanda concentrada e antecipável. Planeje estoque e campanhas.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* DADOS - Estrutura e escala */}
      <section className="py-20 md:py-28 bg-muted/30">
        <div className="container">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="mb-4 text-sm font-semibold uppercase tracking-wider text-primary">
                Os Dados
              </p>
              <h2 className="mb-6 font-display text-3xl font-bold text-foreground md:text-4xl">
                Informação estruturada em escala nacional
              </h2>
              <p className="mb-8 text-lg text-muted-foreground leading-relaxed">
                Não são PDFs ou fotos. São dados normalizados, categorizados e prontos 
                para integração com sua plataforma.
              </p>

              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Database className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Listas reais</h3>
                    <p className="text-sm text-muted-foreground">
                      Dados reais de escolas, não estimativas. Atualização contínua.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Layers className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Estrutura padronizada</h3>
                    <p className="text-sm text-muted-foreground">
                      Itens categorizados, quantidades definidas, especificações claras.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Cobertura nacional</h3>
                    <p className="text-sm text-muted-foreground">
                      Escolas de todo o Brasil. Segmentação por região, cidade, bairro.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-foreground p-8 md:p-10">
              <div className="space-y-4">
                <div className="text-sm font-medium text-muted">Exemplo de dados estruturados</div>
                <div className="rounded-lg bg-muted-foreground/10 p-4 font-mono text-xs text-muted">
                  <div className="text-accent">{"{"}</div>
                  <div className="pl-4">
                    <span className="text-secondary">"escola"</span>: <span className="text-background">"Colégio São Paulo"</span>,
                  </div>
                  <div className="pl-4">
                    <span className="text-secondary">"serie"</span>: <span className="text-background">"2º Ano Fundamental"</span>,
                  </div>
                  <div className="pl-4">
                    <span className="text-secondary">"itens"</span>: [
                  </div>
                  <div className="pl-8">
                    {"{"} <span className="text-secondary">"nome"</span>: <span className="text-background">"Caderno 96 folhas"</span>,
                  </div>
                  <div className="pl-10">
                    <span className="text-secondary">"categoria"</span>: <span className="text-background">"Cadernos"</span>,
                  </div>
                  <div className="pl-10">
                    <span className="text-secondary">"quantidade"</span>: <span className="text-accent">4</span> {"}"},
                  </div>
                  <div className="pl-8">
                    {"{"} <span className="text-secondary">"nome"</span>: <span className="text-background">"Lápis grafite"</span>,
                  </div>
                  <div className="pl-10">
                    <span className="text-secondary">"categoria"</span>: <span className="text-background">"Escrita"</span>,
                  </div>
                  <div className="pl-10">
                    <span className="text-secondary">"quantidade"</span>: <span className="text-accent">12</span> {"}"}
                  </div>
                  <div className="pl-4">]</div>
                  <div className="text-accent">{"}"}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FORMAS DE INTEGRAÇÃO */}
      <section className="py-20 md:py-28 bg-background">
        <div className="container">
          <div className="mb-16 text-center">
            <p className="mb-4 text-sm font-semibold uppercase tracking-wider text-secondary">
              Integração
            </p>
            <h2 className="mb-4 font-display text-3xl font-bold text-foreground md:text-4xl">
              Escolha como se conectar
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              Do mais simples ao mais customizado. Modelos flexíveis para diferentes maturidades técnicas.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            {/* Links Afiliados */}
            <Card className="group overflow-hidden border-2 transition-all hover:border-accent/50 hover:shadow-lg">
              <CardContent className="p-8">
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-accent/10 transition-colors group-hover:bg-accent">
                  <Link2 className="h-7 w-7 text-accent transition-colors group-hover:text-white" />
                </div>
                <div className="mb-2 text-sm font-medium text-accent">Básico</div>
                <h3 className="mb-3 font-display text-xl font-bold text-foreground">
                  Links Afiliados
                </h3>
                <p className="mb-6 text-muted-foreground leading-relaxed">
                  Receba links diretos para seus produtos quando aparecerem nas listas. 
                  Sem desenvolvimento, sem integração técnica.
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2 text-muted-foreground">
                    <DollarSign className="h-4 w-4 text-accent" />
                    Modelo CPC ou CPA
                  </li>
                  <li className="flex items-center gap-2 text-muted-foreground">
                    <Percent className="h-4 w-4 text-accent" />
                    Tracking de conversão
                  </li>
                  <li className="flex items-center gap-2 text-muted-foreground">
                    <Eye className="h-4 w-4 text-accent" />
                    Dashboard de performance
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* API */}
            <Card className="group overflow-hidden border-2 transition-all hover:border-primary/50 hover:shadow-lg">
              <CardContent className="p-8">
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary">
                  <Code className="h-7 w-7 text-primary transition-colors group-hover:text-white" />
                </div>
                <div className="mb-2 text-sm font-medium text-primary">Avançado</div>
                <h3 className="mb-3 font-display text-xl font-bold text-foreground">
                  API de Dados
                </h3>
                <p className="mb-6 text-muted-foreground leading-relaxed">
                  Acesse os dados estruturados via API REST. 
                  Integre diretamente ao seu sistema de e-commerce ou ERP.
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2 text-muted-foreground">
                    <Database className="h-4 w-4 text-primary" />
                    Dados em tempo real
                  </li>
                  <li className="flex items-center gap-2 text-muted-foreground">
                    <BarChart3 className="h-4 w-4 text-primary" />
                    Endpoints de analytics
                  </li>
                  <li className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4 text-primary" />
                    Filtros por região
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* White-label */}
            <Card className="group overflow-hidden border-2 transition-all hover:border-secondary/50 hover:shadow-lg">
              <CardContent className="p-8">
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-secondary/10 transition-colors group-hover:bg-secondary">
                  <Layers className="h-7 w-7 text-secondary transition-colors group-hover:text-white" />
                </div>
                <div className="mb-2 text-sm font-medium text-secondary">Enterprise</div>
                <h3 className="mb-3 font-display text-xl font-bold text-foreground">
                  White-label
                </h3>
                <p className="mb-6 text-muted-foreground leading-relaxed">
                  Ofereça a experiência completa de listas dentro do seu próprio ambiente. 
                  Sua marca, nossa infraestrutura.
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2 text-muted-foreground">
                    <Target className="h-4 w-4 text-secondary" />
                    Customização visual
                  </li>
                  <li className="flex items-center gap-2 text-muted-foreground">
                    <Users className="h-4 w-4 text-secondary" />
                    Domínio próprio
                  </li>
                  <li className="flex items-center gap-2 text-muted-foreground">
                    <TrendingUp className="h-4 w-4 text-secondary" />
                    SLA dedicado
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA FINAL - Formulário de contato */}
      <section id="contato" className="py-20 md:py-28 bg-foreground">
        <div className="container">
          <div className="mx-auto max-w-2xl">
            <div className="mb-10 text-center">
              <h2 className="mb-4 font-display text-3xl font-bold text-background md:text-4xl">
                Fale com o time comercial
              </h2>
              <p className="text-lg text-muted">
                Conte sobre sua empresa e objetivos. Resposta em até 24h úteis.
              </p>
            </div>

            <Card className="border-0 bg-card shadow-2xl">
              <CardContent className="p-6 md:p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">Seu nome *</Label>
                      <Input
                        id="name"
                        placeholder="Nome completo"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="company">Empresa *</Label>
                      <Input
                        id="company"
                        placeholder="Nome da empresa"
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email corporativo *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="voce@empresa.com.br"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-3">
                    <Label>Tipo de parceria</Label>
                    <RadioGroup
                      value={formData.partnerType}
                      onValueChange={(value) => setFormData({ ...formData, partnerType: value })}
                      className="grid gap-3 sm:grid-cols-3"
                    >
                      <Label
                        htmlFor="varejo"
                        className={`flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-all ${
                          formData.partnerType === "varejo" ? "border-accent bg-accent/5" : "hover:bg-muted/50"
                        }`}
                      >
                        <RadioGroupItem value="varejo" id="varejo" />
                        <div>
                          <div className="font-medium">Varejo</div>
                          <div className="text-xs text-muted-foreground">E-commerce, papelarias</div>
                        </div>
                      </Label>
                      <Label
                        htmlFor="marca"
                        className={`flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-all ${
                          formData.partnerType === "marca" ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                        }`}
                      >
                        <RadioGroupItem value="marca" id="marca" />
                        <div>
                          <div className="font-medium">Marca</div>
                          <div className="text-xs text-muted-foreground">Fabricantes, distribuidores</div>
                        </div>
                      </Label>
                      <Label
                        htmlFor="edtech"
                        className={`flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-all ${
                          formData.partnerType === "edtech" ? "border-secondary bg-secondary/5" : "hover:bg-muted/50"
                        }`}
                      >
                        <RadioGroupItem value="edtech" id="edtech" />
                        <div>
                          <div className="font-medium">Edtech</div>
                          <div className="text-xs text-muted-foreground">Plataformas, sistemas</div>
                        </div>
                      </Label>
                    </RadioGroup>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Como podemos ajudar?</Label>
                    <Textarea
                      id="message"
                      placeholder="Descreva seu interesse e objetivos..."
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      rows={4}
                    />
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full h-12 rounded-xl text-base font-semibold"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      "Enviando..."
                    ) : (
                      <>
                        <Send className="mr-2 h-5 w-5" />
                        Enviar mensagem
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              Sem compromisso. Sem spam. Apenas negócios.
            </p>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
