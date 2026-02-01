
# Plano: Otimização do Processamento CSV e Correção do Admin

## Visão Geral

Este plano resolve dois problemas críticos:
1. **Processamento CSV lento** - IA sendo chamada durante o upload, tornando o processo extremamente lento
2. **Painel admin não abre** - Race condition que impede administradores de acessarem o painel

---

## Problema 1: Processamento CSV Lento

### Diagnóstico

O fluxo atual:
```text
Frontend → Envia 500 escolas → Edge Function → 10 chamadas IA (50 cada) → Retorna
Frontend → Envia próximas 500 → Edge Function → 10 chamadas IA → Retorna
... repete para cada chunk
```

Para 180.000 escolas = 360 chunks = 3.600 chamadas de IA em série!

### Solução: Processamento em Duas Etapas

Novo fluxo:
```text
1. Upload Rápido: Frontend lê arquivo → Parse local → Mostra preview básico
2. Processamento: Envia TUDO para edge function → Processa em background
3. Inserção: Edge function insere no banco em batches
```

### Arquivos a Modificar

**1. `src/components/admin/SchoolImportDialog.tsx`**

Mudanças:
- Separar etapa de upload (rápido, local) da etapa de processamento (backend)
- Adicionar novo estágio "uploading" antes do "processing"
- Mostrar preview SEM chamar IA (preview do CSV bruto)
- Botão "Processar com IA" envia todas as escolas de uma vez
- Adicionar indicador de progresso mais detalhado com estimativa de tempo

Novo fluxo de estados:
```text
upload → preview (dados brutos) → processing (IA no backend) → done
```

**2. `supabase/functions/process-schools-csv/index.ts`**

Mudanças:
- Aceitar processamento de grandes volumes (até 180k escolas)
- Processar IA em paralelo (Promise.all com limite de concorrência)
- Retornar resposta inicial imediata com ID de job
- Opção para processamento síncrono (preview) ou assíncrono (importação grande)
- Adicionar rate limiting para evitar sobrecarga da API de IA
- Melhorar logs de progresso

Estrutura da resposta:
```typescript
// Para preview (até 100 escolas)
{ preview: [...], mode: "sync" }

// Para importação grande
{ 
  mode: "async",
  total: 180000,
  processed: 180000,
  inserted: 179500,
  errors: [...]
}
```

---

## Problema 2: Admin Não Abre

### Diagnóstico

```text
Fluxo atual (com bug):
1. getSession() retorna sessão
2. checkAdminRole(userId) ← INICIA mas não espera
3. setIsLoading(false) ← Executa ANTES do check terminar
4. AdminLayout: isLoading=false, isAdmin=false → REDIRECIONA
5. checkAdminRole termina: setIsAdmin(true) ← Tarde demais!
```

### Solução

**Arquivo: `src/contexts/AuthContext.tsx`**

Mudanças:
- Aguardar `checkAdminRole` ANTES de `setIsLoading(false)`
- Usar função assíncrona com `try/finally` para garantir ordem
- Manter o `setTimeout` no listener para evitar deadlock

Código corrigido:
```typescript
useEffect(() => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        setTimeout(() => {
          checkAdminRole(session.user.id);
        }, 0);
      } else {
        setIsAdmin(false);
      }
    }
  );

  // Função assíncrona para inicialização
  const initializeAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await checkAdminRole(session.user.id); // AGUARDA conclusão
      }
    } catch (error) {
      console.error("Error initializing auth:", error);
    } finally {
      setIsLoading(false); // Só executa APÓS o check
    }
  };

  initializeAuth();

  return () => subscription.unsubscribe();
}, []);
```

---

## Resumo das Alterações

| Arquivo | Tipo | Descrição |
|---------|------|-----------|
| `src/contexts/AuthContext.tsx` | Correção | Aguardar verificação de admin antes de liberar loading |
| `src/components/admin/SchoolImportDialog.tsx` | Refatoração | Separar upload de processamento, processar tudo no final |
| `supabase/functions/process-schools-csv/index.ts` | Otimização | Processar IA em paralelo com limite de concorrência |

---

## Detalhes Técnicos

### Concorrência Controlada na Edge Function

Para evitar sobrecarga da API de IA, usar um pool de workers:

```typescript
async function processInParallel<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  concurrency: number
): Promise<R[]> {
  const results: R[] = [];
  const executing: Promise<void>[] = [];
  
  for (const item of items) {
    const p = processor(item).then(r => { results.push(r); });
    executing.push(p);
    
    if (executing.length >= concurrency) {
      await Promise.race(executing);
      executing.splice(executing.findIndex(e => e), 1);
    }
  }
  
  await Promise.all(executing);
  return results;
}
```

### Estimativa de Tempo

Para 180.000 escolas com as otimizações:
- Batches de IA: 3.600 (50 escolas cada)
- Concorrência: 5 chamadas simultâneas
- Tempo estimado por chamada: ~2 segundos
- Tempo total: ~24 minutos (vs horas no modelo atual)

---

## Comportamento Esperado Após Implementação

1. **Upload CSV**: Instantâneo (parsing local)
2. **Preview**: Mostra primeiras escolas SEM processamento IA
3. **Botão "Processar"**: Envia tudo para backend
4. **Processamento**: Barra de progresso com % real
5. **Conclusão**: Toast com resumo dos resultados
6. **Admin**: Acesso imediato após login para usuários com role admin
