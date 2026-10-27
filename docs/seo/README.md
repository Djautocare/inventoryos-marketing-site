# InventoryOS search optimisation

Implemented 24 October 2026. Public marketing and Shop only; the private backend and payment rules are unchanged.

## Audit findings and changes

- The initial Shop HTML listed only the printer. Other product links redirected to a shared JavaScript-only template, and the sitemap listed only one product. The build now creates 28 product-information pages (covering the supplied illustration families and related products), each with a unique title, description, H1, readable copy, option examples, image, canonical URL and breadcrumb/Product structured data. The Shop links to every family in its initial HTML.
- Canonical URLs now match the site's clean public addresses. The sitemap is generated from the same URL source and contains 38 canonical pages plus 28 product image entries. It excludes carts, filters, aliases and query strings. A real 404 document prevents unknown static paths becoming copies of the home page.
- Reseller, manufacturing and Retail page titles and headings identify the software. Existing features, pricing and legal content remain. Open Graph and Twitter metadata use a raster social preview. Manufacturing structured data advertises the Business offer required for that functionality.
- The initial marketing bundle fell from 420,647 to 282,959 bytes (33%). Gzip size fell from 138,973 to 87,351 bytes (37%), excluding a shared helper of under 1 KB. GSAP/Lenis are deferred desktop enhancements; phones and reduced-motion/data-saver users do not load them. Visible hero content is never hidden again for an entrance animation. Product grid images are lazy-loaded, and hashed marketing assets have immutable caching.

These are build measurements and local browser checks, not a claimed Lighthouse score or field Core Web Vitals result. Google ranking and rich-result placement are not guaranteed.

## Current product data and publication

`assets/shop-listings.json` contains only customer-facing information. It has no supplier URLs, costs, stock counts, payment keys or admin details. Product information can be read while the live catalogue is unavailable. Prepared listings have no purchasing controls until the existing backend supplies published options. Prices, minimum quantities, availability and checkout remain authoritative on the backend. Static product structured data deliberately has no guessed Offer, stock, review or rating; live Offer data is added only from a successful current catalogue response. Supplier-dependent products must still be approved and published in Shop Admin before purchase.

The public catalogue could not be retrieved from the audit environment (HTTP 403); this is not evidence of a general site outage or that Google is blocked. The public API requires the marketing site's Origin header, and the audit environment also restricted direct requests. Confirm real customer access in your own browser and use Search Console URL Inspection after ownership verification.

When adding a new family, add its public copy to `assets/shop-listings.json`, retain its backend product ID and rebuild. Existing unknown/custom product IDs retain the generic live template, which is noindex to avoid indexing empty placeholders. Never add supplier costs or unsupported compatibility claims to the public file.

## Publishing

The live Cloudflare project currently publishes committed assets without running the source build. Run `npm run build` and commit the generated public HTML, CSS, JavaScript chunks, sitemap and redirects alongside source changes. Shop documents reference the existing public seller configuration at runtime in a compact footer instead of duplicating the configured address into each HTML file; full contact details remain accessible through the existing terms page without JavaScript. Existing policy documents remain published. Setting the Cloudflare build command to `npm run build` later will automate generated output updates and the prepared policy-head improvements.

## Finish Google Search Console

On 24 October 2026, the existing Domain property `inventoryos.co.uk` was confirmed accessible and verified. Google accepted `https://inventoryos.co.uk/sitemap.xml` with **Success**, discovering **38 pages**. Its historical indexing report (last updated 15 October) showed 9 indexed pages and 31 duplicate URLs without a user-selected canonical. These are historical counts, not results of the new deployment.

A representative new product failed Google's live test with **Redirect error**. Product proxy destinations were corrected to extensionless content routes, removing reciprocal internal-alias redirects so Cloudflare HTML normalization cannot cycle back into the public proxy. The source build and regression test retain this correction.

The following steps remain useful for future ownership changes and monitoring:

1. Sign in at https://search.google.com/search-console/ with the Google account that should own InventoryOS. If `inventoryos.co.uk` is already verified, select it and skip the verification step.
2. Otherwise add a **Domain** property for `inventoryos.co.uk` and publish Google's exact TXT verification record in Cloudflare DNS. This covers all protocols and subdomains. Alternatively add a **URL-prefix** property for `https://inventoryos.co.uk/` and select **HTML tag** verification.
3. For HTML-tag verification, copy only the tag's `content` token into `googleSiteVerification` in `seo.config.json` and redeploy, or provide `GOOGLE_SITE_VERIFICATION` as a frontend build environment variable. This is a public ownership token, not a password/API key. The build safely inserts the tag on public pages. Do not put it in the PC backend's `.env`.
4. Click **Verify** in Search Console. Do not report verification as complete until Google confirms it.
5. In **Sitemaps**, submit `https://inventoryos.co.uk/sitemap.xml`. Confirm that Google reports **Success** and review discovered URLs.
6. Inspect the home page, Shop and representative product URLs with **Test live URL**. Check the fetched HTML, canonical, mobile rendering and Product enhancements; request indexing only for the key pages.
7. Review indexing and Core Web Vitals after Google has collected data. Compare organic queries/clicks over time, rather than expecting an immediate ranking change.

## Validation

Run `npm run build`, then `npm test`. Tests check all product pages, unique copy/canonical URLs, sitemap membership, JSON-LD safety, preservation of original content, separate size/colour selections, quantity rules and the initial JavaScript budget. Local desktop/mobile browser checks cover no-JavaScript product content, navigation/theme controls, live-only offer markup, variant deep links and exact basket variant IDs. No real messages or payments were sent.

References:

- https://developers.google.com/search/docs/specialty/ecommerce/designing-a-url-structure-for-ecommerce-sites
- https://developers.google.com/search/docs/appearance/structured-data/product
- https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
- https://web.dev/articles/vitals
- https://developers.cloudflare.com/pages/configuration/redirects/

## 27 October: guides, label preparation and merchant markup

- Added `/guides` and four original practical articles covering batch shipping-label preparation, reseller storage, small-batch material calculations and retail case/reorder quantities. They contain complete static content, unique metadata, canonical URLs, article/breadcrumb markup and links to the relevant workflows. Dates record the actual publication date. Articles do not load React, GSAP or Lenis.
- Added `/shipping-label-cropping`, linked from the main reseller page, shared footer and guide hub. It explains the repeated opening/cropping/saving steps, supported 4×6 workflow, batch review and mobile/desktop routes. Starter upload/cropping and Pro/Business email/direct-printing access are distinguished. The calculator measures a user's entered manual preparation workload; it does not claim measured product savings.
- Shared navigation and relevant landing-page links make the guides discoverable. The generated sitemap now contains 45 canonical pages, including the six new content pages. Policy text and the original complete feature guide are preserved.
- Added a shared public merchant-schema helper. Successful live catalogue responses supply configured Standard/Express delivery maximums to Offer markup, and the same live rates/restrictions are displayed on the product. Maximums allow for eligible free-delivery baskets without inventing a per-product free-delivery promise. No rates are inferred when settings are missing, invalid or mainland-only; exact regional exclusions need Merchant Center/Search Console delivery-region settings. Checkout remains authoritative.
- Product seller markup points to the organization's published return policy. Google explicitly supports `merchantReturnLink` as its organization-level Option B. This preserves the actual policy (14 days to notify cancellation, then a further 14 days to send goods back) rather than inventing one delivery-to-return deadline. It is not an offer-level override with an incomplete finite return window. Google may still show an offer-field recommendation while it recrawls or if its reporting does not resolve the organization policy.
- Static Product markup includes the known JADENS and Jiffy brands. Generic packaging does not get a fabricated brand, GTIN or MPN. Variant SKUs remain SKUs, not global identifiers. Product review/rating recommendations remain until genuine, visible product reviews exist; eBay seller feedback is not imported as product ratings.

### Check in Search Console

1. Inspect the new cropping URL and one guide, then request indexing for those key pages. The existing sitemap URL is unchanged; Google can fetch the updated contents.
2. Test a published purchasable product with Google's Rich Results Test and inspect its rendered HTML. Live Offer data depends on a successful public catalogue response; it is deliberately not hardcoded into static pages.
3. In Merchant listings, request validation for the relevant changes after the deployed pages are visible. Organization policy links and genuine missing identifiers/reviews do not guarantee every optional warning disappears.
4. Compare the latest 28 days with the previous 28 in Performance, looking at non-branded queries, landing pages, clicks and impressions. Compare signup outcomes with your own account records. A daily signup increase alone does not establish the traffic source or prove which change caused it.

Validation includes the existing 33 tests plus five content/schema/calculator checks; browser checks at 375, 1024 and 1440 px for navigation, themes, no horizontal overflow and calculator output; no-JavaScript article content; and a synthetic live-catalogue check for Offer delivery data, seller-policy references and matching visible prices. No live checkout, payment or message was sent.

References:
- https://developers.google.com/search/docs/fundamentals/creating-helpful-content
- https://developers.google.com/search/docs/crawling-indexing/links-crawlable
- https://developers.google.com/search/docs/appearance/structured-data/merchant-listing
- https://developers.google.com/search/docs/appearance/structured-data/return-policy
