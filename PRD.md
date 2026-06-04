# howfar.today — Product Requirement Document (MVP)

> Finalized PRD consolidating the original draft (`Minimalist_Day_Planner_Web_App_-_PRD.pdf`)
> with the alignment decisions made before implementation. This document is the
> source of truth for the MVP.

## 1. Vision & Architectural Philosophy

`howfar.today` is a hyper-minimalist, single-page, full-screen **day virtualizer**
that balances daily planning with real-time progress awareness. It embodies
contemporary flat minimalism — deliberately rejecting shadows, rounded corners,
complex borders, and non-functional visual noise.

**Extensible foundation.** Although it launches as a polished single-file MVP, the
codebase is structured as a decoupled, modular framework. Business logic, timing
systems, rendering calculations, and configuration models are cleanly separated so
future capabilities (cloud sync, calendar integrations, task dragging/splitting,
multi-user real-time views) can be layered in without rework.

## 2. Aligned Decisions (MVP scope)

These decisions were locked in during pre-implementation alignment:

| #   | Topic                 | Decision                                                                                                                                                                                                                                                                 |
| --- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | **Data model**        | A single recurring routine. Goals persist day-to-day; only completion/failure **statuses reset each routine day**. The state/storage layer is structured so **up to 7 weekday-specific routines** can be added later without refactoring (see `core/engine/routine.ts`). |
| 2   | **Day window**        | Configurable start/end hour. **Cross-midnight windows are supported** (e.g. `22:00 → 06:00`, or `04:00 → 04:00` = a full 24h day), capped at a maximum of **24 hours**. Outside the window the Focus slide shows a neutral "day not started" / "day complete" message.   |
| 3   | **Failure semantics** | When status coloring is ON, **every uncompleted past segment fails — including empty (unplanned) ones**, since "no plan for the segment" is part of the definition of failing. Status is derived purely from wall-clock time (no requirement that the app was open).     |
| 4   | **License**           | **MIT.**                                                                                                                                                                                                                                                                 |

### Conventions & defaults (chosen by judgment, tweakable)

- App opens on the **Day Visualizer** (main) slide.
- No analytics / telemetry (privacy-first; sharing exposes only the bare URL).
- **Goals are editable in every state** (past included). Completion can be toggled on
  the active and past segments while the routine window is running.
- **No animations** except the deliberate slide "fade-through-black" transition;
  progress fills update instantly to the current time (no catch-up animation).
- Changing structure (start/end hour, segments-per-hour) **prunes goals/completion**
  that no longer map to a segment — removed slots are erased permanently.
- All persisted state lives in `localStorage` behind a storage abstraction; **no backend** in the MVP.

## 3. Tech Stack

| Aspect      | Choice                                              | Rationale                                                                                                             |
| ----------- | --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Framework   | **React 18 + Vite + TypeScript**                    | Industry standard, largest OSS contributor pool, future-proof for planned real-time/multi-user features.              |
| State       | **Zustand**                                         | Minimal, decoupled stores; trivial persistence.                                                                       |
| Styling     | **Plain CSS + CSS custom properties**               | Design tokens map 1:1 to CSS variables → runtime theming is trivial; matches the relative-units + minimalist mandate. |
| Persistence | **localStorage** behind a `ConfigStorage` interface | Swappable later for a Cloud (e.g. Cloudflare D1/KV) adapter.                                                          |
| Testing     | **Vitest**                                          | Fast unit tests for the time/segment engine.                                                                          |
| Quality     | **ESLint + Prettier**                               | Standard.                                                                                                             |
| Tooling     | **pnpm**                                            | Fast, efficient.                                                                                                      |
| Hosting     | **Cloudflare Pages**                                | Free, global CDN, static SPA; clean path to Workers/D1 for future sync.                                               |
| CI          | **GitHub Actions**                                  | Lint + typecheck + test + build on every push/PR.                                                                     |

## 4. Layout Architecture

- Single-page, full-bleed viewport split into exactly **three stacked slides**, each
  `100dvw × 100dvh` (`dvw`/`dvh` to avoid mobile browser-chrome shifts).
- **Relative sizing mandate:** all dimensions, paddings, strokes, and font sizes use
  fluid relative units (`vw`, `vh`, `%`).
- **Scroll-snapping** between slides (wheel, touch, trackpad) with a "fade-through-black"
  transition: the outgoing slide darkens and the incoming slide lightens.
- **Up/Down arrows** move between slides when not editing a grid input.

## 5. Screen Specifications

### Slide 1 — Focus Mode (top)

- Full-bleed horizontal **progress fill** for the active segment (`0% → 100%` over its
  duration), smoothly animated.
- **Header**: the running segment's bounds, e.g. `07:15 — 07:30`.
- **Centered goal** in large typography (falls back to `Focus` when empty).
- **Status button** (bottom center): toggles the active segment to _Completed_ and back
  (_revert_). Completion only recolors the fill to the success color — the fill **width
  still reflects real elapsed time**.
- If a segment elapses uncompleted and status coloring is on, it locks as _Failed_.
- Outside the window: neutral "day not started / complete" state.

### Slide 2 — Day Visualizer (middle)

- Vertical viewport divided into equal **hour rows** (e.g. `07:00–24:00` → 17 rows).
- Each hour sliced into **1–6 equal sub-segments**.
- Per segment (always left-aligned): a passive grayed **time indicator** (monospace —
  hour for the first sub-segment, else the starting minute) and a borderless inline
  **goal input** with graceful ellipsis overflow.
- **Goals are editable in every state** (including past).
- Segment backgrounds reflect state via tokens: void (future), active progress fill,
  success (completed), failure (failed), neutral (past with coloring off).
- Completion can be toggled on the **active or past** segments (here or in Focus) while
  the window is running.

### Slide 3 — Settings (bottom)

- **Structure**: start hour, end hour, segments per hour (1–6).
- **Typography & spacing**: independent sliders for **goal text size** (25%–75%),
  **time-indicator size** (10%–60%), and the **horizontal segment gap** (0–3 vw).
- **Colors**: swatches for every design token + grid stroke thickness.
- **Behavior**: status-coloring on/off — governs **both** the success and failure colors
  (off → completed and missed segments alike fall back to neutral).
- **Data portability**: Export to CSV (all parameters, tokens, and goals, spreadsheet
  friendly) and Import from CSV (validated against constraints before applying).
- **Native share**: invokes the browser share sheet with only the bare app URL.
- **Resets**: _Reset content_ (clear all goals + completion) and _Reset design_ (restore
  default colors, fonts, spacing, and behavior).
- **Credits**: ultra-minimal footnote.

## 6. Enhanced Interaction & Utility

### Dynamic tab title & favicon

- Title: `[MM:SS] | Goal — howfar.today`, updated every second; falls back to
  `[MM:SS] | Focus — howfar.today` when the active segment has no goal, and to
  `howfar.today` outside the window.
- A live inline **SVG favicon** reflects current progress and status color.

### Keyboard grid navigation

- **Enter**: save, focus the next chronological segment input, select its text.
- **Shift + Enter**: save, focus the previous segment input.
- **Escape**: save, blur the field, and restore page-level Up/Down slide scrolling.

## 7. Design Token Matrix

| Token (CSS var)     | Purpose                                   |
| ------------------- | ----------------------------------------- |
| `--bg-app`          | App background canvas                     |
| `--color-regular`   | Standard text                             |
| `--color-highlight` | Focused / active states                   |
| `--color-interact`  | Clickable items / inputs                  |
| `--color-secondary` | Muted time indicators / secondary details |
| `--color-success`   | Completed segment background              |
| `--color-failure`   | Failed segment background                 |
| `--color-progress`  | Active running progress fill              |
| `--color-void`      | Unreached future segment background       |
| `--color-grid`      | Grid dividing lines                       |
| `--stroke-grid`     | Grid line thickness                       |

## 8. Source-Code Architecture (decoupled by concern)

```
src/
  core/                 # framework-agnostic domain (no React)
    model/              # types, defaults, validation
    engine/             # time math, segment generation, status, routine resolution
    storage/            # ConfigStorage interface + localStorage adapter
    csv/                # import/export engine
  state/                # Zustand store wiring core + persistence
  services/             # document chrome (title/favicon), token application
  hooks/                # clock, day view, slide navigation
  features/             # focus / visualizer / settings slides
  styles/               # global CSS + design-token variables
```

## 9. Out of Scope (future)

Per-weekday routines (the model is ready), cloud sync & multi-user real-time views,
calendar integrations, task dragging/splitting, accounts/auth, installable PWA/offline.
