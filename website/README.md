# First Milk Venture — animated public website

This folder contains a self-hosted, responsive, lightweight company website to complement the existing **customer portal** at the repository root.

## Files
- `website/index.html` — semantic website with all major sections, social icons, contact form and customer portal calls to action
- `website/site.css` — branded design, responsive layouts and CSS transform/opacity animations with reduced-motion fallback
- `website/site.js` — mobile navigation, on-scroll reveals and email-draft contact flow
- `website/favicon.svg` — custom brand icon

There is **no third-party JavaScript, external font, image CDN, marketing tracker, npm dependency or server-side runtime** for the new website.

## Domain / deployment plan (not yet active)

Desired final routing:

| Domain | Purpose | Suggested hosting |
| --- | --- | --- |
| `https://firstmilkventure.com/` | Company marketing website | Render Static Site (publish directory `website`) |
| `https://www.firstmilkventure.com/` | Same company website | Same Render Static Site, canonical www |
| `https://www.firstmilkventure.com/careers.html` | Careers contact | Same marketing website |
| `https://customer.firstmilkventure.com/` | Existing customer portal (without removing files) | Existing GitHub Pages repository, with custom-domain cutover |
| `https://backend.firstmilkventure.com/` | Existing API and authentication | Existing backend deployment |

The new marketing site is maintained in `website/` and built to be served from the **root** of its own static hosting service; `index.html` must be the home page. Do not publish the marketing folder under the old portal's GitHub Pages root as the final configuration.

**Staging warning:** Until DNS and the customer portal's custom-domain switch are completed, the marketing site's customer call-to-action links deliberately point to a not-yet-confirmed subdomain. Do not merge/publish the marketing links as a completed release prematurely.

### Recommended controlled rollout

1. Create a **Render Static Site** connected to `raseenup/firstmilk-customer`, main branch, with build command `echo "Static website; no build required"` and publish directory `website`. Test on its Render-assigned onrender.com URL first. A Render workspace must be selected by its owner.
2. Deploy the backend exact-origin CORS change from `raseenup/dairy-backend` PR #12. If the backend host has an `ALLOWED_ORIGINS` environment variable, add `https://customer.firstmilkventure.com` explicitly and retain existing origins. Do not use `*`.
3. Set up `customer.firstmilkventure.com` DNS pointing to the GitHub Pages host using GitHub's own displayed instructions, and check domain takeover safeguards, SSL and authoritative DNS.
4. Arrange the coordinated customer Pages domain change through draft PR #11 (CNAME) while routing `firstmilkventure.com` and `www.firstmilkventure.com` to the Render marketing site. **Do not merge PR #11 until cutover is coordinated:** it releases the old `www` Pages domain.
5. Once both hosts have valid HTTPS, test customer sign-up, sign-in, OTP, session restore, ordering, checkout and the career mailto composer. Confirm both root/www lead to the same marketing website and search engines have a single canonical www URL.
6. If possible perform the cutover at a low-traffic time; cached DNS and certificate provisioning may take time. Preserve a rollback plan, and do not promise uninterrupted access without staging validation.

**DNS values:** Copy exact CNAME/A/ALIAS records from the Render and GitHub Pages domain-setup screens. Do not reuse an old `www` GitHub Pages CNAME for the marketing site. No DNS or custom-domain changes are made by these source files alone.

Sign-in/sign-up CTAs point to `https://customer.firstmilkventure.com/?auth=signin` and `?auth=signup`. The paired `portal-core.js` change selects the existing OTP-enabled auth form when the customer portal receives these links. Existing account, payment, subscriptions and backend schemas are not replaced.

## Contact form
The form checks required fields and launches a composed email to `support@firstmilkventure.com`, a sender address seen in backend email routing. **It does not transmit a message in the background, save form fields, or prove delivery.** The visitor must press **Send** in their mail app. Confirm that the company's support mailbox is real and monitored before publishing or promising support.

A future in-site form submission requires a server endpoint with validation, rate limits, bot protection, moderation/abuse management and protected email credentials. Never put service API keys into a public website.

## Social icons
- Instagram handle supplied: `firstmilkventure`
- X handle supplied: `@firstmilkventur`
- Threads: assumed `@firstmilkventure` **(confirm)**
- Facebook / LinkedIn: **search links only** until the company-owner shares and verifies the exact page URLs displayed in the LinkedIn and Facebook applications. A screenshot showing the company name is not enough to determine a URL.

Search links avoid sending customers to an invented or unrelated business page. Update these anchors after confirming ownership.

## Security and performance notes
- New website is a static asset set; no authenticated operations, secrets, sensitive records or user session data are handled by it.
- HTTPS-only CSP upgrade directive, self-hosted JS/CSS, no remote connections and an explicit CSP block object/embed/script injection from third parties. Its HTML CSP is defense-in-depth, not a substitute for the **real** security response headers.
- At the hosting/CDN level add security response headers including HSTS and `frame-ancestors 'none'`, a thoroughly tested CSP sent as an HTTP response header, `X-Content-Type-Options: nosniff`, and a suitable referrer policy. Note: GitHub Pages custom header support is limited; configure at a suitable CDN/proxy if needed.
- Animate only low-cost transform/opacity; honor `prefers-reduced-motion`; no continuous JavaScript polling or analytics.
- Responsive layout, semantic sections, accessible link labels, visible keyboard outlines, no dependency on a JavaScript framework.
- This does not establish that the live site or existing backend is invulnerable or has a measured latency target. Run production security, accessibility and performance audits (including load tests and real-mobile checks) before making such a claim.

## Careers page
- `website/careers.html` contains a general careers enquiry form that composes an email to `support@firstmilkventure.com`. It is **not** a vacancy board, does not collect personal data server-side, cannot automatically attach a resume and does not promise a response. Applicants must attach their CV in their mail app if desired. Verify the support mailbox is monitored.\n\n## Pre-launch checks
1. Verify actual availability of the company social profiles, replace three provisional targets, and confirm `support@firstmilkventure.com` is monitored.
2. Review desktop/mobile layout, keyboard focus, device font scaling and reduced-motion behavior.
3. Test login, sign-up, OTP confirmation, customer session restoration and checkout against the deployed backend.
4. Confirm DNS, TLS and domain paths, then run Lighthouse and an authenticated production security check.
5. Do not add real-time polling or public write endpoints to the marketing page without a concrete performance/security need.
