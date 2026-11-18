# First Milk Venture — animated public website

This folder contains a self-hosted, responsive, lightweight company website to complement the existing **customer portal** at the repository root.

## Files
- `website/index.html` — semantic website with all major sections, social icons, contact form and customer portal calls to action
- `website/site.css` — branded design, responsive layouts and CSS transform/opacity animations with reduced-motion fallback
- `website/site.js` — mobile navigation, on-scroll reveals and email-draft contact flow
- `website/favicon.svg` — custom brand icon

There is **no third-party JavaScript, external font, image CDN, marketing tracker, npm dependency or server-side runtime** for the new website.

## Location / publication
The repository already publishes the original customer portal from the root with `CNAME = www.firstmilkventure.com`. These changes deliberately do **not** replace the root portal.

Once this branch is merged and the existing GitHub Pages deployment has completed, the intended website address is:

`https://www.firstmilkventure.com/website/`

The existing portal remains:

`https://www.firstmilkventure.com/`

Sign-in and sign-up call-to-action links route to `../?auth=signin` and `../?auth=signup`. The matching small change in `portal-core.js` selects the existing OTP-enabled form. Existing checkout, account permissions, database policies and payment paths have not been altered.

For an eventual public-homepage migration, use a **verified dedicated customer portal hostname** (such as `app.firstmilkventure.com`) or a subpath deployment, adjust the links, update API CORS allowed origins and DNS/host routing, and test end-to-end first. Do not move the website to `/` without arranging a separate reachable portal.

## Contact form
The form checks required fields and launches a composed email to `support@firstmilkventure.com`, a sender address seen in backend email routing. **It does not transmit a message in the background, save form fields, or prove delivery.** The visitor must press **Send** in their mail app. Confirm that the company's support mailbox is real and monitored before publishing or promising support.

A future in-site form submission requires a server endpoint with validation, rate limits, bot protection, moderation/abuse management and protected email credentials. Never put service API keys into a public website.

## Social icons
- Instagram handle supplied: `firstmilkventure`
- X handle supplied: `@firstmilkventur`
- Threads: assumed `@firstmilkventure` **(confirm)**
- Facebook / LinkedIn: **search links** until the direct, verified business page URLs are supplied

Search links avoid sending customers to an invented or unrelated business page. Update these anchors after confirming ownership.

## Security and performance notes
- New website is a static asset set; no authenticated operations, secrets, sensitive records or user session data are handled by it.
- HTTPS-only CSP upgrade directive, self-hosted JS/CSS, no remote connections and an explicit CSP block object/embed/script injection from third parties. Its HTML CSP is defense-in-depth, not a substitute for the **real** security response headers.
- At the hosting/CDN level add security response headers including HSTS and `frame-ancestors 'none'`, a thoroughly tested CSP sent as an HTTP response header, `X-Content-Type-Options: nosniff`, and a suitable referrer policy. Note: GitHub Pages custom header support is limited; configure at a suitable CDN/proxy if needed.
- Animate only low-cost transform/opacity; honor `prefers-reduced-motion`; no continuous JavaScript polling or analytics.
- Responsive layout, semantic sections, accessible link labels, visible keyboard outlines, no dependency on a JavaScript framework.
- This does not establish that the live site or existing backend is invulnerable or has a measured latency target. Run production security, accessibility and performance audits (including load tests and real-mobile checks) before making such a claim.

## Pre-launch checks
1. Verify actual availability of the company social profiles, replace three provisional targets, and confirm `support@firstmilkventure.com` is monitored.
2. Review desktop/mobile layout, keyboard focus, device font scaling and reduced-motion behavior.
3. Test login, sign-up, OTP confirmation, customer session restoration and checkout against the deployed backend.
4. Confirm DNS, TLS and domain paths, then run Lighthouse and an authenticated production security check.
5. Do not add real-time polling or public write endpoints to the marketing page without a concrete performance/security need.
