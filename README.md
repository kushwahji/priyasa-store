# PRIYASA Store

Clean, mobile-first PRIYASA commerce storefront powered exclusively by PriyasaCore APIs.

## Architecture

`Browser → Next.js Store/BFF → PriyasaCore API → Commerce DB`

The browser talks to same-origin `/api/priyasa/*` routes. The Next.js server reads the private `PRIYASA_API_BASE_URL` value and proxies requests to PriyasaCore, so the upstream API configuration is not exposed through the browser bundle.

Authentication is passwordless OTP. After successful `/auth/verify-otp`, the BFF stores the PriyasaCore access token in an HttpOnly cookie. Protected UI surfaces validate that session through `/api/session`; PriyasaCore remains the authentication source of truth.

The Store does not access the commerce database directly and does not duplicate commerce business rules.

## Development

```bash
npm install
npm run dev
```

Configure the server-side upstream with:

```env
PRIYASA_API_BASE_URL=http://localhost:8000/api/v1
```

`PRIYASA_API_URL` remains a legacy server-side fallback. Do not rely on `PRIYASA_API_BASE_URL` being directly readable by client-side JavaScript; browser requests use the same-origin BFF.

## Commerce surfaces

Home, catalog, search, product detail, OTP authentication, account, wishlist, cart, addresses, checkout, coupons, Razorpay payment handoff, orders, returns/refunds and support are implemented as independent Store surfaces and wired to PriyasaCore contracts.

The UI is mobile-first and responsive across desktop, tablet and mobile. Playwright coverage includes core navigation, search and authenticated/unauthenticated account-session behavior.
