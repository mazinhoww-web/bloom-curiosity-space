
# Plano: Correção do Bug de Acesso ao Painel Admin

## Diagnóstico do Problema

Foi identificada uma **race condition** no fluxo de autenticação que impede usuários admin de acessarem o painel.

### Fluxo Atual (com bug)
```text
1. getSession() retorna sessão
2. setUser(user) 
3. checkAdminRole(userId) ← chamada assíncrona INICIA
4. setIsLoading(false) ← PROBLEMA: executado ANTES do passo 3 terminar
5. AdminLayout verifica: isLoading=false, isAdmin=false
6. AdminLayout redireciona para "/" ← usuário removido do /admin
7. checkAdminRole termina: setIsAdmin(true) ← tarde demais!
```

### Fluxo Corrigido
```text
1. getSession() retorna sessão
2. setUser(user)
3. await checkAdminRole(userId) ← aguarda conclusão
4. setIsLoading(false) ← agora isAdmin já tem valor correto
5. AdminLayout verifica: isLoading=false, isAdmin=true
6. AdminLayout renderiza painel admin corretamente
```

---

## Solução

Modificar o `AuthContext.tsx` para garantir que o loading só termine após a verificação do papel de admin.

### Arquivo: `src/contexts/AuthContext.tsx`

**Mudanças necessárias:**

1. **Aguardar checkAdminRole antes de setIsLoading(false)**
   - Mudar a chamada no `getSession()` para usar `await`
   - Garantir que `isLoading` só vire `false` após a verificação completa

2. **Adicionar tratamento de erro mais robusto**
   - Garantir que `setIsLoading(false)` é chamado mesmo em caso de erro

**Código atualizado:**

```typescript
useEffect(() => {
  // Set up auth state listener FIRST
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      // Defer admin check with setTimeout to avoid deadlock
      if (session?.user) {
        setTimeout(() => {
          checkAdminRole(session.user.id);
        }, 0);
      } else {
        setIsAdmin(false);
      }
    }
  );

  // THEN check for existing session
  const initializeAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await checkAdminRole(session.user.id);  // AGUARDA conclusão
      }
    } catch (error) {
      console.error("Error initializing auth:", error);
    } finally {
      setIsLoading(false);  // SEMPRE executa após tudo
    }
  };

  initializeAuth();

  return () => subscription.unsubscribe();
}, []);
```

---

## Detalhes Técnicos

### Mudança Principal
- O `setIsLoading(false)` será movido para dentro de um bloco `finally` que só executa após o `checkAdminRole` terminar
- Isso garante que quando o `AdminLayout` verificar `isLoading`, o `isAdmin` já terá o valor correto

### Comportamento Esperado Após Correção
1. Usuário acessa `/admin`
2. `AdminLayout` mostra loading spinner
3. `AuthContext` verifica sessão E papel de admin
4. Só então `isLoading` vira `false`
5. Se `isAdmin=true`, painel é renderizado
6. Se `isAdmin=false`, redireciona para `/`

---

## Resumo das Alterações

| Arquivo | Tipo de Alteração |
|---------|-------------------|
| `src/contexts/AuthContext.tsx` | Correção do fluxo assíncrono |

### Impacto
- Zero mudanças na UI
- Zero mudanças no banco de dados
- Apenas correção de lógica no contexto de autenticação
