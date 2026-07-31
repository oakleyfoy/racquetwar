# Certified Tournament Director application

The public application form lives at `/tournament-director`, with a
password-protected review area at `/tournament-director/admin`.

## Routes

| Route | Purpose |
| --- | --- |
| `/tournament-director` | Public application form |
| `/tournament-director/api/submit` | Form submission endpoint |
| `/tournament-director/admin` | Application list, filters, CSV export |
| `/tournament-director/admin/[id]` | Full application, status and internal notes |
| `/tournament-director/admin/login` | Admin sign in |
| `/tournament-director/api/admin/export` | CSV download |

## Key files

- `lib/ctd/fields.ts` — every option list and type. The form, validation,
  database, email and CSV all read from here, so wording is changed in one place.
- `lib/ctd/validate.ts` — server-side normalisation and required-field checks.
- `lib/ctd/db.ts` — Postgres pool and the idempotent schema bootstrap.
- `lib/ctd/applications.ts` — insert, list, filter, update and CSV generation.
- `lib/ctd/report.ts` — the shared field-by-field view used by the notification
  email and the admin detail page.
- `lib/ctd/mail.ts` — Microsoft Graph sender with an SMTP fallback.
- `components/ctd/ctd-application-form.tsx` — the form and its conditional logic.
- `app/tournament-director/ctd.css` — scoped styling for the whole route.
- `proxy.ts` — protects every admin route and admin API route.

## What happens on submit

1. The honeypot field and a per-IP rate limit reject obvious bots.
2. The payload is re-validated on the server against the canonical option lists;
   nothing the browser sends is trusted.
3. reCAPTCHA v3 is verified. In production a missing secret is a hard failure.
4. The application is written to Postgres. The table is created automatically on
   first use, so there is no migration step.
5. A notification email goes to the team and an auto-reply goes to the applicant.

If the database write fails but the email succeeds (or vice versa) the applicant
still sees a success message, because the application has been captured. Only a
failure of both paths returns an error.

## Local development

```bash
npm install
cp .env.example .env.local   # then fill in the values you need
npm run dev
```

With no `DATABASE_URL` and no mail credentials, submissions are logged to the
server console so the form can be worked on without any external services.
reCAPTCHA is skipped locally when `RECAPTCHA_SECRET_KEY` is unset.

To exercise the database and admin area locally:

```bash
docker run -d --name ctd-pg -e POSTGRES_PASSWORD=test -e POSTGRES_DB=ctd -p 55439:5432 postgres:16-alpine
```

Then set in `.env.local`:

```
DATABASE_URL=postgresql://postgres:test@localhost:55439/ctd
ADMIN_PASSWORD=some-local-password
ADMIN_SESSION_SECRET=some-local-secret
```

Note that the admin session cookie is marked `Secure` in production builds, so
sign-in only works over HTTPS or via `npm run dev` on localhost.

## Environment variables

See `.env.example` for the annotated list. The ones that matter most:

- `DATABASE_URL` — Render provides this automatically via `render.yaml`.
- `MAIL_FROM_EMAIL` / `CTD_TO_EMAIL` — sending mailbox and destination inbox. New
  applications go to `oakley@wargroupllc.com`. The sending mailbox must exist in
  the Microsoft tenant below, because Graph sends as that mailbox.
- `MICROSOFT_TENANT_ID` / `MICROSOFT_CLIENT_ID` / `MICROSOFT_CLIENT_SECRET` —
  the same Graph app-registration pattern used by the Elite and Premier sites.
  Requires the `Mail.Send` application permission.
- `SMTP_*` — optional fallback, used only when the Microsoft values are absent.
- `RECAPTCHA_SITE_KEY` / `RECAPTCHA_SECRET_KEY` — reCAPTCHA v3 keys.
- `ADMIN_PASSWORD` — required to open the admin area.
- `ADMIN_SESSION_SECRET` — signs the admin session cookie and salts stored IP
  hashes. Falls back to `ADMIN_PASSWORD`, but a separate value is better.
- `ALLOW_SEARCH_INDEXING` — see the search indexing note below.

## Deploying to Render

`render.yaml` describes a web service plus a Postgres instance. The free
database plan is deleted after 30 days, so it uses a paid plan; the free web
service plan idles and cold-starts too slowly for a form linked from the live
site, so it uses `starter`.

After the first deploy, set the secret values (mail, reCAPTCHA, admin password)
in the Render dashboard.

## Pointing racquetwar.com at the form

While WordPress still serves the main site, use a Cloudflare rule to proxy the
form path to Render rather than moving DNS:

- Proxy `racquetwar.com/tournament-director*` to the Render service.
- Also proxy `racquetwar.com/_next/*`, otherwise the JavaScript, CSS and images
  the page depends on will 404.

Link to `https://racquetwar.com/tournament-director` from WordPress.

## Search indexing

`app/robots.ts` blocks all crawling unless `ALLOW_SEARCH_INDEXING=true`. This
keeps the raw Render hostname out of search results while WordPress owns the
domain.

When this app eventually serves the whole of racquetwar.com, set
`ALLOW_SEARCH_INDEXING=true`. If that is missed, the entire site will stay out
of search results.

Note that `/robots.txt` is not proxied by the Cloudflare rule above, so it only
affects the Render hostname and never overrides the live WordPress robots.txt.

## Adding a second application form later

The `ctd_applications` table has a `program` column, and queries filter on
`PROGRAM_SLUG`. A future franchise application can reuse the same table,
mailer and admin views by adding a new slug.
