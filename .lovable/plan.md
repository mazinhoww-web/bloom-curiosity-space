

# Plano de Implementação: Correção do Admin e Otimização do Processamento CSV

## Visão Geral

Este plano implementa as duas correções críticas identificadas:
1. **Bug de acesso ao Admin** - Race condition que impede administradores de acessarem o painel
2. **Otimização do processamento CSV** - Processamento com IA após upload completo (não durante)

---

## Parte 1: Correção do Bug de Acesso ao Admin

### Problema Identificado

No arquivo `src/contexts/AuthContext.tsx`, o `setIsLoading(false)` é executado ANTES da função `checkAdminRole` terminar:

```text
Fluxo atual (com bug):
1. getSession() retorna sessão
2. checkAdminRole(userId) ← INICIA mas não espera
3. setIsLoading(false) ← Executado IMEDIATAMENTE
4. AdminLayout: isLoading=false, isAdmin=false → REDIRECIONA
5. checkAdminRole termina tarde demais
```

### Solução

Refatorar o `useEffect` para aguardar a verificação de admin usando async/await com try/finally:

**Arquivo:** `src/contexts/AuthContext.tsx`

Mudanças no bloco `useEffect` (linhas 23-49):
- Extrair a lógica de inicialização para uma função assíncrona `initializeAuth`
- Usar `await checkAdminRole(session.user.id)` para aguardar a conclusão
- Mover `setIsLoading(false)` para o bloco `finally`

---

## Parte 2: Otimização do Processamento CSV

### Problema Identificado

O fluxo atual envia o CSV em chunks de 500 e processa com IA durante o envio:

```text
Frontend → Envia 500 escolas → Edge Function → 10 chamadas IA → Retorna
Frontend → Envia próximas 500 → Edge Function → 10 chamadas IA → Retorna
... repete para cada chunk
```

Para 180.000 escolas = 360 chamadas sequenciais de edge function!

### Solução: Processamento em Duas Etapas

Novo fluxo:
```text
1. Upload: Parse local instantâneo → Mostra contagem
2. Preview: Chama IA para 10 escolas (opcional, rápido)
3. Processamento: Envia TUDO para edge function de uma vez
4. Edge Function: Processa IA em paralelo com concorrência controlada
```

### Arquivo 1: `src/components/admin/SchoolImportDialog.tsx`

Mudanças principais:
- Adicionar novo estágio "uploading" entre upload e preview
- Remover processamento em chunks no frontend
- Enviar todas as escolas de uma vez para o backend
- Adicionar estimativa de tempo e contador de progresso baseado em eventos SSE (opcional)
- Simplificar a lógica de progresso (100% quando termina)

### Arquivo 2: `supabase/functions/process-schools-csv/index.ts`

Mudanças principais:
- Adicionar função `processInParallel` para controle de concorrência
- Processar batches de IA em paralelo (5 simultâneos) em vez de sequencial
- Melhorar logging com contadores de progresso
- Otimizar inserções no banco usando upsert quando possível

**Nova função de concorrência:**
```typescript
async function processInParallel<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  concurrency: number
): Promise<R[]>
```

---

## Resumo das Alterações

| Arquivo | Tipo | Descrição |
|---------|------|-----------|
| `src/contexts/AuthContext.tsx` | Correção | Aguardar verificação de admin antes de liberar loading |
| `src/components/admin/SchoolImportDialog.tsx` | Otimização | Enviar todas escolas de uma vez, não em chunks |
| `supabase/functions/process-schools-csv/index.ts` | Otimização | Processar IA em paralelo com concorrência controlada |

---

## Estimativas de Performance

**Antes (180.000 escolas):**
- 360 chamadas de edge function sequenciais
- Cada chamada: ~160 segundos (10 batches de IA x 16s cada)
- Tempo total estimado: ~16 horas

**Depois (180.000 escolas):**
- 1 chamada de edge function
- Batches de IA: 3.600 (50 escolas cada)
- Concorrência: 5 chamadas simultâneas
- Tempo por batch: ~2 segundos
- Tempo total estimado: ~24 minutos

---

## Comportamento Esperado Após Implementação

1. **Admin**: Acesso imediato após login para usuários com role admin
2. **Upload CSV**: Parse local instantâneo
3. **Preview**: IA processa 10 escolas para demonstração (opcional)
4. **Botão "Importar"**: Envia tudo para backend
5. **Processamento**: Edge function processa em paralelo
6. **Conclusão**: Toast com resumo completo

