# Next.js SaaS Starter

A SaaS boilerplate with authentication, Stripe billing, multi-tenant workspaces, and team invites. Built with Next.js 14, TypeScript, Prisma, and Tailwind CSS.

![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue) ![Next.js](https://img.shields.io/badge/Next.js-14-black) ![Tailwind](https://img.shields.io/badge/Tailwind-3.4-38bdf8) ![License](https://img.shields.io/badge/License-MIT-green)

## What's Included

### Authentication
- Email/password registration with bcrypt hashing
- OAuth login (Google, GitHub) via NextAuth.js v4
- JWT sessions with automatic refresh
- Protected routes via middleware (all `/dashboard/*` routes require auth)
- Register, login, and onboarding pages

### Billing
- Stripe Checkout for subscription upgrades
- Stripe Customer Portal for self-service billing management
- Webhook handlers for: subscription created/updated/deleted, checkout completed, payment failed, trial ending
- Payment failure → automatic email notification to user
- Trial ending → automatic email notification to user
- Customer creation with metadata linking

### Workspaces (Multi-Tenant)
- Create workspaces with unique URL slugs
- Role-based access: Owner, Admin, Member
- Workspace settings page (name, billing, danger zone)
- Only Owners can delete workspaces
- Only Owners/Admins can access settings

### Team Management
- Email-based invite system with 7-day expiration
- Accept invite flow (authenticated + unauthenticated users)
- Role assignment on invite (Admin or Member)
- Duplicate invite and existing member checks
- Member listing with role badges
- Pending invite display

### Email
- Transactional emails via Resend
- Templates: welcome, team invite, billing alerts (trial ending, payment failed, subscription canceled)
- HTML sanitization on all user-provided content

### Pages & Routes
- `/` — Landing page
- `/login` — Email/password + OAuth login
- `/register` — Account creation
- `/onboarding` — Workspace creation after signup
- `/invite/[token]` — Accept team invite
- `/dashboard` — Workspace list, stats, quick actions
- `/dashboard/new` — Create new workspace
- `/dashboard/[slug]` — Workspace home with team list
- `/dashboard/[slug]/settings` — Workspace settings (general, billing, members, danger zone)
- `/dashboard/[slug]/settings/members` — Invite + manage team members
- `/dashboard/settings` — Account settings (profile, sign out, delete account)

### API Routes
- `POST /api/auth/register` — Create account with validation
- `GET/POST /api/auth/[...nextauth]` — NextAuth endpoints
- `GET/POST /api/workspaces` — List/create workspaces
- `POST /api/workspaces/[id]/invites` — Send team invite
- `GET /api/invites/[token]` — Fetch invite details
- `POST /api/invites/[token]/accept` — Accept invite
- `PATCH/GET /api/user` — Update/fetch user profile
- `POST /api/stripe/checkout` — Create Stripe checkout session
- `POST /api/stripe/portal` — Create Stripe billing portal session
- `POST /api/stripe/webhook` — Stripe webhook handler

## Tech Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript 5.5 |
| Styling | Tailwind CSS |
| Auth | NextAuth.js v4 |
| Database | PostgreSQL + Prisma |
| Payments | Stripe |
| Email | Resend |

## Quick Start

```bash
git clone https://github.com/reedsullivaan/nextjs-saas-starter.git
cd nextjs-saas-starter
cp .env.example .env.local
npm install
npx prisma db push
npx prisma db seed    # Creates demo user: demo@example.com / password123
npm run dev
```

## Project Structure

```
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   ├── onboarding/page.tsx
│   │   └── invite/[token]/page.tsx
│   ├── (dashboard)/dashboard/
│   │   ├── page.tsx                           # Workspace list
│   │   ├── new/page.tsx                       # Create workspace
│   │   ├── settings/page.tsx                  # Account settings
│   │   └── [slug]/
│   │       ├── page.tsx                       # Workspace home
│   │       └── settings/
│   │           ├── page.tsx                   # Workspace settings
│   │           └── members/page.tsx           # Team management
│   ├── api/
│   │   ├── auth/register/route.ts
│   │   ├── auth/[...nextauth]/route.ts
│   │   ├── workspaces/route.ts
│   │   ├── workspaces/[workspaceId]/invites/route.ts
│   │   ├── invites/[token]/route.ts
│   │   ├── invites/[token]/accept/route.ts
│   │   ├── user/route.ts
│   │   └── stripe/{checkout,portal,webhook}/route.ts
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── lib/
│   ├── auth.ts           # NextAuth config with Prisma adapter
│   ├── db.ts             # Prisma client singleton
│   ├── email.ts          # Resend templates with HTML sanitization
│   └── stripe.ts         # Checkout, portal, subscription handling
├── prisma/
│   ├── schema.prisma     # User, Account, Session, Workspace, Member, Invite
│   └── seed.ts           # Demo data
├── types/
│   └── next-auth.d.ts    # Session type extension
├── middleware.ts          # Route protection
├── .env.example
└── package.json
```

## Environment Variables

```bash
# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/saas"

# NextAuth
NEXTAUTH_SECRET="openssl rand -base64 32"
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# OAuth
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""

# Stripe
STRIPE_SECRET_KEY=""
STRIPE_WEBHOOK_SECRET=""
STRIPE_PRO_PRICE_ID=""

# Email
RESEND_API_KEY=""
```

## What's NOT Included (Yet)

These are on the roadmap but not built:

- [ ] Command palette (⌘K)
- [ ] Sidebar navigation layout
- [ ] Dark mode toggle (Tailwind dark classes are configured but no UI toggle)
- [ ] tRPC
- [ ] File uploads
- [ ] Activity audit log
- [ ] Rate limiting

## License

MIT — [Reed Sullivan](https://hatchstudio.dev)
