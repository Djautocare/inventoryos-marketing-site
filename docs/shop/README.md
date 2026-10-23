# InventoryOS Shop

The public catalogue is linked from all marketing headers/footers, the three audience landing pages and Account Settings in the application. It uses the existing marketing appearance preference. There is one product: the JADENS 668BT at GBP 58.99 including UK delivery via Royal Mail.

## Current release state

**Catalogue only: online ordering is not enabled.** Product photos and product-specific details were imported from the owner-supplied eBay listing https://www.ebay.co.uk/itm/377228291527 on 23 October 2026. The original nine images are hosted locally; eBay checkout, buyer-protection text, seller feedback, fluctuating stock counts and eBay returns terms are not copied into the shop. Black, white and pink appear in the gallery but are not asserted to be in stock.

The separate InventoryOS sandbox has a one-off payment link tagged `inventoryos_area=shop`, `inventoryos_shop_sku=jadens-668bt`. The link charges GBP 58.99, collects a GB shipping address, has quantity fixed at one and clearly states no goods are dispatched for a test. Stripe invoice creation is disabled for new Shop tests; the backend generates InventoryOS invoice PDFs. It does not use subscription prices. The owner reports a successful sandbox test. Development tools have not submitted payments. The separate live objects prepared below do not change existing subscriptions.

## Order management and backend installation

The application has an admin-only **Shop orders** tab with separate Live and Sandbox filters, customer/delivery details, payment state, invoice access, status, Royal Mail tracking, private notes and email status/history. The backend is supplied privately as `InventoryOS-shop-orders-update.zip`, with the tested PostgreSQL schema, installer and Windows setup instructions. The download contains only the installable files; backend source is not published in this marketing repository. It must be installed on the owner's PC before the admin tab can load orders.

Signed webhooks retrieve authoritative Stripe sessions and import paid orders once. The Resend queue sends a high-contrast confirmation with a saved InventoryOS invoice PDF attached (new live numbering starts IOS-10001), then sends status/tracking updates. Sandbox messages are routed to an explicitly configured owner test inbox. Internal notes are excluded. No customer emails have been sent during development. Existing genuine Stripe invoices are retained. Existing subscriptions and global Stripe receipt settings are unchanged.

## Live checkout preparation — 23 October 2026

The live one-time product is `inventoryos_shop_jadens_668bt_v1`, with price `price_1UTme0C9bSpYsWkxUePLsRKK` at GBP 58.99. Its payment link is `plink_1UTmeJC9bSpYsWkxmzonGwoP`. The link is paused during setup. The public catalogue contains its URL, but does not render a purchase link until checkout is enabled and delivery/returns information is complete.

The dedicated live webhook is `we_1UTmefC9bSpYsWkxTtVy7oZQ` at `https://api.inventoryos.co.uk/shop/webhook`, using API version `2026-08-26.dahlia`. It listens for `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed` and `invoice.paid`. Retrieve this destination's signing secret privately in Stripe; it is not stored in this repository.

On the backend PC, add the following settings alongside the existing sandbox settings. Copy actual secret values privately, never into frontend code or this repository:

```dotenv
SHOP_STRIPE_SECRET_KEY=your_live_shop_api_key
SHOP_STRIPE_PAYMENT_LINK_IDS=plink_1UTmeJC9bSpYsWkxmzonGwoP
SHOP_STRIPE_WEBHOOK_SECRET=the_live_shop_destination_signing_secret
SHOP_SELLER_NAME=your_public_legal_seller_name
SHOP_SELLER_ADDRESS=your_public_business_address
SHOP_INVOICE_STYLE=minimal
```

Do not overwrite sandbox settings, Retail billing settings or existing subscription settings. The live Shop API key must belong to the live InventoryOS account, and its webhook signing secret must come from the new live Shop destination. A restricted API key must permit the Checkout session, Payment Link, price/product and legacy invoice reads used by the backend.

Before opening the link, confirm the public seller and returns details, dispatch timings and available colour(s). Update the product/checkout and shop-specific policies accordingly. Activate the live payment link when the backend settings are in place, run `node .\check-shop.cjs --live`, then restart InventoryOS Backend. Only publish the enabled Buy now button once that check passes. The check does not take payment or send email; a successful sandbox test does not verify the live key or live webhook secret.

## Remaining before live ordering

- Confirm the public seller/business name and customer/returns contact address, available colours/stock, and dispatch/service timings.
- Publish the shop-specific delivery, returns and seller terms, and update the privacy description for physical-order details.
- Install the prepared backend package, add the private environment settings, configure the dedicated sandbox webhook and complete a test order including the invoice attachment and tracking update. Then configure and verify a separate live key/link/webhook. Keep test and live orders separate. Never fulfil from a browser return page.
- Verify the prepared live one-time product price and payment link, shipping collection and final checkout total. Confirm enabled payment-method fees fit the intended sale proceeds.
- Only then fill `returnsSummary`, add the valid live payment link, set availability to `available` and turn `checkoutEnabled` on in `assets/shop-products.json`. Rebuild and rerun the tests.

## Development

`npm run build` creates the three audience pages and `shop.html`. `node scripts/style-documents.mjs` updates shared document navigation. `npm test` checks existing content plus catalogue price, photo availability and checkout safeguards. Product copy is escaped into static HTML and works without JavaScript; the small shop script changes gallery photos only. It does not collect card or address data.

Browser QA covered the gallery, specifications, light/dark appearances, account-settings entry, and 390px/320px shop layouts with no document overflow. The sandbox checkout was opened to verify its price, test branding and UK delivery-address collection. The preview image is a catalogue preview, not an operational live checkout.
