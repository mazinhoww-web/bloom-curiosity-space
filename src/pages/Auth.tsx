import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Lock, Loader2, GraduationCap, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

const emailSchema = z.object({
  email: z.string().email("Digite um email válido"),
});

const authSchema = z.object({
  email: z.string().email("Digite um email válido"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
});

type EmailFormData = z.infer<typeof emailSchema>;
type AuthFormData = z.infer<typeof authSchema>;

type AuthMode = "magic-link" | "password";

export default function Auth() {
  const [authMode, setAuthMode] = useState<AuthMode>("magic-link");
  const [isLogin, setIsLogin] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const { signIn, signUp, signInWithMagicLink, user, isLoading, isAdmin, isSchoolAdmin } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const emailForm = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
  });

  const passwordForm = useForm<AuthFormData>({
    resolver: zodResolver(authSchema),
  });

  useEffect(() => {
    if (!isLoading && user) {
      let redirectTo = searchParams.get("redirect");
      if (!redirectTo) {
        if (isAdmin) redirectTo = "/admin";
        else if (isSchoolAdmin) redirectTo = "/escola-admin";
        else redirectTo = "/";
      }
      navigate(redirectTo, { replace: true });
    }
  }, [user, isLoading, isAdmin, isSchoolAdmin, navigate, searchParams]);

  const onMagicLinkSubmit = async (data: EmailFormData) => {
    setIsSubmitting(true);
    try {
      const { error } = await signInWithMagicLink(data.email);
      if (error) {
        toast({
          variant: "destructive",
          title: "Erro ao enviar link",
          description: getErrorMessage(error.message),
        });
      } else {
        setMagicLinkSent(true);
        toast({
          title: "Link enviado!",
          description: "Verifique seu email e clique no link para entrar.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Ocorreu um erro inesperado. Tente novamente.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const onPasswordSubmit = async (data: AuthFormData) => {
    setIsSubmitting(true);

    try {
      if (isLogin) {
        const { error } = await signIn(data.email, data.password);
        if (error) {
          toast({
            variant: "destructive",
            title: "Erro ao entrar",
            description: getErrorMessage(error.message),
          });
        } else {
          toast({
            title: "Bem-vindo de volta!",
            description: "Login realizado com sucesso.",
          });
        }
      } else {
        const { error } = await signUp(data.email, data.password);
        if (error) {
          toast({
            variant: "destructive",
            title: "Erro ao criar conta",
            description: getErrorMessage(error.message),
          });
        } else {
          toast({
            title: "Conta criada!",
            description: "Verifique seu email para confirmar o cadastro.",
          });
          passwordForm.reset();
          setIsLogin(true);
        }
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Ocorreu um erro inesperado. Tente novamente.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getErrorMessage = (message: string): string => {
    if (message.includes("Invalid login credentials")) {
      return "Email ou senha incorretos.";
    }
    if (message.includes("User already registered")) {
      return "Este email já está cadastrado. Faça login.";
    }
    if (message.includes("Email not confirmed")) {
      return "Por favor, confirme seu email antes de fazer login.";
    }
    if (message.includes("Email rate limit exceeded")) {
      return "Muitas tentativas. Aguarde alguns minutos.";
    }
    return message;
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (magicLinkSent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-md shadow-card text-center">
          <CardHeader className="space-y-1">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <Mail className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="font-display text-2xl">
              Verifique seu email
            </CardTitle>
            <CardDescription>
              Enviamos um link mágico para <strong>{emailForm.getValues("email")}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Clique no link no email para entrar automaticamente. 
              O link expira em 1 hora.
            </p>
            <Button 
              variant="outline" 
              onClick={() => setMagicLinkSent(false)}
              className="w-full"
            >
              Usar outro email
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md shadow-card">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-fun">
            <GraduationCap className="h-8 w-8 text-primary-foreground" />
          </div>
          <CardTitle className="font-display text-2xl">
            Entrar no Lista Escolar
          </CardTitle>
          <CardDescription>
            Acesse sua conta para gerenciar listas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={authMode} onValueChange={(v) => setAuthMode(v as AuthMode)} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="magic-link" className="gap-2">
                <Sparkles className="h-4 w-4" />
                Link Mágico
              </TabsTrigger>
              <TabsTrigger value="password" className="gap-2">
                <Lock className="h-4 w-4" />
                Senha
              </TabsTrigger>
            </TabsList>

            <TabsContent value="magic-link">
              <form onSubmit={emailForm.handleSubmit(onMagicLinkSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="magic-email">Email</Label>
                  <div className="relative">
                    <Input
                      id="magic-email"
                      type="email"
                      placeholder="seu@email.com"
                      className="pl-10"
                      {...emailForm.register("email")}
                    />
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  </div>
                  {emailForm.formState.errors.email && (
                    <p className="text-sm text-destructive">{emailForm.formState.errors.email.message}</p>
                  )}
                </div>

                <Button type="submit" className="w-full gap-2" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  <Sparkles className="h-4 w-4" />
                  Enviar link mágico
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  Enviaremos um link para você entrar sem precisar de senha
                </p>
              </form>
            </TabsContent>

            <TabsContent value="password">
              <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      className="pl-10"
                      {...passwordForm.register("email")}
                    />
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  </div>
                  {passwordForm.formState.errors.email && (
                    <p className="text-sm text-destructive">{passwordForm.formState.errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      className="pl-10"
                      {...passwordForm.register("password")}
                    />
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  </div>
                  {passwordForm.formState.errors.password && (
                    <p className="text-sm text-destructive">{passwordForm.formState.errors.password.message}</p>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isLogin ? "Entrar" : "Criar conta"}
                </Button>
              </form>

              <div className="mt-6 text-center text-sm">
                <span className="text-muted-foreground">
                  {isLogin ? "Não tem uma conta? " : "Já tem uma conta? "}
                </span>
                <button
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  className="font-medium text-primary hover:underline"
                >
                  {isLogin ? "Criar conta" : "Entrar"}
                </button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}