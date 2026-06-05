# Custom fonts

Drop your font files here before building. They are bundled into the static site (no runtime CDN).

| File | Role | CSS family |
|------|------|------------|
| `howfar-primary.woff2` | Goals, UI text | `Howfar Primary` → `--font-primary` |
| `howfar-mono.woff2` | Time labels, countdown | `Howfar Mono` → `--font-mono` |

Until these files exist, the app falls back to system fonts. After adding files, run `pnpm build` and redeploy.
