# Agua Limpa Beachwear

Storefront built with React, TanStack Start, TypeScript, Tailwind CSS and Vite.
Connected to [Lovable](https://lovable.dev/projects/720d0399-5a01-40e6-b934-79f72f287d06)
and [GitHub](https://github.com/pablinrlq/seaside-palette-project).

## Development

Install Node.js and pnpm, then run:

```sh
pnpm install --frozen-lockfile
pnpm dev
```

## Checks

```sh
pnpm lint
pnpm exec tsc --noEmit
pnpm build
```

## Design

The current storefront uses white, deep green and lime, with existing transparent
brand marks and product photography. Shared visual rules live in
[src/styles.css](src/styles.css) and [src/storefront.css](src/storefront.css).
The [design record](docs/design-refresh.md) documents the generated campaign
asset, its prompt, the updated flows and verification.

## Store behavior

- Product browsing, size/color filters, sorting and accent-insensitive search.
- Quick purchase and product details with size selection and photo zoom.
- Cart persisted in the browser, with independent quantities per size.
- Internal checkout layout; payments remain disabled until a real provider and
  order backend are connected.
- The existing admin screen edits a browser-local catalog. Its client-side
  password gate is not production authentication.

Product/catalog data, stock and cart totals must be verified by a backend before
real orders are accepted. The current browser data is not shared across devices.
Customer contact/address fields are not sent or persisted.

## Repository

Keep the connected branch buildable. Do not rewrite published Git history:
see [AGENTS.md](AGENTS.md). The site publication should be checked separately
from a successful GitHub push.
