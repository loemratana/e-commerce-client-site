# e-commerce-client-site

Customer-facing storefront built with Next.js 16, React and Tailwind CSS. It talks to the e-commerce REST API (`/api/v1/...`) for products, categories, reviews, cart, checkout (Stripe), orders, returns and store settings.

## Getting started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create `.env.local` in the project root and point it at the API:

   ```bash
   NEXT_PUBLIC_API_URL=http://localhost:8083
   ```

3. Start the dev server:

   ```bash
   npm run dev
   ```

   Then open http://localhost:3000.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Build for production |
| `npm start` | Run the production build |
| `npm run lint` | Lint the code |
| `npm test` | Run the unit tests in `src/lib/__tests__` |

## Project layout

- `src/app` – routes (Next.js App Router)
- `src/components` – UI components by page/feature
- `src/hooks` – data-loading hooks
- `src/lib/api` – API client and endpoint wrappers
- `src/types` – API response types
