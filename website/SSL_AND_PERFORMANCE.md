# First Milk Venture — website SSL, performance and security runbook

## Screenshot diagnosis (19 November 2026)
Render showed both `firstmilkventure.com` and `www.firstmilkventure.com` **verified**, but the root domain TLS certificate was still **pending**. The `www` certificate was already issued. Do **not** delete either domain or assume redirects bypass root-domain TLS.

## DNS / certificate checklist
1. In GoDaddy DNS, confirm `@ A 216.24.57.1` **if this is the target advised in Render's current configuration**; remove conflicting old `@` A records. If using an ALIAS/ANAME provider, follow the Render-provided equivalent instead.
2. `www CNAME` should resolve to the actual `<your-marketing-service>.onrender.com` shown in the Render dashboard. Never guess this hostname.
3. Remove obsolete `AAAA` records for the apex and `www` used for Render, as Render does not support IPv6 custom-domain routing in the cited docs.
4. If custom CAA records exist, permit **letsencrypt.org** and **pki.goog**; leave unrelated email authentication (MX, SPF, DKIM, DMARC) records intact.
5. Disable duplicate GoDaddy URL forwarding and remove conflicting parked-domain destinations.
6. Flush public DNS caches (Google Public DNS, Cloudflare), recheck exact DNS records, then use **Verify** in Render > Static Site > Settings > Custom Domains. Render automatically handles issuance and renewal.
7. Only after certificates are **Issued** for both hostnames, verify `https://firstmilkventure.com/` redirects securely to `https://www.firstmilkventure.com/`. If certificates remain pending after DNS has settled, contact Render Support and supply both names, timestamps and observed records.

Official documentation: https://render.com/docs/custom-domains and https://render.com/docs/configure-other-dns

## Performance
- Marketing pages are a **Render static site**: keep HTML, CSS, JS local; no JS framework and no third-party font or tracker required.
- CMS: render cached public copy immediately; revalidate in the background at entry and on a measured 3-minute cadence, not every minute.
- FMV AI: a 56px round launcher on the **marketing website only**. No chatbot request is sent until the visitor submits a question.
- Backend API: if using a **Render Free web service**, it can sleep after 15 minutes idle and may take around a minute to restart, regardless of static website optimizations. An always-on paid instance is the supported option for consistent cold-start-free API response.
- Use Chrome Lighthouse/PageSpeed Insights and Render request latency metrics for before-and-after measurements rather than assuming any site is maximally fast.

Official Free service documentation: https://render.com/docs/free

## Security
- Marketing chat sends only the supplied question to the approved `/public/assistant/chat` endpoint. Do not add client-side AI/API keys, admin auth or raw payment credentials.
- Keep the currently configured CSP allowlist and self-hosted scripts, validate site in both mobile and desktop browsers, and use visible accessible controls.
- Server must enforce rate limits, publish only approved knowledge and treat all prompts as untrusted.
- Configure response security headers on the **Render static site** as supported (CSP as an HTTP header, X-Content-Type-Options, frame protections and appropriate Referrer-Policy).
- **Do not enable irreversible HSTS preloading** while the root domain certificate is still pending. Confirm TLS across all critical subdomains first.
- Test independent site operations: both domain SSL certs, API availability, published content, FMV AI failover, sign-in links and careers page.
