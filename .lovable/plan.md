

## 📚 Lista Escolar - Plataforma de Materiais Escolares

### Visão Geral
Uma plataforma web para ajudar pais e responsáveis a encontrar e gerenciar listas de materiais escolares. Os usuários podem buscar escolas por CEP, visualizar listas organizadas por série e categoria, compartilhar com outros pais e acompanhar métricas.

---

## 🎨 Design e Identidade Visual
- **Estilo**: Colorido e amigável, ideal para o público escolar
- **Paleta de cores**: Cores vibrantes (azul, verde, laranja, roxo) com tons alegres
- **Tipografia**: Moderna e legível
- **Ícones**: Ilustrações lúdicas e amigáveis relacionadas a materiais escolares
- **UI**: Cards coloridos, badges de categoria, animações suaves

---

## 🚀 Funcionalidades do MVP

### 1. Página Inicial (Home)
- Campo de busca de escolas por CEP com autocomplete
- Banner hero atrativo com ilustrações escolares
- Seção de "Como funciona" em 3 passos
- Lista de escolas em destaque/recentes

### 2. Página da Escola
- Informações da escola (nome, endereço, contato)
- Seletor de série escolar (Infantil ao 3º Médio)
- Lista de materiais organizada por categoria
- Valor total estimado da lista
- Botões de compartilhamento (WhatsApp, copiar link)
- Links para compra de cada item

### 3. Painel Administrativo
- Dashboard com estatísticas gerais (escolas, listas, itens)
- Gerenciamento de escolas (CRUD)
- Gerenciamento de listas de materiais por escola/série
- Adição/edição de itens com preço e link de compra
- Importação de escolas via CSV

### 4. Métricas e Analytics
- Total de cliques em links de compra
- Total de compartilhamentos
- Top itens mais clicados
- Escolas mais ativas
- Gráficos de tendências

---

## 🗄️ Estrutura do Banco de Dados (Supabase)

**Tabelas principais:**
- **schools**: Escolas (nome, CEP, endereço, cidade, estado, slug)
- **grades**: Séries escolares (17 séries do Infantil ao 3º Médio)
- **material_categories**: Categorias (Papelaria, Cadernos, Arte, etc)
- **material_lists**: Listas por escola/série/ano com versionamento
- **material_items**: Itens individuais com preço e links
- **purchase_events**: Tracking de cliques em compra
- **share_events**: Tracking de compartilhamentos

---

## 🔐 Autenticação e Permissões

- Login/cadastro para administradores
- Área pública sem necessidade de login (busca e visualização)
- Painel admin protegido por autenticação
- Políticas de segurança (RLS) para proteger dados

---

## 📱 Responsividade

- Design mobile-first
- Experiência otimizada para smartphones (público principal: pais)
- Layout adaptável para tablets e desktop

---

## 📋 Fases de Implementação

**Fase 1 - Fundação**
- Configurar Supabase e criar schema do banco
- Criar estrutura de rotas e navegação
- Implementar design system com cores e componentes

**Fase 2 - Área Pública**
- Página inicial com busca por CEP
- Página da escola com seletor de série
- Visualização de lista de materiais
- Compartilhamento de listas

**Fase 3 - Painel Admin**
- Autenticação de administradores
- Dashboard com métricas
- CRUD de escolas
- CRUD de listas e itens

**Fase 4 - Analytics**
- Tracking de eventos (cliques, compartilhamentos)
- Página de métricas com gráficos
- Top itens e escolas ativas

