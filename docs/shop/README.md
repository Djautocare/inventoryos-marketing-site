# InventoryOS Shop

The public catalogue is linked from all marketing headers/footers, the three audience landing pages and Account Settings in the application. It uses the existing marketing appearance preference. There is one product: the JADENS 668BT at GBP 58.99 including UK delivery via Royal Mail.

## Current release state

**Live ordering is enabled.** The owner reports the live backend check passed after adding live settings and restarting InventoryOS Backend. The three colour checkouts are active. Product photos and product-specific details were imported from the owner-supplied eBay listing https://www.ebay.co.uk/itm/377228291527 on 23 October 2026. The original nine images are hosted locally; eBay checkout, buyer-protection text, seller feedback, fluctuating stock counts and eBay returns terms are not copied into the shop. The owner has confirmed black, white and pink are available, with dispatch within 1–3 days and delivery estimated at around 48 hours after dispatch.

The separate InventoryOS sandbox has a one-off payment link tagged `inventoryos_area=shop`, `inventoryos_shop_sku=jadens-668bt`. The link charges GBP 58.99, collects a GB shipping address, has quantity fixed at one and clearly states no goods are dispatched for a test. Stripe invoice creation is disabled for new Shop tests; the backend generates InventoryOS invoice PDFs. It does not use subscription prices. The owner reports a successful sandbox test. Development tools have not submitted payments. The separate live objects prepared below do not change existing subscriptions.

## Order management and backend installation

The application has an admin-only **Shop orders** tab with separate Live and Sandbox filters, customer/delivery details, payment state, invoice access, status, Royal Mail tracking, private notes and email status/history. The backend is supplied privately as `InventoryOS-shop-orders-update.zip`, with the tested PostgreSQL schema, installer and Windows setup instructions. The download contains only the installable files; backend source is not published in this marketing repository. It must be installed on the owner's PC before the admin tab can load orders.

Signed webhooks retrieve authoritative Stripe sessions and import paid orders once. The Resend queue sends a high-contrast confirmation with a saved InventoryOS invoice PDF attached (new live numbering starts IOS-10001), then sends status/tracking updates. Sandbox messages are routed to an explicitly configured owner test inbox. Internal notes are excluded. No customer emails have been sent during development. Existing genuine Stripe invoices are retained. Existing subscriptions and global Stripe receipt settings are unchanged.

## Live checkout preparation — 23 October 2026

Live one-time colour checkouts are all GBP 58.99 with free UK shipping:

| Colour | Product | Price | Payment link |
| --- | --- | --- | --- |
| Black | `inventoryos_shop_jadens_668bt_v1` | `price_1UTme0C9bSpYsWkxUePLsRKK` | `plink_1UTmeJC9bSpYsWkxmzonGwoP` |
| White | `inventoryos_shop_jadens_668bt_white_v1` | `price_1UTmnbC9bSpYsWkxk8hRpwhW` | `plink_1UTmniC9bSpYsWkxJzJsNxix` |
| Pink | `inventoryos_shop_jadens_668bt_pink_v1` | `price_1UTmo3C9bSpYsWkxLiWwd6Uj` | `plink_1UTmoAC9bSpYsWkxruhvQ1Fr` |

The colour is part of the Stripe product name, so the existing backend records it on the order and invoice without a backend upgrade. Checkout selection has a non-JavaScript fallback. Development tools have not submitted a live payment. All three colour links are active, and the public Shop renders the colour selector and corresponding purchase link. The owner explicitly approved publishing the supplied seller identity and business/returns address to this public repository and the Shop. Those details now appear on the Shop and policy pages. The hardware terms, returns and privacy sections have been added. The owner has completed private backend configuration and reports a passing live check. A successful live signed-webhook delivery and customer email should be checked on the first genuine order; development tools have not independently observed a live transaction.

The dedicated live webhook is `we_1UTmefC9bSpYsWkxTtVy7oZQ` at `https://api.inventoryos.co.uk/shop/webhook`, using API version `2026-08-26.dahlia`. It listens for `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed` and `invoice.paid`. Retrieve this destination's signing secret privately in Stripe; it is not stored in this repository.

On the backend PC, add the following settings alongside the existing sandbox settings. Copy actual secret values privately, never into frontend code or this repository:

```dotenv
SHOP_STRIPE_SECRET_KEY=your_live_shop_api_key
SHOP_STRIPE_PAYMENT_LINK_IDS=plink_1UTmeJC9bSpYsWkxmzonGwoP,plink_1UTmniC9bSpYsWkxJzJsNxix,plink_1UTmoAC9bSpYsWkxruhvQ1Fr
SHOP_STRIPE_WEBHOOK_SECRET=the_live_shop_destination_signing_secret
SHOP_SELLER_NAME=your_public_legal_seller_name
SHOP_SELLER_ADDRESS=your_public_business_address
SHOP_INVOICE_STYLE=minimal
```

Do not overwrite sandbox settings, Retail billing settings or existing subscription settings. The live Shop API key must belong to the live InventoryOS account, and its webhook signing secret must come from the new live Shop destination. A restricted API key must permit the Checkout session, Payment Link, price/product and legacy invoice reads used by the backend.

Activate all three live payment links only when the backend settings are in place, run `node .\check-shop.cjs --live`, then restart InventoryOS Backend. Only publish the enabled Buy now button once that check passes. The check does not take payment or send email; a successful sandbox test does not verify the live key or live webhook secret.

## Operational checks

- The owner reports a passing `node .\check-shop.cjs --live` after live configuration and backend restart.
- A live buyer can choose black, white or pink, each at GBP 58.99 with free UK shipping. Stripe collects the billing and GB delivery address. New Shop invoices are generated by InventoryOS; Stripe post-payment invoice creation is disabled.
- Monitor the first genuine order for a successful signed delivery to the Shop webhook, an entry under Admin → Shop orders → Live, and a confirmation email with the invoice attached. An enabled webhook destination is not proof of successful delivery.
- Keep sandbox and live credentials separate. Never fulfil from a browser return page, and keep the backend and Cloudflare Tunnel running to process orders and email.
- To pause new website purchases, set `checkoutEnabled` to `false` and rebuild. To prevent checkout through previously shared links too, deactivate all three Payment Links in Stripe.

## Development

`npm run build` creates the three audience pages and `shop.html`. `node scripts/style-documents.mjs` updates shared document navigation. `npm test` checks existing content plus catalogue price, photo availability and checkout safeguards. Product copy is escaped into static HTML and works without JavaScript; the small shop script changes gallery photos only. It does not collect card or address data.

Browser QA covered the gallery, specifications, light/dark appearances, account-settings entry, and 390px/320px shop layouts with no document overflow. The sandbox checkout was opened to verify its price, test branding and UK delivery-address collection. The preview image is a catalogue preview, not an operational live checkout.

## Checkout agreement and optional email updates

All three live colour Payment Links require agreement to InventoryOS Terms & Conditions. The sandbox link also requires terms agreement. Marketing consent is separate and is never bundled into that required agreement. Stripe does not support its native promotions checkbox for this UK account.

The Shop's optional checkbox is implemented behind `marketingEnabled` in the catalogue. It is enabled with a backend readiness check: the checkbox stays hidden until the private updated Shop backend package is installed, checked and restarted. No new .env values are needed. Opted-in buyers enter an email before checkout; a random reference and that email are passed to Stripe. Only a paid, signed-webhook order using the same email activates the consent. Unchecked choices, failed/unpaid orders, stale references and different emails do not subscribe anybody. A choice alone sends no marketing emails.

Guest contacts are available in Admin → Mailing List → Shop customers. Existing accounts also use their normal marketing preferences. A later removal must not be overwritten by an old payment retry. Sandbox choices stay outside the live list.

## Product grid, product URLs and cart

The Shop now renders a product grid, category/search filters, sorting by price or name and a cart drawer. The printer detail is at `/shop/product/jadens-668bt`; other product URLs use `/shop/product/<product-id>`. Cloudflare Pages `_redirects` serves the shared product template for new catalogue items. The existing printer offer has a pre-rendered detail page and its original colour-specific Payment Link fallbacks.

The new frontend reads **only public fields** from `/shop/v2/catalogue`, merges approved products with the existing printer offer, and asks the backend for authoritative quotes and checkout sessions. It never receives purchase costs or supplier links. Quote keys prevent paying a stale displayed total. Cart product IDs/variants/quantities are kept locally; email and payment details are not stored in the basket.

New admin controls are in **Shop products**, with restricted backend routes under `/admin/shop-catalogue`. Supplier checks and Royal Mail online-rate checks run on the Windows backend, not on the static website. Install the current private `InventoryOS-shop-orders-update.zip`, run `node .\check-shop.cjs --live` and `node .\check-shop-catalogue.cjs`, then restart InventoryOS Backend.

The private installer seeds 28 draft product families and 154 variants, including the existing printer record. They are not available for sale until actual held-stock costs, stock, authorised photos and protected-pack shipping measurements are verified. No supplier photos were copied. Automatic supplier lookup initially supports Pack Solution exact variant IDs; other supplier links use manual costs until supported. Separate Royal Mail checks validate public online, non-signature Tracked 48/24 rate tables and retain the last confirmed rate on failure. Stale postage beyond 48 hours blocks catalogue checkout.

Free eligible standard shipping defaults to **£50 after discounts**, with a configurable target contribution of 30% and a lower positive floor for bulk orders. Configurable card-fee reserve, packaging, postage and inbound supplier delivery allocations are included. Free shipping may be excluded for baskets that cannot cover their direct costs; the cart discloses the delivery charge before checkout. Prices and discounts are not claimed to cover overheads, income tax or unmodelled fees.

The existing direct printer checkout stays available during migration. Until its inventory, costs and shipping data are entered and published through the new catalogue, it checks out separately from catalogue supplies; the cart explains this. Once published in the catalogue, the printer joins mixed baskets. Existing Shop invoices, marketing consent, terms acceptance and subscription billing remain in place.

Validation: frontend unit/build checks, browser fixtures for grid/category/sort/product deep links/cart/mobile sizing, backend tests for packing, margin boundaries, source failure retention, permissions, reservations, quote matching, invoice preservation and duplicate webhooks. A real sandbox Checkout Session accepted inline prices/shipping and mandatory terms without a payment; no subscriptions changed. A complete owner-PC sandbox purchase/webhook remains the final installation check before approving new listings.
