import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Lock, Loader2, GraduationCap } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const authSchema = z.object({
  email: z.string().email("Digite um email válido"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
});

type AuthFormData = z.infer<typeof authSchema>;

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signIn, signUp, user, isLoading, isAdmin, isSchoolAdmin } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<AuthFormData>({
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

  const onSubmit = async (data: AuthFormData) => {
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
          reset();
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
    return message;
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
            {isLogin ? "Entrar" : "Criar conta"}
          </CardTitle>
          <CardDescription>
            {isLogin
              ? "Acesse o painel administrativo"
              : "Crie sua conta para gerenciar listas"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  className="pl-10"
                  {...register("email")}
                />
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              </div>
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
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
                  {...register("password")}
                />
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              </div>
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
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
        </CardContent>
      </Card>
    </div>
  );
}
