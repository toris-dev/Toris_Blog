# Cloudflare R2 storage (Snapmate)

Snapmate stores **images in Cloudflare R2**. Firebase keeps **Auth**, **Firestore**, **FCM**, and **Callable Functions** (presigned URL issuance only).

```
[Expo app]
   │ Firebase Auth (ID token)
   ▼
[Callable: getR2UploadUrl]  ← verifies path + group membership (Firestore)
   │ presigned PUT URL
   ▼
[Cloudflare R2 bucket]
   │ public URL (custom domain or r2.dev)
   ▼
[Firestore photo doc] imageUrl / thumbnailUrl
```

---

## 1. Create R2 bucket

1. [Cloudflare Dashboard](https://dash.cloudflare.com) → **R2** → **Create bucket**
2. Note the bucket name (e.g. `snapmate-media`)

### Public read URL (pick one)

**Option A — R2.dev subdomain (quick dev)**

- Bucket → **Settings** → enable **Public access** / **R2.dev subdomain**
- Base URL example: `https://pub-xxxxxxxx.r2.dev`

**Option B — Custom domain (recommended for production)**

- R2 bucket → **Connect domain** (e.g. `media.yourdomain.com`)
- Base URL: `https://media.yourdomain.com`

Objects are readable at `{baseUrl}/{path}`.

### Object key layout

| Folder | Example key |
|--------|-------------|
| `profiles/` | `profiles/{userId}/avatar-{timestamp}.jpg` |
| `groups/.../photos/` | `groups/{groupId}/photos/{userId}/{photoId}.jpg` |
| `groups/.../thumbnails/` | `groups/{groupId}/thumbnails/{userId}/{photoId}.jpg` |
| `groups/.../cover/` | `groups/{groupId}/cover/cover.jpg` |

Legacy `users/{userId}/profile.jpg` keys remain authorized for delete only.

> Upload authorization is enforced by Callable Functions. Public read means anyone with the URL can view the file — use unguessable paths (photo UUIDs) and tighten Firestore rules before launch.

---

## 2. R2 API token

1. **R2** → **Manage R2 API Tokens** → **Create API token**
2. Permissions: **Object Read & Write** on your bucket
3. Save:
   - Access Key ID
   - Secret Access Key
   - Account ID (Cloudflare dashboard URL or R2 overview)

---

## 3. Firebase Functions env (`functions/.env`)

Snapmate uses **`functions/.env`** (not Secret Manager). Copy the example and fill in values:

```bash
cp functions/.env.example functions/.env
# edit functions/.env — never commit this file
```

| Variable | Example |
|--------|---------|
| `R2_ACCOUNT_ID` | `a1b2c3...` |
| `R2_ACCESS_KEY_ID` | from API token |
| `R2_SECRET_ACCESS_KEY` | from API token |
| `R2_BUCKET_NAME` | `snapmate-media` |
| `R2_PUBLIC_BASE_URL` | `https://pub-xxxx.r2.dev` (no trailing slash) |

On `firebase deploy --only functions`, the CLI loads `functions/.env` into the function runtime as environment variables.

> **Blaze plan** is still required to **deploy Cloud Functions** (any env method). Upgrading enables pay-as-you-go; small MVP traffic often stays within free tiers. Secret Manager (`firebase functions:secrets:set`) is optional and not used in this repo.

Optional hardening later: switch to `defineSecret` + Secret Manager (same Blaze project).

Deploy:

```bash
npm run functions:deploy
```

Or deploy only storage callables:

```bash
firebase deploy --only functions:getR2UploadUrl,functions:deleteR2ObjectCallable
```

---

## 4. Expo app env

Add to `.env.local`:

```env
EXPO_PUBLIC_R2_PUBLIC_BASE_URL=https://pub-xxxxxxxx.r2.dev
```

Must match `R2_PUBLIC_BASE_URL` on Functions (same CDN base the app uses to display images).

Restart Metro after changing env.

---

## 5. CORS (if uploads fail from web)

R2 bucket → **CORS policy**:

```json
[
  {
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["PUT", "GET", "HEAD"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3600
  }
]
```

Tighten `AllowedOrigins` for production.

---

## 6. Legacy Firebase Storage URLs (optional)

Snapmate does not use Firebase Storage. If you have old `firebasestorage.googleapis.com` URLs in Firestore, re-upload or run a one-off migration script to R2.

---

## 7. Cost notes

- R2: low storage cost, **no egress fees** to the internet (vs Firebase/GCS)
- Firebase Functions: billed per presign call (small vs photo bytes)

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `Missing EXPO_PUBLIC_R2_PUBLIC_BASE_URL` | Set env and restart Expo |
| `permission-denied` on upload | User not in `groups/{id}.members` or wrong path |
| `unauthenticated` | Sign in before upload |
| Upload 403 from R2 | Check API token scope and bucket name |
| Upload OK in app but image 404 | Thumbnail only uploaded — redeploy Functions + app, run `npm run firebase:verify-upload`. Old photos need re-upload. |
| `full image missing (storagePath 404)` | Same as above: presigned PUT failed silently before fix; new uploads verify with HEAD |
| Callable not found | Deploy functions; region `asia-northeast3` |
