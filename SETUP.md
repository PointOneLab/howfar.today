# Setup & Deployment Guide

This guide covers everything **you** need to do by hand to get `howfar.today` running
and deployed. The application code, tests, and CI are already complete — the steps
below are account/infrastructure tasks that can't be done from the codebase.

> **MVP has no backend, no env vars, and no secrets.** It's a fully static site, so
> deployment is simple and free.

---

## 0. What's already done (no action needed)

- ✅ Full MVP implementation (3 slides, engine, settings, CSV, keyboard nav, favicon).
- ✅ Unit tests, type-checking, linting, production build all passing.
- ✅ GitHub Actions CI (`.github/workflows/ci.yml`) — runs automatically on push/PR.
- ✅ `.node-version` (Node 20) and `packageManager` pinned so Cloudflare/CI pick the
  right toolchain automatically.

---

## 1. Prerequisites

| You need                  | Notes                                                                                  |
| ------------------------- | -------------------------------------------------------------------------------------- |
| The GitHub repo           | Already exists: `PointOneLab/howfar.today`.                                            |
| A Cloudflare account      | Free tier is enough — sign up at [dash.cloudflare.com](https://dash.cloudflare.com).   |
| The `howfar.today` domain | Optional but recommended. Easiest if the domain is (or becomes) managed by Cloudflare. |
| Node ≥ 20 + pnpm          | Only needed if you want to run it locally.                                             |

---

## 2. Merge the open pull requests

Two PRs are open. Merge both into `main`:

1. **PR #1** — adds the source PRD PDF.
2. **PR #2** — the MVP implementation.

They are independent, so merge order doesn't matter. After merging, CI will run on
`main` automatically.

```bash
# (optional) update your local copy afterwards
git checkout main
git pull origin main
```

---

## 3. Run it locally (optional, to verify)

```bash
pnpm install      # installs dependencies
pnpm dev          # open the printed http://localhost:5173 URL
```

Other useful scripts: `pnpm build`, `pnpm preview`, `pnpm test`, `pnpm lint`.

> If `pnpm install` warns about an ignored build script for `esbuild`, run
> `pnpm approve-builds` once (choose `esbuild`) — this is a local-only convenience.

---

## 4. Deploy to Cloudflare Pages (recommended: dashboard)

This is the simplest path and gives you automatic deploys on every push to `main`.

1. Go to **Cloudflare Dashboard → Workers & Pages → Create → Pages → Connect to Git**.
2. Authorize GitHub and select the **`PointOneLab/howfar.today`** repository.
3. Configure the build with these exact settings:

   | Setting                | Value              |
   | ---------------------- | ------------------ |
   | Production branch      | `main`             |
   | Framework preset       | `None` (or `Vite`) |
   | Build command          | `pnpm build`       |
   | Build output directory | `dist`             |

   Node version and pnpm are detected automatically from `.node-version` and the
   `packageManager` field. If Cloudflare ever defaults to an old Node, add an
   environment variable `NODE_VERSION = 20` under the project's settings.

4. Click **Save and Deploy**. Cloudflare builds and publishes to a
   `*.pages.dev` URL.
5. Every future push to `main` now deploys automatically; pull requests get preview
   URLs.

---

## 5. Connect the custom domain `howfar.today`

In your Cloudflare Pages project → **Custom domains → Set up a custom domain**:

- **If the domain is registered/managed in Cloudflare:** enter `howfar.today`, and
  Cloudflare adds the required DNS records for you. Done.
- **If the domain is registered elsewhere:** either move the nameservers to Cloudflare
  (recommended), or add the CNAME record Cloudflare shows you at your current DNS
  provider:
  - `howfar.today` → `<your-project>.pages.dev` (Cloudflare handles the apex/CNAME
    flattening when the zone is on Cloudflare).
- Add `www.howfar.today` as a second custom domain too if you want it to resolve.

SSL certificates are provisioned automatically (free).

---

## 6. (Optional) Automatic deploys via GitHub Actions instead of the dashboard

Only do this if you prefer driving deploys from CI rather than Cloudflare's Git
integration. It requires two secrets.

1. In Cloudflare: **My Profile → API Tokens → Create Token** using the
   **"Edit Cloudflare Workers"** template (or a custom token with the
   _Account → Cloudflare Pages → Edit_ permission). Copy the token.
2. Find your **Account ID** on the dashboard home page (right sidebar).
3. In GitHub: **Repo → Settings → Secrets and variables → Actions → New repository
   secret** and add:
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`
4. Tell me to add a deploy job to the workflow (using `cloudflare/wrangler-action`),
   and I'll wire it up to publish `dist` after the build passes.

> Don't enable both this **and** the dashboard Git integration for the same branch, or
> you'll get duplicate deploys. Pick one.

---

## 7. (Optional) Cursor cloud-agent environment

If you'll keep using cloud agents on this repo and want them to skip dependency setup:

- Run an environment-setup agent at **[cursor.com/onboard](https://cursor.com/onboard)**
  with a prompt like:
  > "Node 20+ project using pnpm. Run `pnpm install` and pre-approve the esbuild build
  > script so `pnpm build` / `pnpm test` work out of the box."

No application secrets are required for the MVP.

---

## 8. Final checklist

- [ ] PR #1 and PR #2 merged into `main`.
- [ ] CI is green on `main`.
- [ ] Cloudflare Pages project created and first deploy succeeded (`*.pages.dev` works).
- [ ] `howfar.today` custom domain added and resolving over HTTPS.
- [ ] (Optional) `www` subdomain added.

---

## 9. Troubleshooting

| Symptom                            | Fix                                                                                                          |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Build fails with an old Node error | Add env var `NODE_VERSION = 20` in the Pages project settings.                                               |
| Build can't find pnpm              | Ensure `pnpm-lock.yaml` is committed (it is) — Cloudflare auto-detects pnpm from it.                         |
| Blank page after deploy            | Confirm **Build output directory** is `dist`.                                                                |
| Domain not resolving               | Check the DNS record / that the zone's nameservers point to Cloudflare; allow a few minutes for propagation. |

---

## What I cannot do for you

These require your accounts/credentials and must be done in the dashboards above:

- Creating the Cloudflare account and Pages project.
- Authorizing GitHub access to Cloudflare.
- Domain registration / DNS / nameserver changes for `howfar.today`.
- Creating the Cloudflare API token & adding GitHub/Cursor secrets (only if you choose
  the optional CI-deploy or secret-backed workflows).
