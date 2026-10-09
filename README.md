# Portfolio CMS

A dynamic, Firestore-backed portfolio website with a full admin CMS. The public
site renders only published content; the admin area manages every piece of
portfolio data — profile, projects, skills, experience, education,
certifications, social links, resume, contact settings, and the contact-form
inbox.

No content is fabricated anywhere: empty sections are hidden, empty lists show
honest empty states, and nothing is invented to make the site look fuller.

## Design

Two coordinated visual systems in one stylesheet:

- **Pop Mono — the public portfolio.** Monochrome base with one accent:
  paper canvas (`#fafaf7`) and near-black ink (`#141414`) carry the page,
  electric ultramarine (`#3d34f5`) cobalt carries links, focus rings, hover
  floods, the reading-progress bar, and small highlights; giant condensed
  Bricolage Grotesque display type, IBM Plex Mono meta labels, and hard
  offset shadows (`shadow-pop`) on chunky-radius cards and press-down pill
  buttons (black primary / white outlined, both flooding cobalt on hover).
  Sections ride hairline dividers with arrow-circle badges; the hero is
  paper-on-paper with a cobalt drawn rule, the name's first *o* rendered as
  a circular `</>` icon, social pills beside the CTAs on desktop (stacked
  below the full-width buttons on small screens), and a bobbing
  terminal-card decor; the footer is a full-bleed black band with
  `signal-soft` accents and a swipeable stacked photo deck in About. A light/dark toggle
  (localStorage → `prefers-color-scheme` → light) flips one class — white
  pills keep fixed navy text via `--color-on-accent`, and borders/shadows
  follow `--color-ink` so the neobrutalist frame turns light on the dark
  canvas. Admin pages are unaffected.
- **Ink Console — the admin CMS.** Always dark: near-black ink canvas, raised
  panels, the same ultramarine accent, Bricolage headings, mono nav, sharp
  primitives. (Tailwind's slate/emerald utility names are kept but their
  values are re-pointed in `@theme` — grep-verified admin-only usage.)

Public-site touches: a scrollspy nav whose order mirrors the homepage scroll
chain (Work lights up for both the `/projects` route and the homepage
projects section, and the last section stays lit through the footer), an embla
carousel showcase of featured projects below `lg` that turns into a static
3-column card grid with no carousel chrome — at `lg`+ on the homepage,
while `/projects` keeps
its two-column grid, ⌘K command palette (lazy `cmdk`), Lenis smooth scrolling,
route view transitions, a keyboard-navigable project gallery lightbox,
confetti on contact send, copy-email toast, and a theme toggle in the header.
The About photo deck is edited as one-URL-per-line in Admin → Profile
(`profileImageUrls`, legacy `profileImageUrl` mirrors the front card). The
dashboard seeder is fill-missing: it only ever adds sample entries whose
documents are absent and never overwrites owner content.

## Stack

| Layer | Choice |
| --- | --- |
| UI | React 19, TypeScript ~5.9, Vite 8 |
| Styling | Tailwind CSS 4, hand-rolled design-system classes, Fontsource variable fonts (Bricolage Grotesque, Instrument Sans, IBM Plex Mono) |
| Libraries | lenis (smooth scroll), motion, cmdk (⌘K palette), lucide-react, canvas-confetti |
| Routing | React Router v8 (`createBrowserRouter`, data routers, lazy admin routes) |
| Backend | Firebase — Auth (email/password), Firestore, Storage (optional) |
| Testing | Vitest 5, Testing Library, jsdom; Security Rules tests on the Emulator Suite |
| Linting | ESLint 10 + typescript-eslint (recommendedTypeChecked) + react-hooks |

## Getting started

Prerequisites: **Node 26** (see `.nvmrc`) and a JDK (21) for the Firebase
emulators.

```bash
npm ci
npm run dev          # public site + admin at http://localhost:5173
```

Local development runs entirely against the Firebase Emulator Suite
(`.env.development` sets `VITE_USE_FIREBASE_EMULATORS=true`), so no development
write can ever reach production data.

```bash
npm run emulators    # emulators only (auth :9099, firestore :8080, storage :9199, ui :4000)
```

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Vite dev server |
| `npm run build` / `preview` | Production build / preview it |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint over the whole repo |
| `npm test` | Unit + component tests (jsdom) |
| `npm run test:rules` | Security Rules tests against the emulators |
| `npm run emulators` | Start the emulator suite for manual testing |

## Project structure

```
src/
  components/
    admin/        Admin page building blocks (forms, rows, shell)
    layout/       PublicShell (site chrome) + SidebarShell (admin)
    public/       Public site sections (hero, skills, projects, …)
    ui/           Design system (Button, Alert, ConfirmDialog, …)
  config/         Firebase init, emulator wiring, App Check
  context/        AuthContext — admin session + admins/{uid} verification
  hooks/          useAsync, useMutation, useOrderedCollection
  layouts/        PublicLayout (Signal chrome), AdminLayout (Ink Console)
  loaders/        Route loaders for the public site
  pages/          Route components (public/, admin/)
  routes/         Router table, PublicErrorBoundary
  services/       Firestore CRUD per collection + shared helpers
  types/          One module per domain
  utils/          Validation, URL checks, Firebase error normalization
tests/
  component/      Component and page tests
  unit/           Pure-function tests
  rules/          Firestore/Storage Security Rules tests (emulator)
docs/             Manual configuration guide
```

## Firebase architecture

- **Content lifecycle** — every listable collection uses
  `draft → published → archived`; public queries filter `status == "published"`
  and order by `order`, matching the Security Rules exactly.
- **Reads** — the public site loads through route loaders with a 5-minute
  client cache (`contentCache.ts`); admin pages load fresh through hooks.
- **Writes** — admin-only, validated client-side and enforced by
  `firestore.rules` / `storage.rules` (tested by `npm run test:rules`).
- **Authorization** — being signed in is not enough: `admins/{uid}` must exist
  with `{ role: "admin" }`. That document is never client-writable; it is
  created manually (see [docs/manual-setup.md](docs/manual-setup.md)).
- **Resume** — external URL is the primary path; PDF upload to Storage works
  when a bucket exists and fails with neutral messaging when it does not.

## Configuration

The app runs out of the box against emulators. Real Firebase credentials,
project ids, admin accounts, and CI deploy secrets are **manual setup** — see
**[docs/manual-setup.md](docs/manual-setup.md)**.

## CI

- `.github/workflows/ci.yml` — typecheck, lint, unit tests, build, and the
  emulator-based rules tests on every push/PR.
- `.github/workflows/deploy.yml` — builds and deploys Hosting + rules +
  indexes + Storage rules on pushes to `main`, once the
  `FIREBASE_SERVICE_ACCOUNT` secret and `FIREBASE_PROJECT_ID` variable are
  configured (skips with a notice until then).
