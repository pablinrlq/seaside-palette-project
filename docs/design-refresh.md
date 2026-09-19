# Storefront design refresh - 2026-09-19

## Direction

Product-first beachwear storefront: bright photography, white space, deep green,
lime accents, Cormorant Garamond display type and Montserrat interface type.
Existing transparent brand marks and product photography are retained.

The redesign covers the home page, shared header/footer, collection/category
pages, product details, quick purchase dialog, cart, checkout and brand story.
There are no invented customer reviews, new discount claims or simulated paid orders.

## Campaign asset

- Built-in image_gen edit mode; no external image API or CLI fallback.
- Input: src/assets/hero-beach.jpg.
- Project asset: src/assets/campaign-wide.webp (1942 x 809, approximately 181 KB).
- The generated PNG was converted to WebP for delivery. Product photographs
  were not generated or altered by this refresh.
- Desktop uses the panoramic asset; mobile retains the original portrait photo.

### Final generation prompt

Use case: identity-preserve. Edit target: supplied existing Agua Limpa beachwear
campaign image. Create an extra-wide 2.4:1 horizontal hero photograph for the
storefront. Reframe and extend the scenery into a premium natural fashion
editorial. Preserve the existing adult woman, her recognizable face, natural
body, same exact deep teal one-piece swimsuit with its existing cutout, pose
and daylight. Position her on the right third at x=72%, include her complete
head and visible body at least to the upper thigh, not cut off head. Left 55%
should be expansive clear tropical turquoise ocean, darker emerald coastal
rocks in far distance and clear sky, naturally uncluttered negative space for
white type added later. Use realistic Brazilian coastal setting, sunlit water,
visible sea texture, natural colors, high-end photographic clarity, no heavy
color filters. The swimsuit and person must remain visibly unchanged. This is
a photographic hero background, absolutely NO text, logos, borders, UI,
typography, gradients, blur, bokeh, extra people, accessories, or invented
swimwear details. Wide cinematic framing with enough vertical breathing room
around head for responsive crops. Final image landscape 2400x1000 or nearest
suitable wide aspect.

## Verification

- Production build and TypeScript check.
- ESLint: no errors; existing Fast Refresh warnings remain.
- Chromium/Playwright layout checks from 320 to 1920 px, including header
  alignment and document overflow.
- Quick purchase requires an explicit size for multi-size products.
- Independent quantities and removal for different sizes of the same product.
- Cart survives reload and additions are capped by available product stock.
- Product photo zoom, catalog size/color filters, price ordering, empty states.
- Search ignores accents; mobile menu and dialogs close with Escape.
- Home category tabs support arrow keys, Home and End.

## Remaining integration

Checkout has no active payment provider, order backend or shipping quotation
service. The payment action is disabled and no fake confirmation is shown.
Delivery is shown as pending below the existing free-shipping threshold.
Contact/address inputs are not stored or sent to a backend.
