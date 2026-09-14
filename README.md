# PRIYASA Store

Clean, mobile-first PRIYASA commerce storefront powered exclusively by PriyasaCore APIs.

## Architecture

`Browser → Next.js Store → PriyasaCore API → Commerce DB`

The Store does not access the commerce database directly and does not duplicate commerce business rules.

## Development

```bash
npm install
npm run dev
```

Set `NEXT_PUBLIC_PRIYASA_API_URL` for browser requests and `PRIYASA_API_URL` for server-side requests. Development defaults to `http://localhost:8000/api/v1`.

## Commerce surfaces

Home, catalog, search, product detail, OTP authentication, account, wishlist, cart, addresses, checkout, coupons, Razorpay payment handoff, orders, returns/refunds and support are implemented as independent Store surfaces and wired to PriyasaCore contracts.

The UI is mobile-first and responsive across desktop, tablet and mobile. Playwright smoke coverage is included for the core navigation and search journeys.
