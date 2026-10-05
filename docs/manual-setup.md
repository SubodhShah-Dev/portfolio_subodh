# Manual setup

Everything here is intentionally **manual**: the repository never contains real
credentials, project ids, or accounts. Follow this once per environment.

---

## 1. Firebase project

1. Create a project at <https://console.firebase.google.com> (Spark plan is
   enough for a portfolio).
2. In the project, enable the products you need:

   | Product | Required? | Why |
   | --- | --- | --- |
   | **Authentication** (Email/Password provider) | Yes | Admin sign-in to `/admin` |
   | **Firestore** | Yes | All portfolio content lives here |
   | **Storage** | Only for PDF resume upload | The external-URL resume path works without it |
   | **Hosting** | For production | Serves the built `dist/` |

3. Firestore: create a database (production mode) in the region closest to you.

## 2. Web app configuration → `.env.local`

1. Firebase console → **Project settings → Your apps → Web app (`</>`)** →
   register an app and copy the config values.
2. Create `.env.local` in the repo root (it is git-ignored):

   ```bash
   VITE_FIREBASE_API_KEY=...
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project
   VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=...
   VITE_FIREBASE_APP_ID=...
   VITE_SITE_URL=https://your-site.web.app
   ```

Notes:

- `.env.development` already sets `VITE_USE_FIREBASE_EMULATORS=true`, so local
  `npm run dev` ignores real credentials. Do **not** set that flag in
  `.env.local` unless you really want emulator mode.
- `VITE_SITE_URL` is used for absolute links (e.g. App Check / canonical URL).
  Fill it once the site has a domain.
- `VITE_FIREBASE_APPCHECK_SITE_KEY` is optional — only if you enable App Check
  in the console.

## 3. Project id for the Firebase CLI → `.firebaserc`

Replace the placeholder:

```json
{
  "projects": {
    "default": "your-project"
  }
}
```

Local emulator runs (`npm run emulators`, `npm run test:rules`) use
`--project demo-portfolio-cms` instead, so this file only matters for real
deploys.

## 4. Admin account

Two steps — both are required; authentication alone never grants access.

1. **Authentication → Users → Add user** → email + password (this is what
   `/admin/login` uses).
2. **Firestore → Start collection → Document ID = the user's UID**, field:

   ```
   role: "admin"   (string)
   ```

   The resulting document is `admins/{uid}` with `{ role: "admin" }`.

Why: security rules check this document on every write. It has **no create or
update rule for clients** precisely so it can only be made from the console.
Never test admin access without it — you will sign in fine and then get
permission errors on every save.

## 5. Deploy rules and indexes

```bash
npm ci
npx firebase deploy --only firestore:rules,firestore:indexes,storage
```

- `firestore.rules` — public read of published content, admin-only writes,
  message creation for visitors, admin-only inbox.
- `firestore.indexes.json` — the composite indexes required by the public
  queries (`status + order`, resumes `isActive + updatedAt`). Without them the
  public site fails loudly — deploy them.
- `storage.rules` — public read of `resumes/**`, admin-only PDF uploads.

If you skip Storage (no bucket), deploy only the Firestore parts:

```bash
npx firebase deploy --only firestore:rules,firestore:indexes
```

## 6. Local verification

```bash
npm run emulators            # terminal 1
npm run dev                  # terminal 2 — admin at /admin/login
npm test                     # unit + component tests
npm run test:rules           # security-rules tests on the emulators
```

Checklist:

- [ ] `/` renders the public site (empty-state copy until content exists)
- [ ] `/admin/login` signs in with the account from step 4
- [ ] Creating content in the admin works (no permission errors)
- [ ] The new content appears on `/` after publishing
- [ ] `npm run test:rules` passes (24 tests)

## 7. GitHub repository and deploys

1. Push the repository to GitHub.
2. **Settings → Secrets and variables → Actions**:

   | Kind | Name | Value |
   | --- | --- | --- |
   | Secret | `FIREBASE_SERVICE_ACCOUNT` | Full JSON of a service account with Firebase Admin / Hosting deploy permissions (Project settings → Service accounts → Generate new private key) |
   | Variable | `FIREBASE_PROJECT_ID` | Your Firebase project id |

3. Pushes to `main` then run CI (`.github/workflows/ci.yml`) and deploy
   (`.github/workflows/deploy.yml`: Hosting, Firestore rules/indexes, Storage
   rules). Until both the secret and variable exist, the deploy job still
   builds and tests, but skips the deploy with a notice — nothing fails.

Treat the service-account JSON like a password: it lives only in the GitHub
secret (and `runner.temp` during the job); the repo already git-ignores
`*service-account*.json`.

## 8. Post-deploy smoke test

- [ ] Public site loads on the hosted URL with `VITE_SITE_URL`
- [ ] Admin login works against production
- [ ] Publishing a change updates the public site (cache expires within
      5 minutes, or sign out/in)
- [ ] Contact form creates a message visible in the admin inbox
- [ ] Resume download link works (Storage upload or external URL)
