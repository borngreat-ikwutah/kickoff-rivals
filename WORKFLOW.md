# KickOff Rivals - Development Workflow

This document outlines the development workflow and provides an overview of all implemented files in the codebase.

## Development Workflow

### 1. Initial Setup

```bash
# Clone and install dependencies
git clone <repository-url>
cd KICKOFF-RIVALS
npm install  # or bun install

# Set up environment variables
cp .env.local.example .env
# Edit .env with your configuration
```

### 2. Database Setup

```bash
# Option A: Local Development with Docker
npm run docker:up          # Start PostgreSQL container
npm run db:push            # Push schema to database
npm run db:seed            # (Optional) Seed with initial data

# Option B: Production with Neon
# Update DATABASE_URL in .env to Neon connection string
npm run db:generate        # Generate migrations
npm run db:migrate         # Run migrations
```

### 3. Development Server

```bash
npm run dev                # Start development server at http://localhost:3000
```

### 4. Build & Deploy

```bash
npm run build              # Build for production
npm run start              # Start production server
```

---

## Implemented Files Overview

### Root Configuration Files

| File | Description |
|------|-------------|
| `package.json` | Dependencies and npm scripts |
| `tsconfig.json` | TypeScript configuration |
| `vite.config.ts` | Vite build configuration |
| `drizzle.config.ts` | Drizzle ORM configuration |
| `docker-compose.yml` | Docker setup for local PostgreSQL |
| `.gitignore` | Git ignore rules |
| `README.md` | Project documentation |

---

### App Entry Points

| File | Description |
|------|-------------|
| `app/client.tsx` | Client-side entry point |
| `app/ssr.tsx` | Server-side rendering entry point |
| `app/router.tsx` | TanStack Router configuration |
| `app/routeTree.gen.ts` | Auto-generated route tree |

---

### Core App Files

| File | Description |
|------|-------------|
| `app/constants.ts` | App-wide constants (teams, leagues, etc.) |
| `app/types.ts` | TypeScript type definitions |
| `app/vite-env.d.ts` | Vite environment type declarations |

---

### Components (`app/components/`)

| File | Description |
|------|-------------|
| `AdminAuth.tsx` | Admin authentication component |
| `AdminPortal.tsx` | Admin dashboard portal |
| `AllianceSetup.tsx` | Team alliance selection UI |
| `App.tsx` | Main application wrapper |
| `BetModal.tsx` | Betting modal dialog |
| `BetSlip.tsx` | User's bet slip component |
| `ConnectWallet.tsx` | Wallet connection UI |
| `EntryChoice.tsx` | Entry point selection screen |
| `GameSelection.tsx` | Game/match selection interface |
| `Icons.tsx` | Icon components |
| `LandingPage.tsx` | Main landing page |
| `LeagueTable.tsx` | League standings table |
| `MatchCard.tsx` | Individual match card component |
| `Onboarding.tsx` | User onboarding flow |
| `ProfileScreen.tsx` | User profile display |
| `RivalsLogo.tsx` | App logo component |
| `SignMessage.tsx` | Wallet message signing UI |
| `SimulationScreen.tsx` | Live match simulation view |
| `SwapConfirm.tsx` | Token swap confirmation |
| `TeamLogo.tsx` | Team logo display component |
| `WalletModal.tsx` | Wallet selection modal |
| `WelcomeScreen.tsx` | Welcome/intro screen |

---

### Routes (`app/routes/`)

#### Page Routes

| File | Description |
|------|-------------|
| `__root.tsx` | Root layout component |
| `index.tsx` | Home page (`/`) |
| `admin.tsx` | Admin panel page (`/admin`) |
| `alliance.tsx` | Alliance selection page (`/alliance`) |
| `connect.tsx` | Wallet connection page (`/connect`) |
| `dashboard.tsx` | User dashboard (`/dashboard`) |
| `entry.tsx` | Entry point page (`/entry`) |
| `onboarding.tsx` | Onboarding flow (`/onboarding`) |
| `play.tsx` | Main game/play page (`/play`) |
| `sign.tsx` | Message signing page (`/sign`) |
| `welcome.tsx` | Welcome page (`/welcome`) |

#### API Routes (`app/routes/api/`)

| File | Endpoint | Description |
|------|----------|-------------|
| `matches.current.ts` | `GET /api/matches/current` | Get current matches |
| `matches.create.ts` | `POST /api/matches/create` | Create new matches |
| `matches.update-result.ts` | `POST /api/matches/update-result` | Update match results |
| `bets.active.ts` | `GET /api/bets/active` | Get user's active bets |
| `bets.settle.ts` | `POST /api/bets/settle` | Settle bets after match |
| `minigame.bet.ts` | `POST /api/minigame/bet` | Place a bet |
| `user.profile.ts` | `GET /api/user/profile` | Get/create user profile |
| `user.register-referral.ts` | `POST /api/user/register-referral` | Register referral code |
| `user.convert-coins.ts` | `POST /api/user/convert-coins` | Convert coins to KOR |
| `user.claim-welcome-gift.ts` | `POST /api/user/claim-welcome-gift` | Claim welcome bonus |
| `user.claim-alliance-rewards.ts` | `POST /api/user/claim-alliance-rewards` | Claim alliance rewards |
| `leagues.standings.ts` | `GET /api/leagues/standings` | Get league standings |
| `coupons.verify.ts` | `POST /api/coupons/verify` | Verify and redeem coupon |

---

### Server Functions (`app/server/`)

| File | Description |
|------|-------------|
| `coupons.ts` | Coupon verification and redemption logic |
| `matches.ts` | Match management server functions |
| `user.ts` | User profile and operations |

---

### Services (`app/services/`)

| File | Description |
|------|-------------|
| `adminAuthService.ts` | Admin authentication service |
| `couponService.ts` | Coupon-related client service |
| `matchService.ts` | Match-related client service |

---

### Configuration (`app/config/`)

| File | Description |
|------|-------------|
| `appkit.tsx` | Reown AppKit (WalletConnect) configuration |

---

### Contexts (`app/contexts/`)

| File | Description |
|------|-------------|
| `GameContext.tsx` | Game state context provider |

---

### Library/Utilities (`app/lib/`)

| File | Description |
|------|-------------|
| `utils.ts` | Utility functions (`cn`, formatters, etc.) |

#### Database (`app/lib/db/`)

| File | Description |
|------|-------------|
| `index.ts` | Database client initialization |
| `schema.ts` | Drizzle ORM schema definitions |
| `seed.ts` | Database seeding script |

---

### Styles (`app/styles/`)

| File | Description |
|------|-------------|
| `globals.css` | Global CSS with Tailwind + shadcn theming |

---

### Database Migrations (`drizzle/migrations/`)

| File | Description |
|------|-------------|
| `0000_adorable_switch.sql` | Initial database migration |
| `meta/` | Drizzle migration metadata |

---

### Debug Scripts (`scripts/`)

| File | Description |
|------|-------------|
| `debug_bets.ts` | Debug script for bet operations |
| `debug_matches.ts` | Debug script for match operations |
| `debug_matches_v2.ts` | Updated match debugging |
| `test_bet.ts` | Bet testing script |
| `test_bet_api.ts` | API bet testing script |

---

## File Count Summary

| Category | Count |
|----------|-------|
| Components | 22 |
| Page Routes | 11 |
| API Routes | 13 |
| Server Functions | 3 |
| Services | 3 |
| Config Files | 7 |
| Database Files | 3 |
| Debug Scripts | 5 |
| **Total** | **67+** |

---

## Architecture Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT                                   │
├─────────────────────────────────────────────────────────────────┤
│  Components → Routes → Contexts → Services                      │
│       ↓          ↓         ↓          ↓                         │
│  [UI Layer]  [Pages]  [State]   [API Calls]                     │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      API ROUTES                                  │
│  app/routes/api/*.ts                                            │
│  (TanStack Start Server Handlers)                               │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    SERVER FUNCTIONS                              │
│  app/server/*.ts                                                │
│  (Business Logic + Drizzle Queries)                             │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      DATABASE                                    │
│  Drizzle ORM → PostgreSQL (Neon/Local)                          │
│  Schema: app/lib/db/schema.ts                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Quick Commands Reference

| Task | Command |
|------|---------|
| Start dev server | `npm run dev` |
| Build production | `npm run build` |
| Start production | `npm run start` |
| Push DB schema | `npm run db:push` |
| Generate migrations | `npm run db:generate` |
| Run migrations | `npm run db:migrate` |
| Open DB studio | `npm run db:studio` |
| Seed database | `npm run db:seed` |
| Start Docker DB | `npm run docker:up` |
| Stop Docker DB | `npm run docker:down` |
| Reset Docker DB | `npm run docker:reset` |
| View Docker logs | `npm run docker:logs` |
| Connect to DB shell | `npm run docker:psql` |