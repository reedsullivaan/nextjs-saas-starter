# Next.js SaaS Starter Kit

A production-ready SaaS boilerplate with authentication, billing, and team management built in. Skip the setup, start building features.

![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue) ![Next.js](https://img.shields.io/badge/Next.js-14-black) ![Tailwind](https://img.shields.io/badge/Tailwind-3.4-38bdf8) ![License](https://img.shields.io/badge/License-MIT-green)

## What's Included

- **Auth** — Email/password + OAuth (Google, GitHub) via NextAuth.js
- **Billing** — Stripe subscriptions with usage metering, customer portal, webhooks
- **Teams** — Multi-tenant with invite system, role-based access (Owner/Admin/Member)
- **Dashboard** — Responsive layout with sidebar nav, command palette (⌘K), dark mode
- **Database** — Prisma ORM with PostgreSQL, migrations, seed scripts
- **Email** — Transactional emails via Resend (welcome, invite, billing alerts)
- **API** — Type-safe API routes with Zod validation and error handling
- **Deploy** — One-click Vercel deploy, environment variable management

## Tech Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript 5.5 |
| Styling | Tailwind CSS + shadcn/ui |
| Auth | NextAuth.js v5 |
| Database | PostgreSQL + Prisma |
| Payments | Stripe |
| Email | Resend |
| Hosting | Vercel |

## Quick Start

```bash
npx create-next-app -e https://github.com/reed-sullivan/nextjs-saas-starter
cd nextjs-saas-starter
cp .env.example .env.local
npm install
npx prisma db push
npm run dev
```

## Project Structure

```
├── app/
│   ├── (auth)/          # Login, register, forgot password
│   ├── (dashboard)/     # Protected app routes
│   │   ├── settings/    # Account, billing, team
│   │   └── [workspace]/ # Multi-tenant workspace routes
│   ├── api/
│   │   ├── auth/        # NextAuth endpoints
│   │   ├── stripe/      # Webhook handlers
│   │   └── trpc/        # tRPC router
│   └── layout.tsx
├── components/
│   ├── ui/              # shadcn/ui primitives
│   ├── dashboard/       # Layout, sidebar, command palette
│   └── billing/         # Pricing cards, usage meters
├── lib/
│   ├── auth.ts          # NextAuth config
│   ├── stripe.ts        # Stripe helpers
│   ├── db.ts            # Prisma client
│   └── email.ts         # Resend templates
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
└── .env.example
```

## Authentication

Supports email/password and OAuth providers. Session management via JWT with automatic refresh.

```typescript
// app/api/auth/[...nextauth]/route.ts
export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({ clientId: env.GOOGLE_ID, clientSecret: env.GOOGLE_SECRET }),
    GitHubProvider({ clientId: env.GITHUB_ID, clientSecret: env.GITHUB_SECRET }),
    CredentialsProvider({
      credentials: { email: {}, password: {} },
      authorize: async (creds) => {
        const user = await db.user.findUnique({ where: { email: creds.email } });
        if (!user || !await verify(user.password, creds.password)) return null;
        return { id: user.id, email: user.email, name: user.name };
      }
    })
  ],
  callbacks: {
    session: ({ session, token }) => ({ ...session, user: { ...session.user, id: token.sub } })
  }
};
```

## Billing

Stripe integration handles subscriptions, trials, and usage-based billing out of the box.

```typescript
// lib/stripe.ts
export async function createCheckoutSession(userId: string, priceId: string) {
  const user = await db.user.findUnique({ where: { id: userId } });
  
  return stripe.checkout.sessions.create({
    customer: user.stripeCustomerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${env.APP_URL}/dashboard?upgraded=true`,
    cancel_url: `${env.APP_URL}/pricing`,
    subscription_data: { trial_period_days: 14 }
  });
}
```

## Team Management

Multi-tenant architecture with workspace isolation. Invite team members via email with role-based permissions.

```typescript
// Prisma schema
model Workspace {
  id        String   @id @default(cuid())
  name      String
  slug      String   @unique
  members   Member[]
  plan      Plan     @default(FREE)
}

model Member {
  id          String    @id @default(cuid())
  role        Role      @default(MEMBER)
  user        User      @relation(fields: [userId], references: [id])
  workspace   Workspace @relation(fields: [workspaceId], references: [id])
}

enum Role { OWNER ADMIN MEMBER }
enum Plan { FREE PRO ENTERPRISE }
```

## Environment Variables

```bash
# .env.example
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="your-secret"
NEXTAUTH_URL="http://localhost:3000"

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

## Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/reed-sullivan/nextjs-saas-starter)

## License

MIT — use it, ship it, make money with it.

---

Built by [Reed Sullivan](https://hatchstudio.dev) at **Hatch Studio**.
