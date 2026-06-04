# howfar.today

A hyper-minimalist, full-screen **day virtualizer** that balances daily planning with
real-time progress awareness. One page, three full-screen slides, no visual noise.

- **Focus** — a distraction-free view of your current time slot, with a full-bleed
  progress fill.
- **Day visualizer** — your whole day as an editable grid of hour rows and segments.
- **Settings** — structure, typography, colors, behavior, and CSV import/export.

See [`PRD.md`](./PRD.md) for the full product spec and design decisions.

## Tech stack

React 18 · TypeScript · Vite · Zustand · plain CSS (custom-property design tokens) ·
localStorage (behind a swappable storage interface) · Vitest · ESLint/Prettier.
Deployed on Cloudflare Pages.

## Getting started

Requires Node ≥ 20 and [pnpm](https://pnpm.io/).

```bash
pnpm install
pnpm dev          # start the dev server
```

### Scripts

| Command          | Description                                   |
| ---------------- | --------------------------------------------- |
| `pnpm dev`       | Start the Vite dev server                     |
| `pnpm build`     | Type-check and build for production (`dist/`) |
| `pnpm preview`   | Preview the production build locally          |
| `pnpm test`      | Run the Vitest unit suite                     |
| `pnpm typecheck` | Type-check without emitting                   |
| `pnpm lint`      | Lint with ESLint                              |
| `pnpm format`    | Format with Prettier                          |

## Architecture

Business logic is fully decoupled from rendering. The framework-agnostic `src/core`
layer (domain model, time/segment engine, storage interface, CSV engine) has no React
dependency, so the UI, persistence, and future cloud-sync adapters can evolve
independently. See [`PRD.md`](./PRD.md#8-source-code-architecture-decoupled-by-concern).

## Deployment (Cloudflare Pages)

Connect the repository in the Cloudflare Pages dashboard with:

- **Build command:** `pnpm build`
- **Build output directory:** `dist`
- **Node version:** 20+

The app is fully static (no backend in the MVP).

## License

[MIT](./LICENSE) — open source. Contributions welcome.
