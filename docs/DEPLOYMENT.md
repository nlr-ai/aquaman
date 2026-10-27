# Cloudflare Pages deployment

The frontend is static. Supabase provides Auth, reporting RPCs and photo storage independently of Cloudflare. Production builds do not initialize the localhost SQLite API.

## Git integration

Connect the GitHub repository `nlr-ai/aquaman` to a Cloudflare Pages project with:

| Setting | Value |
| --- | --- |
| Production branch | `main` |
| Build command | `npm run build` |
| Build output | `dist` |
| Node version | `24` (also set in `.node-version`) |

Set these build variables in Cloudflare for production and any previews that should use the demo backend:

```env
VITE_DATA_BACKEND=supabase
VITE_SUPABASE_URL=https://ffrtgkzllqwlkbnzisdh.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_PROJECT_PUBLISHABLE_KEY
```

The publishable key may be in the browser build. Do not configure `SUPABASE_ACCESS_TOKEN`, service-role keys or other administrator credentials in Cloudflare frontend build variables. Local environment files are ignored by Git.

## Direct upload alternative

Once Wrangler is authenticated with a Cloudflare account, build locally with the public Supabase settings and upload `dist/`:

```sh
npm run build
npx wrangler pages deploy dist --project-name aquaman --branch main
```

A direct-upload project does not automatically acquire GitHub builds. Choose Git integration at project creation if automatic deployment on push is required. Check Cloudflare's current project creation options before switching modes.

## Auth redirects

After obtaining the actual production URL, add that exact URL to Supabase Auth's redirect allowlist and set the Auth Site URL if this is the canonical deployment. Keep any localhost redirects still in use. Do not allow arbitrary preview subdomains unless intentionally needed. The app sends password-reset links back to its current origin; check password setup on the production host separately.

## Release verification

- Confirm the deployed page and its JavaScript/CSS/fonts load over HTTPS.
- Confirm the header identifies Supabase, and published reports load without an error.
- Test area selection, map and a report status lookup.
- Check the deployed static files contain no administrator token.
- Confirm password-reset redirects use the actual production domain.
- Record the final URL and deployment ID after a successful deployment; configuration alone is not a deployment.
