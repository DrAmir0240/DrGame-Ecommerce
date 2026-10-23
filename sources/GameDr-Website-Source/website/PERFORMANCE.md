# Performance and frontend maintenance

The site runs with `npm start` on the configured PORT. The generated stylesheet is included, so production startup does not require development tools.

## Frontend sources

- `styles/base.css`: shared layouts and original theme styles.
- `styles/home.css`: homepage components and light/dark variants.
- `styles/performance.css`: responsive and compatibility rules.
- `npm run build:css`: generates `public/style.css`. Edit the source files rather than the generated CSS.
- `public/pages/`: page-specific behavior extracted from HTML.
- `public/runtime.js`: deduplicates only explicitly allowed public API GET requests for the current page. Account/admin responses are never shared or cached here.
- `public/menu.js`: the single drawer controller for all pages, including keyboard focus and Persian direction support.

## Performance choices

- Hero artwork uses twenty distinct covers instead of forty; repeated groups preserve the scrolling loop. Later images are lazy loaded. Animation pauses offscreen and while the document is hidden.
- Cover tiles offer multiple image sizes. Existing server-generated WebP thumbnails are reused.
- Image conversions are queued with at most two active jobs; identical conversions share a promise.
- Catalog rendering batches new tiles into a document fragment and batches search input work into animation frames.
- Native browser pointers replace the game-page glow, custom pointer and click-to-hide effects.
- Reduced-motion and reduced-transparency preferences are respected. Newer visual effects have solid-background fallbacks.

## Verification and limits

Checked public/account/admin endpoints, wishlist isolation and request privacy, script syntax and asset references, public-request deduplication, image queue concurrency, catalog filtering, shared drawer opening/closing, Persian menu placement, game details and a narrow homepage viewport.

The browser checks use the available Chromium-based desktop browser. Safari, Firefox, physical mobile devices and older browsers require a separate device test pass; no universal smoothness guarantee is implied. Payment, email/SMS delivery and large real-world downloads were not exercised by this frontend performance pass.
