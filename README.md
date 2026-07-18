# Fit 2 23%

A premium personal training operating system. Local-first, offline-capable,
mobile-first PWA — calm, editorial, and built for years of daily use.

## Docs

- [Vision](docs/Vision.md) — what this product is and is not
- [Architecture](docs/Architecture.md) — stack, layers, data model
- [Roadmap](docs/Roadmap.md) — milestones
- [Training](docs/Training.md) — training methodology and Phase 1 program
- [Design](docs/Design.md) — design language and tokens

## Development

```sh
pnpm install
pnpm dev        # dev server
pnpm test       # unit tests (domain logic)
pnpm build      # typecheck + production build
pnpm lint       # oxlint
```

Stack: Vite · React 19 · TypeScript (strict) · Tailwind v4 · Dexie (IndexedDB) ·
React Router · Motion · vite-plugin-pwa.
