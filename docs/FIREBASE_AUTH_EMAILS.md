# Firebase auth emails & action handler

Storvv handles email verification and password reset inside the app at **`/auth/action`**, styled with the same auth shell as sign-in. Firebase still delivers the emails, but links should point to your app domain instead of the default `firebaseapp.com` page.

## One-time Firebase Console setup

### 1. Public-facing name

**Project settings → General → Public-facing name** → set to **`Storvv`**

This replaces `project-1038005888848` in email copy (`%APP_NAME%`).

### 2. Authorized domains

**Authentication → Settings → Authorized domains**

Ensure these are listed:

- `app.storvv.com` (production)
- `localhost` (local dev)
- Any preview/staging host you use

### 3. Custom action URL


**Authentication → Templates** (gear icon) → **Customize action URL**

Production:

```text
https://app.storvv.com/auth/action
```

For local testing, temporarily set:

```text
http://localhost:3000/auth/action
```

Firebase allows one action URL per project - switch it when testing locally, then set it back for production.

### 4. Email templates

Open each template, set the subject, and paste HTML into the **message body**.

**Hide the long URL:** use `%LINK%` only inside `href="..."`. The visible text should be **click here** or a button label - never paste `%LINK%` as plain text on its own line (that is what causes the ugly raw URL in Gmail).

Minimal copy-paste (recommended to start):

| Template | File | Suggested subject |
|----------|------|-------------------|
| Email address verification | [email-verification-simple.html](./firebase-email-templates/email-verification-simple.html) | `Verify your Storvv email address` |
| Password reset | [password-reset-simple.html](./firebase-email-templates/password-reset-simple.html) | `Reset your Storvv password` |

Full branded layout (button + header):

| Template | File |
|----------|------|
| Email address verification | [email-verification.html](./firebase-email-templates/email-verification.html) |
| Password reset | [password-reset.html](./firebase-email-templates/password-reset.html) |

Example snippet for verification (paste in Firebase template editor):

```html
<p>Hello,</p>
<p>
  Please <a href="%LINK%">click here</a> to verify your email for %APP_NAME%.
</p>
<p>If you did not request this, you can ignore this email.</p>
<p>Thanks,<br />The %APP_NAME% team</p>
```

Firebase placeholders:

- `%LINK%` - secure action URL (**href only**, not visible text)
- `%EMAIL%` - recipient email
- `%APP_NAME%` - public-facing project name

Paste into the template editor and save. Request a **new** email to see the change.

### 5. Sender name (optional, reduces spam flags)

**Authentication → Templates → Sender name** → `Storvv`

For a custom **from** address (`noreply@storvv.com`), configure Firebase/Google Cloud email domain authentication (SPF/DKIM). Until then, messages may come from `noreply@<project-id>.firebaseapp.com`.

## How the app handles links

1. User clicks `%LINK%` → opens `https://app.storvv.com/auth/action?mode=…&oobCode=…`
2. [`pages/auth/action.vue`](../pages/auth/action.vue) runs the Firebase action:
 - `verifyEmail` → confirms address, then sends user to sign-in
 - `resetPassword` → shows new-password form, then sign-in
3. Outbound emails use in-app handling via [`utils/firebase-auth-action.ts`](../utils/firebase-auth-action.ts) (`handleCodeInApp: true`).

Legacy links that land on `/signin?mode=…` are redirected to `/auth/action` automatically.

## Environment

Set in `.env` / Vercel:

```env
NUXT_PUBLIC_APP_ORIGIN=https://app.storvv.com
NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN=storv-ux.firebaseapp.com
```

`NUXT_PUBLIC_APP_ORIGIN` is used when building action/continue URLs on the server or when the browser origin is unavailable.

## Verify end-to-end

1. Sign up or use **Resend verification** on `/dashboard/verify-email`
2. Confirm the email uses the Storvv template and links to `app.storvv.com/auth/action`
3. Complete verification - you should see the Storvv auth shell, not the Firebase default page
4. Repeat with **Forgot password** → set a new password on `/auth/action`

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Link still opens `firebaseapp.com` | Update **Customize action URL** in Firebase Console; request a **new** email |
| `auth/invalid-continue-uri` | Add your domain under **Authorized domains** |
| Raw URL shown in email body | Edit Firebase template: replace standalone `%LINK%` with `<a href="%LINK%">click here</a>` |
| Email in spam | Mark as not spam; add custom domain + SPF/DKIM; avoid raw URL-only templates |
| White Firebase page (“Your email has been verified” + blue CONTINUE) | Set **Customize action URL** to `https://app.storvv.com/auth/action` and request a **new** email - old links still hit Firebase’s hosted page |
| Expired link | Request a fresh verification or reset email |
