# Production infra (Blaze + R2 + cost tuning)

Snapmate MVP on **Firebase Blaze** + **Cloudflare R2**.  
Region: **`asia-northeast3`** (Seoul).

---

## 1. Blaze upgrade

[Firebase Console → Usage and billing](https://console.firebase.google.com/project/snap-6bfca/usage/details) → **Upgrade to Blaze**.

- Pay-as-you-go; MVP often stays near **$0** inside free tiers.
- Required for **Cloud Functions** deploy (not only Secret Manager).

Recommended: set a **Google Cloud budget alert** (e.g. $10/month) in GCP Billing.

---

## 2. Cloudflare R2

See [r2-setup.md](./r2-setup.md).

| Step | Action |
|------|--------|
| Bucket | Create e.g. `snapmate-media` |
| Public URL | R2.dev subdomain or custom domain |
| API token | Read & Write on bucket only |
| CORS | PUT/GET for app origin (tighten in prod) |

---

## 3. Functions env (`functions/.env`)

```bash
cp functions/.env.example functions/.env
# fill R2_* — do NOT commit
```

Deploy injects this file into Cloud Functions runtime (no `firebase functions:secrets:set`).

---

## 4. App env

| Environment | Config |
|-------------|--------|
| Local | `.env.local` → `EXPO_PUBLIC_*` |
| EAS production | `SNAPMATE_*` secrets → [eas-production-security.md](./eas-production-security.md) |

**Must match:** `EXPO_PUBLIC_R2_PUBLIC_BASE_URL` === `R2_PUBLIC_BASE_URL`.

**Do not set** `EXPO_PUBLIC_USE_FUNCTIONS_EMULATOR=1` in production builds.

---

## 5. Deploy order

```bash
npm run firestore:deploy
cd functions && npm install && npm run build && cd ..
npm run functions:deploy
```

Verify in app (dev build or release):

- [ ] Login
- [ ] Profile photo upload → `profiles/{uid}/avatar-*.jpg` on R2
- [ ] Group photo upload
- [ ] Push on new photo (FCM + inbox)

---

## 6. Cost optimizations (built-in)

| Area | Setting |
|------|---------|
| Functions scale | `minInstances: 0` (no idle bill) |
| Memory | `256MiB` global |
| Max instances | Default 6–8 (env override) |
| R2 presign TTL | 600s default |
| FCM tokens / user | Max 5 (client + server trim) |
| Group member check | 60s in-memory cache on presign |
| FCM send | Chunked 500 tokens |
| Firestore reads (notify) | `getAll` batches of 10 users |

Optional overrides in `functions/.env` — see `functions/.env.example`.

---

## 7. What we do NOT use

- Firebase Storage (media is R2)
- Secret Manager (uses `functions/.env` at deploy)
- `minInstances > 0` (would add fixed monthly cost)

---

## 8. Troubleshooting

| Symptom | Check |
|---------|--------|
| Blaze / Cloud Build error | Project upgraded? Wait 5 min, retry deploy |
| `Missing Functions env` | `functions/.env` filled before deploy |
| Upload `permission-denied` | User in `groups.members`, path matches `profiles/` or `groups/` |
| Image 404 | `R2_PUBLIC_BASE_URL` public access / custom domain |
| No push | Functions deployed, FCM tokens on `users`, real device not Expo Go |
