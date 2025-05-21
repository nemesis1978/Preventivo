# Portafoglio di Markowitz

Il progetto "Portafoglio di Markowitz" nasce dall'esigenza di fornire una piattaforma accessibile e intuitiva che aiuti le persone ad avvicinarsi al mondo degli investimenti o ad approfondire le proprie conoscenze. L'applicazione mira a colmare il divario informativo offrendo consigli e idee di investimento curate, presentate in modo chiaro e comprensibile.

## 🚀 Iniziare

Istruzioni su come configurare e avviare il progetto localmente.

### Prerequisiti

- Node.js (versione raccomandata: >=18.x)
- npm (o pnpm/yarn)
- Git

### Installazione

1. Clona il repository:
   ```bash
   git clone <URL_DEL_REPOSITORY>
   cd <NOME_CARTELLA_PROGETTO>
   ```

2. Naviga nella cartella del frontend e installa le dipendenze:
   ```bash
   cd frontend
   npm install
   ```

3. (Se presente una cartella backend separata e non integrata in Next.js)
   ```bash
   # cd ../backend
   # npm install
   ```

### Configurazione Variabili d'Ambiente

Crea un file `.env.local` nella cartella `frontend` basandoti su `.env.example` (se fornito) e configura le variabili necessarie (es. chiavi API, URL del database).

### Esecuzione

Per avviare l'applicazione in modalità sviluppo:

```bash
cd frontend
npm run dev
```

L'applicazione sarà accessibile solitamente su `http://localhost:3000`.

## 🛠️ Stack Tecnologico

- **Frontend**:
  - Framework: Next.js 14 (App Router)
  - Styling: Tailwind CSS + shadcn/ui
  - State Management: Zustand / Jotai, React Context/Hooks, TanStack Query
  - Animazioni: Framer Motion (opzionale)
- **Backend**:
  - API Layer: Next.js API Routes (Route Handlers) / tRPC
  - Autenticazione: NextAuth.js (Auth.js v5)
  - (Framework alternativo se logica complessa separata: Node.js con Express.js)
- **Database**:
  - Tipo: PostgreSQL
  - ORM: Prisma
- **Deployment**: Vercel
- **Strumenti di Sviluppo**:
  - Linting & Formatting: ESLint + Prettier
  - Testing: Jest + React Testing Library, Playwright

## 📝 Documentazione API

Le API sono implementate utilizzando Next.js API Routes (Route Handlers). Fare riferimento alla cartella `frontend/src/app/(api)/` per i dettagli degli endpoint.
Eventuale documentazione più formale (es. OpenAPI/Swagger) sarà aggiunta qui se necessario.

## 🤝 Contribuire

Le contribuzioni sono benvenute! Si prega di seguire le linee guida per i commit e le pull request definite nel progetto (vedi `006-commit-pr-template.md`).

## 📄 Licenza

Questo progetto è attualmente da definire per quanto riguarda la licenza. (Placeholder: MIT License)