# Free Tools

The eight public tools are available from `/tools` on a built copy of the marketing site. Each has a static, indexed page and shares the site's appearance and language preference. Form processing stays in the browser. Validation and exports do not require an account, a backend or an API key.

Run `npm run build` to regenerate the index, individual pages and sitemap. Run `npm test` for the site suite, including calculator reference cases, barcode and SKU validation, CSV quoting and PDF pagination. To try the tools locally, serve this checkout with any local static server. Cloudflare Pages resolves directory and HTML aliases; when using Python's static server locally, open `/tools.html` and the individual `/tools/*.html` files.

The Code 128 generator uses the same local JsBarcode library as InventoryOS Retail, under the included MIT licence. Check physical print scaling before batch printing. The document tools render their A4 pages in the browser and package the rendered pages in a PDF. PDF page text is rasterised. No third-party PDF library or runtime service is used.
