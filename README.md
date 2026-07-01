# 💰 Meu Financeiro — Controle Financeiro Pessoal

Aplicativo web de controle financeiro pessoal, instalável como app (PWA):

- Login com sua conta Google, para identificar quem é o dono dos dados.
- Todos os dados ficam salvos na sua conta, num banco de dados na nuvem (Firebase/Firestore, da Google), e sincronizam automaticamente entre todos os seus dispositivos.
- Continua funcionando offline (o app e um cache local dos dados carregam mesmo sem internet); as mudanças feitas offline sincronizam sozinhas quando a conexão voltar.
- Não se conecta a bancos, cartões ou qualquer serviço externo (Open Finance, APIs, etc) além do próprio Firebase.
- Pode ser "instalado" na tela inicial do celular ou como app no computador.

## Stack

- [Vite](https://vite.dev/) + [React 19](https://react.dev/) + TypeScript
- [Tailwind CSS v4](https://tailwindcss.com/) para o visual
- [Zustand](https://zustand.docs.pmnd.rs/) para o estado local (com cache em `localStorage`)
- [Firebase](https://firebase.google.com/) (Authentication com Google + Firestore) para login e sincronização na nuvem
- [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) (manifest + service worker via Workbox)
- [react-router-dom](https://reactrouter.com/) (`HashRouter`, funciona em qualquer subcaminho sem configuração)
- [Recharts](https://recharts.org/) para os gráficos
- [date-fns](https://date-fns.org/) para cálculo de datas e faturas
- [lucide-react](https://lucide.dev/) para ícones

## Configurando o Firebase

O app precisa de um projeto Firebase próprio (gratuito) para funcionar:

1. Crie um projeto em [console.firebase.google.com](https://console.firebase.google.com/).
2. Em **Criação > Authentication**, habilite o provedor **Google**.
3. Em **Criação > Firestore Database**, crie o banco (modo produção) e, em **Regras**, cole:
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /meta/registry {
         allow read: if request.auth != null;
         allow create: if false;
         allow update: if request.auth != null
           && request.auth.uid in request.resource.data.uids
           && !(request.auth.uid in resource.data.uids)
           && request.resource.data.uids.size() == resource.data.uids.size() + 1
           && request.resource.data.uids.size() <= 5;
       }

       match /users/{uid} {
         allow read, write: if request.auth != null
           && request.auth.uid == uid
           && uid in get(/databases/$(database)/documents/meta/registry).data.uids;
       }
     }
   }
   ```
   Essas regras limitam o app a no máximo 5 contas Google distintas (campo `uids` do documento `meta/registry`) — depois disso, novos logins ficam bloqueados. Ajuste o número `5` (em dois lugares) se quiser outro teto.
4. Ainda no Firestore, crie manualmente a coleção `meta` com o documento `registry` contendo um campo `uids` do tipo array, já com o seu próprio UID (veja em Authentication > Users, coluna "User UID", depois de logar pela primeira vez).
5. Em **Configurações do projeto > Seus apps**, registre um app Web e copie as chaves (`apiKey`, `authDomain`, etc).
6. Copie `.env.example` para `.env.local` e preencha com essas chaves.
7. Se for usar o deploy automático via GitHub Actions, cadastre as mesmas chaves como **Secrets** do repositório (Settings > Secrets and variables > Actions), com os mesmos nomes das variáveis `VITE_FIREBASE_*`.

## Rodando localmente

```bash
npm install
npm run dev
```

Acesse `http://localhost:5173`.

## Instalando como app

- **Celular (Android/Chrome ou iOS/Safari):** abra o link publicado e use "Adicionar à tela inicial" / "Instalar app".
- **Computador (Chrome/Edge):** abra o link publicado e clique no ícone de instalação na barra de endereço.

Depois de instalado, o app abre em tela cheia e funciona mesmo sem internet.

## Como usar

### 1. Configuração inicial (aba "Configurações")

- **Receitas:** cadastre seu salário (marcado como recorrente) e outras rendas pontuais ou recorrentes.
- **Cartões:** cadastre seus cartões de crédito com limite, dia de fechamento e dia de vencimento.
- **Parcelamentos:** se você já tem compras parceladas em andamento (no cartão ou financiamentos diretos, sem cartão), cadastre informando o valor da parcela, em qual parcela você está (ex: 3 de 10) e o mês/ano de vencimento da parcela atual — o app projeta automaticamente o restante.
- **Contas:** cadastre contas recorrentes (aluguel, internet, assinaturas) ou avulsas de um mês específico, para entrarem no checklist de Contas do Mês e na Previsão.
- **Categorias:** use as categorias padrão ou crie as suas.
- **Backup:** exporte/importe todos os seus dados em um arquivo `.json`.

### 2. Lançamento rápido de gastos

Toque no botão **+** (flutuante no celular, no topo da barra lateral no computador) a qualquer momento:

- Descrição, valor, categoria, data.
- Forma de pagamento: Dinheiro, Pix ou um dos seus cartões.
- Se for cartão, marque **"Compra parcelada?"** e informe o número de parcelas — o valor de cada parcela é calculado automaticamente e distribuído nos meses corretos, considerando o dia de fechamento do cartão.

### 3. Dashboard

Saldo do mês, receita, gastos, percentual do orçamento utilizado (com alertas), ranking de categorias e a lista de lançamentos do mês — navegue entre meses com as setas.

### 4. Contas do Mês

Checklist do que você precisa pagar no mês — contas fixas/avulsas, financiamentos parcelados e faturas de cartão aparecem automaticamente numa única lista, com **Total Gastos** e **Saldo** (receita menos gastos). Toque no status **Pendente/Pago** de cada item para marcar como pago conforme for quitando, e acompanhe a barra de progresso. Use **+ Nova conta** para adicionar rapidamente um pagamento avulso deste mês (ex: uma transferência pontual).

### 5. Cartões

Limite total, limite disponível, fatura do mês atual, próxima fatura e as compras em aberto de cada cartão.

### 6. Parcelamentos

Todas as compras parceladas (no cartão ou financiamentos diretos), com progresso (parcela atual/total) e a data prevista de término.

### 7. Previsão

Os próximos 6 meses com receita prevista, parcelas já comprometidas e contas — para saber quanto do seu salário futuro já está reservado.

### 8. Relatórios

Evolução mensal, comparação entre meses, gastos por categoria e por cartão.

## Privacidade

- Nenhuma integração bancária, senha ou dado sensível de cartão (número, CVV) é solicitado — o app guarda apenas nome, limite e datas de fechamento/vencimento, para fins de cálculo de faturas.
- Seus dados ficam no Firestore (Google Cloud), dentro do seu próprio projeto Firebase, protegidos por regras de segurança que só permitem leitura/escrita para a sua conta logada.
- Um cache local (`localStorage` + cache offline do Firestore) mantém o app rápido e funcional mesmo sem internet; as mudanças sincronizam com a nuvem assim que a conexão volta.
- Para apagar tudo (nuvem e dispositivos), use "Apagar todos os dados" em Configurações → Conta e backup.

💡 Mesmo com a sincronização na nuvem, vale manter o hábito de exportar um backup `.json` (Configurações → Conta e backup → Exportar) de vez em quando.
