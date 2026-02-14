# KickOff Rivals

The ultimate virtual football betting league built with TanStack Start, Drizzle ORM, and Neon (serverless Postgres).

## Tech Stack

- **Framework**: [TanStack Start](https://tanstack.com/start) (React meta-framework)
- **Routing**: [TanStack Router](https://tanstack.com/router) (File-based routing)
- **Database**: [Neon](https://neon.tech) (Serverless Postgres)
- **ORM**: [Drizzle ORM](https://orm.drizzle.team)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com) with shadcn/ui theming
- **Wallet**: [Reown AppKit](https://reown.com) (WalletConnect)
- **Build Tool**: [Vite](https://vitejs.dev)

## Project Structure

```
KICKOFF-RIVALS/
├── app/
│   ├── components/       # React components (shadcn-styled)
│   ├── config/           # App configuration (wallet, etc.)
│   ├── lib/
│   │   ├── db/           # Drizzle schema, client, and seed
│   │   └── utils.ts      # Utility functions (cn, formatters)
│   ├── routes/           # TanStack Router file-based routes
│   │   ├── __root.tsx    # Root layout
│   │   ├── index.tsx     # Home page
│   │   └── api/          # Server API routes
│   ├── server/           # Server functions (Drizzle queries)
│   ├── services/         # Client-side service helpers
│   ├── styles/           # Global CSS (Tailwind + shadcn)
│   ├── constants.ts      # App constants (teams, leagues, etc.)
│   ├── types.ts          # TypeScript type definitions
│   ├── client.tsx        # Client entry point
│   ├── router.tsx        # Router configuration
│   └── ssr.tsx           # SSR entry point
├── drizzle/              # Drizzle migrations
├── public/               # Static assets
├── vite.config.ts        # Vite configuration
├── drizzle.config.ts     # Drizzle Kit configuration
├── tsconfig.json         # TypeScript configuration
└── package.json          # Dependencies and scripts
```

## Getting Started

### Prerequisites

- Node.js 18+ or Bun
- Docker & Docker Compose (for local development)
- A Neon database (for production - free tier available at https://neon.tech)

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd KICKOFF-RIVALS
   ```

2. **Install dependencies**

   ```bash
   npm install
   # or
   bun install
   ```

3. **Configure environment variables**

   Create a `.env` file in the root directory:

   ```env
   # Database (Required)
   DATABASE_URL=postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require

   # Authentication (Required)
   JWT_SECRET=your-secure-jwt-secret-here

   # Admin (Required)
   ADMIN_KEY=0xYourAdminWalletAddress1,0xYourAdminWalletAddress2

   # Wallet Connect (Required)
   VITE_REOWN_PROJECT_ID=your-reown-project-id

   # Optional
   VITE_API_URL=
   GOOGLE_AI_API_KEY=
   ```

4. **Set up the database**

   ```bash
   # Push schema to database
   npm run db:push

   # Or generate and run migrations
   npm run db:generate
   npm run db:migrate

   # Optionally seed the database
   npx tsx app/lib/db/seed.ts
   ```

5. **Start the development server**

   ```bash
   npm run dev
   ```

   Visit [http://localhost:3000](http://localhost:3000)

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run db:generate` | Generate Drizzle migrations |
| `npm run db:migrate` | Run migrations |
| `npm run db:push` | Push schema directly to database |
| `npm run db:studio` | Open Drizzle Studio (database GUI) |
| `npm run db:seed` | Seed database with initial data |
| `npm run docker:up` | Start PostgreSQL container |
| `npm run docker:down` | Stop PostgreSQL container |
| `npm run docker:reset` | Reset database (delete all data) |
| `npm run docker:logs` | View PostgreSQL logs |

| `npm run docker:psql` | Connect to database via psql |

## Local Development with Docker

For local development and testing, you can use Docker to run PostgreSQL instead of Neon. This is recommended for development as it's faster and doesn't require an internet connection.

### Quick Start (Docker)

1. **Copy the local environment example**

   ```bash
   cp .env.local.example .env
   ```

2. **Start PostgreSQL with Docker**

   ```bash
   npm run docker:up
   ```

   This starts a PostgreSQL 16 container on port 5432.

3. **Push the schema to the database**

   ```bash
   npm run db:push
   ```

4. **Seed the database (optional)**

   ```bash
   npm run db:seed
   ```

5. **Start the development server**

   ```bash
   npm run dev
   ```

### Docker Commands

| Command | Description |
|---------|-------------|
| `npm run docker:up` | Start PostgreSQL container |
| `npm run docker:down` | Stop PostgreSQL container (preserves data) |
| `npm run docker:reset` | Stop container AND delete all data |
| `npm run docker:logs` | Follow PostgreSQL logs |

| `npm run docker:psql` | Open psql shell in the container |

### Switching Between Local and Neon

The database client automatically detects whether you're using Neon or local PostgreSQL based on the `DATABASE_URL`:

- **Local Docker**: `postgresql://kickoff:kickoff_secret@localhost:5432/kickoff_rivals`
- **Neon**: `postgresql://user:password@ep-xxx.neon.tech/neondb?sslmode=require`

Simply update your `.env` file to switch between environments. The app will use the appropriate database driver automatically.

## Features

- **Virtual Football Betting**: Place bets on simulated football matches
- **Live Match Simulation**: Watch matches unfold in real-time
- **Multiple Markets**: Home/Draw/Away, Both Teams Score (GG/NG)
- **Bet Slip**: Single bets and accumulators
- **League Tables**: Track team standings across seasons
- **User Profiles**: Track stats, wins, and achievements
- **Daily Quests**: Complete tasks to earn coins
- **Referral System**: Invite friends and earn rewards
- **Alliance System**: Support your favorite team and earn bonuses
- **Wallet Integration**: Connect via WalletConnect/MetaMask

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | Neon Postgres connection string |
| `JWT_SECRET` | Yes | Secret for JWT token signing |
| `ADMIN_KEY` | Yes | Comma-separated admin wallet addresses |
| `VITE_REOWN_PROJECT_ID` | Yes | Reown (WalletConnect) project ID |
| `VITE_API_URL` | No | API base URL (empty for same-origin) |
| `GOOGLE_AI_API_KEY` | No | Google AI API key (for AI features) |

## API Routes

All API routes are located in `app/routes/api/` and use TanStack Start server route handlers:

- `GET /api/matches/current` - Get current matches
- `POST /api/matches/create` - Create new matches
- `POST /api/matches/update-result` - Update match results
- `GET /api/bets/active` - Get user's active bets
- `POST /api/bets/settle` - Settle bets after match
- `POST /api/minigame/bet` - Place a bet
- `GET /api/user/profile` - Get/create user profile
- `POST /api/user/register-referral` - Register referral code
- `POST /api/user/convert-coins` - Convert coins to KOR tokens
- `POST /api/user/claim-welcome-gift` - Claim welcome bonus
- `POST /api/user/claim-alliance-rewards` - Claim alliance rewards
- `GET /api/leagues/standings` - Get league standings
- `POST /api/coupons/verify` - Verify and redeem coupon

## Deployment

### Vercel

```bash
npm run build
```

Deploy the `.output` directory to Vercel or any Node.js hosting.

### Environment Setup

Make sure to set all required environment variables in your hosting provider's dashboard.

## License

MIT

## Contributing

Contributions are welcome! Please read the contributing guidelines before submitting a PR.