# 💰 Meu Financeiro — Controle Financeiro Pessoal

Aplicativo web de controle financeiro pessoal, instalável como app (PWA), **100% offline e privado**:

- Não faz nenhuma chamada de rede, não tem backend, não tem login.
- Não se conecta a bancos, cartões ou qualquer serviço externo (Open Finance, APIs, etc).
- Todos os dados ficam salvos **apenas no seu navegador** (`localStorage`), no seu computador ou celular.
- Funciona totalmente offline depois do primeiro carregamento (service worker).
- Pode ser "instalado" na tela inicial do celular ou como app no computador.

## Stack

- [Vite](https://vite.dev/) + [React 19](https://react.dev/) + TypeScript
- [Tailwind CSS v4](https://tailwindcss.com/) para o visual
- [Zustand](https://zustand.docs.pmnd.rs/) com persistência em `localStorage`
- [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) (manifest + service worker via Workbox)
- [react-router-dom](https://reactrouter.com/) (`HashRouter`, funciona em qualquer subcaminho sem configuração)
- [Recharts](https://recharts.org/) para os gráficos
- [date-fns](https://date-fns.org/) para cálculo de datas e faturas
- [lucide-react](https://lucide.dev/) para ícones

## Rodando localmente

```bash
npm install
npm run dev
```

Acesse `http://localhost:5173`.

Para gerar o build de produção e testá-lo localmente:

```bash
npm run build
npm run preview
```

## Publicando gratuitamente no GitHub Pages

Este projeto já vem com um workflow do GitHub Actions (`.github/workflows/deploy.yml`) que builda e publica automaticamente a cada push na branch `main`.

1. Crie um repositório no GitHub e suba este projeto:
   ```bash
   git init
   git add -A
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/SEU-USUARIO/SEU-REPOSITORIO.git
   git push -u origin main
   ```
2. No GitHub, vá em **Settings → Pages → Build and deployment → Source** e selecione **GitHub Actions**.
3. Pronto — a cada push em `main`, o app é publicado em `https://SEU-USUARIO.github.io/SEU-REPOSITORIO/`.

Não é necessário configurar nada no `vite.config.ts`: o `base: './'` usa caminhos relativos e o roteamento usa `HashRouter`, então o app funciona em qualquer subcaminho automaticamente.

## Instalando como app

- **Celular (Android/Chrome ou iOS/Safari):** abra o link publicado e use "Adicionar à tela inicial" / "Instalar app".
- **Computador (Chrome/Edge):** abra o link publicado e clique no ícone de instalação na barra de endereço.

Depois de instalado, o app abre em tela cheia e funciona mesmo sem internet.

## Como usar

### 1. Configuração inicial (aba "Configurações")

- **Receitas:** cadastre seu salário (marcado como recorrente) e outras rendas pontuais ou recorrentes.
- **Cartões:** cadastre seus cartões de crédito com limite, dia de fechamento e dia de vencimento.
- **Parcelamentos:** se você já tem compras parceladas em andamento, cadastre informando o valor da parcela, em qual parcela você está (ex: 3 de 10) e o mês/ano de vencimento da parcela atual — o app projeta automaticamente o restante.
- **Contas fixas:** cadastre contas recorrentes (aluguel, internet, assinaturas) para entrarem na Previsão.
- **Categorias:** use as categorias padrão ou crie as suas.
- **Backup:** exporte/importe todos os seus dados em um arquivo `.json`.

### 2. Lançamento rápido de gastos

Toque no botão **+** (flutuante no celular, no topo da barra lateral no computador) a qualquer momento:

- Descrição, valor, categoria, data.
- Forma de pagamento: Dinheiro, Pix ou um dos seus cartões.
- Se for cartão, marque **"Compra parcelada?"** e informe o número de parcelas — o valor de cada parcela é calculado automaticamente e distribuído nos meses corretos, considerando o dia de fechamento do cartão.

### 3. Dashboard

Saldo do mês, receita, gastos, percentual do orçamento utilizado (com alertas), ranking de categorias e a lista de lançamentos do mês — navegue entre meses com as setas.

### 4. Cartões

Limite total, limite disponível, fatura do mês atual, próxima fatura e as compras em aberto de cada cartão.

### 5. Parcelamentos

Todas as compras parceladas, com progresso (parcela atual/total) e a data prevista de término.

### 6. Previsão

Os próximos 6 meses com receita prevista, parcelas já comprometidas e contas fixas — para saber quanto do seu salário futuro já está reservado.

### 7. Relatórios

Evolução mensal, comparação entre meses, gastos por categoria e por cartão.

## Estrutura do projeto

```
src/
├── types/          # Modelo de dados (TypeScript)
├── lib/            # Motor de cálculo de faturas/parcelas, formatação, categorias padrão, backup
├── store/          # Zustand (dados) + store de UI (modais/toasts)
├── components/     # Componentes de UI reutilizáveis e layout (sidebar, bottom nav, FAB)
├── pages/          # Uma página por rota (Dashboard, Cartões, Parcelamentos, Previsão, Relatórios, Configurações)
└── hooks/          # Hooks compartilhados
```

## Privacidade

- Nenhuma requisição de rede é feita pelo app além de carregar os arquivos estáticos (confira na aba "Network" do DevTools).
- Nenhuma integração bancária, senha ou dado sensível de cartão (número, CVV) é solicitado — o app guarda apenas nome, limite e datas de fechamento/vencimento, para fins de cálculo de faturas.
- Todos os dados vivem em `localStorage`, no seu dispositivo. Para apagar tudo, use "Apagar todos os dados" em Configurações → Backup.

⚠️ **Faça backups regularmente** (Configurações → Backup → Exportar): como os dados ficam só no navegador, eles podem ser perdidos se você limpar o cache, trocar de navegador ou reinstalar o sistema.
