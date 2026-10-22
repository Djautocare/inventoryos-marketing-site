# InventoryOS public website

Marketing site for InventoryOS reseller stock tools, Business Manufacturing mode, and separate InventoryOS Retail shops. The existing GitHub / Cloudflare Pages deployment stays in place.

## Build and edit

`npm ci` then `npm run build` regenerates the pre-rendered `index.html`, `manufacturing.html`, `retail.html` and bundled `assets/marketing.js` / `assets/marketing.css`. Committed static output means an existing Pages deployment with no build command continues to work. Primary copy, pricing, links and the native FAQ content are in the HTML before JavaScript loads.

- `src/App.jsx`: page layout, sample product interfaces, tours and Retail shop price estimate.
- `src/data/content.js`: copy, plan prices, features and FAQs.
- `src/marketing.css`: responsive styling. The Manrope font is served locally.
- `src/components`: React Bits SpotlightCard and AnimatedContent, with the original licence. AnimatedContent was adapted to keep content visible before hydration.
- GSAP handles motion and ScrollTrigger. Lenis uses the same GSAP ticker on desktop with a fine pointer. Touch scrolling stays native and reduced-motion preferences disable those effects. Effects are cleaned up on unmount/media changes.
- `features.html`: the complete original marketing information, presented in the current paper/ink/purple design with topic links and audience-specific guide navigation. It keeps all original feature and pricing details; `assets/feature-guide.css` supplies its independent styling. A no-JavaScript fallback displays all three business panels.
- `privacy.html`, `terms.html`, `refunds.html`, `cookies.html`, `data-security.html`: public policy content. `assets/document-chrome.css`, `assets/pages.css` and `assets/pages.js` provide consistent document navigation and styling without loading React.
- After editing shared React header/footer fragments, run `node scripts/style-documents.mjs` after the build to refresh document chrome. This does not rewrite the policies' substantive content.
- `scripts/update-policy-content.py` records the one-time policy migration. Do not rerun it on the already-updated documents.

The redesign adds no analytics providers, advertising pixels, external font requests, account creation, payment handling or backend changes. The existing Cloudflare delivery injects its Web Analytics beacon, which is disclosed in the policies. The pre-rendered React root uses Cloudflare’s documented `email_off` markers so its public support address is not rewritten before hydration. Interactive previews use clearly labelled sample data. All login, signup and checkout-related links lead to the existing app.

## Verification

`npm test` checks preserved original text, topic destinations, local links and assets, public policy coverage, pricing and the static no-JavaScript render. Browser QA is performed on the Sites managed preview. To prepare it: `node scripts/prepare-preview.mjs`, then use the supported preview supervisor. The ignored `dist/` directory is for QA; it is not the source of truth.

## Policy review

Changes made on 22 October 2026 retain the existing policy topics and add:

- Separate Retail shop billing, unlimited tills/staff, independent subscription cancellation, optional receipt-email charges and accrued usage.
- The current receipt-email introduction (£2.99 / first 30 days), monthly sending bands and 25,000-send limit, verified against `retailReceiptEmails.js` in the current application.
- Manually activated Business trials, return to the previous plan and no automatic new subscription from the trial itself.
- Staff/loyalty/customer records, transactional receipts, support requests, local PWA records, CSV exports and permanent store deletion.
- Public-certificate setup for QZ printing, private-key separation, manual card confirmation and human review of manufacturing/automation.
- Separate marketing consent and service emails, locally hosted animations/fonts, consumer cancellation rights and non-excludable statutory rights.

The exact operating legal trader/company name and a public business/service address were not supplied. They have **not** been guessed from the account holder's name or home details. Add the verified operator identity/contact address to Terms and Privacy. Exact retention schedules, provider transfer arrangements and any required controller/processor agreement also need the operator's factual confirmation. This update does not assert that the service has been independently audited or that the documents are a complete legal compliance review.

Reference guidance consulted: [GOV.UK distance selling](https://www.gov.uk/online-and-distance-selling-for-businesses), [online selling](https://www.gov.uk/online-and-distance-selling-for-businesses/online-selling), [fair contracts](https://www.gov.uk/guidance/writing-a-fair-contract-for-customers), [ICO transparency](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/individual-rights/individual-rights/right-to-be-informed/), [email marketing](https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guide-to-pecr/electronic-and-telephone-marketing/) and [cookies/storage](https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guide-to-pecr/cookies-and-similar-technologies/). The planned new UK subscription-contract regime was not described as already in force; the government's April 2026 update anticipates spring 2027.
