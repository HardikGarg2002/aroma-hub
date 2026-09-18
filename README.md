This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Data: Supabase or sample data

Admin data (products, collections, orders) comes from either Supabase or the
in-memory sample stores. `ADMIN_DATA_SOURCE` picks:

| value      | source                                                        |
| ---------- | ------------------------------------------------------------- |
| `supabase` | the database                                                   |
| `mock`     | sample data in `lib/admin/*.mock.ts` (resets on server restart) |
| unset      | `supabase` if `SUPABASE_SECRET_KEY` is set, else `mock`         |

Pages and server actions always import from `lib/admin/products.ts`,
`collections.ts` and `orders.ts`; those modules re-export whichever
implementation is selected, so nothing else in the app changes with the mode.

### First-time Supabase setup

1. Copy `.env.example` to `.env.local` and fill in the values. The secret key
   is in the Supabase dashboard under **Project Settings > API Keys**; it
   bypasses RLS, so keep it out of the browser and out of git.
2. Run `supabase/migrations/0001_collections_and_orders.sql` in the Supabase
   SQL editor. It creates `collections` and `orders`; the pre-existing
   `products` table is left untouched. Safe to re-run.
3. Start the app. To go back to sample data at any point, set
   `ADMIN_DATA_SOURCE=mock`.

RLS is enabled on `collections` and `orders`. The publishable key can read
active collections only; orders are readable exclusively through the
service-role key, since they hold customer names, emails and addresses. Check
that `products` has RLS enabled too, with a read policy for active rows.


## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
