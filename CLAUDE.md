# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Frontend for "The Next Protein Nepal" (plant-based protein brand). Two separate Vite + React 19 + TypeScript + Tailwind v4 apps live in this repo:

- **Storefront** (repo root, `src/`): public catalogue, cart, checkout (eSewa / Stripe / COD), order tracking, enquiry forms.
- **Admin panel** (`admin/`): its own `package.json` and `node_modules`. It is served under the `/admin/` base path.

Both ship as **one deployment**: the root build outputs the storefront to `dist/` and the admin to `dist/admin/`. This repo is frontend only.

The backend API is **not in this repo**. Both apps call it at `VITE_API_BASE_URL`, which defaults to `http://127.0.0.1:5000` (see `admin/.env.example`). Error responses come back as JSON `{ error: string }`.

## Commands

Run these from the repo root:

```bash
npm install && npm --prefix admin install
npm run dev          # both: storefront :8443 + admin :5174 (via concurrently)
npm run dev:site     # storefront only
npm run dev:admin    # admin only
npm run build        # storefront -> dist/, then admin -> dist/admin/ (runs `npm ci` in admin/)
npm run preview
npm run format       # oxfmt (storefront)
```

There is no test suite and no lint script. Type checking is not part of `build`, so run it on its own with `npx tsc --noEmit` (in each app).

Both dev servers use `strictPort`, so they fail instead of moving to another port if theirs is busy. The `PORT` env var overrides the port.

`npm run dev` starts both dev servers. The storefront dev server proxies `/admin` to `127.0.0.1:5174`, so `http://localhost:8443/admin/` reaches the admin app. If you open the admin dev server at its bare root, a dev-only plugin in `admin/vite.config.ts` redirects you to `/admin/`.

## Architecture

- **API layer**: each app has a single `src/lib/api.ts` that holds every endpoint as a method on an `api` object, plus the TypeScript types for backend entities (Product, ProductVariant, Order, Enquiry, …). The two files are independent copies with slightly different types, so a backend schema change usually means updating both. `imageUrl()` turns relative image paths from the backend into absolute URLs.
- **Admin auth**: a JWT is stored in localStorage under `tnp_admin_token` and sent as a Bearer token. On any 401, `request()` clears the token and does a hard redirect to `/admin/login`. The `/admin` prefix is hardcoded because a `window.location` redirect ignores the router's `basename`. Routes are wrapped in `ProtectedRoute` and `AuthContext`.
- **Cart**: `src/context/CartContext.tsx` is a reducer persisted to localStorage under `tnp_cart`. Items are keyed by **variant id**, not product id, because orders are placed per variant (`items: { variant_id, quantity }[]`). Variants with `is_enquiry_only` or a null `price_npr` can't be bought.
- **Payments**: `Checkout` creates the order, then calls `initiateEsewa` (which returns form fields to POST to eSewa) or `initiateStripe` (which returns a redirect URL). The gateways return to `/payment/{esewa|stripe}/return`, and `PaymentReturn` confirms the payment through the backend callback endpoints. Customers look up an order at `/order/:orderNumber` using their phone number.
- **Forms (storefront)**: Checkout, Contact and Wholesale validate with `src/lib/validation.ts`. Their errors are a `Record<field, message>`, and `focusFirstError` looks up each field by **element id**, so an input's `id` must match its error key.
- **Dates**: show all timestamps in Nepal time with `lib/datetime.ts` (`formatNepaliDateTime` / `formatNepaliDate`). This file is identical in both apps.
- **Styling**: Tailwind v4 brand tokens are defined in `@theme` in `src/index.css`: colours such as `green-primary` and `cream-warm`, and fonts `font-display` (League Spartan) and `font-body` (Manrope).
- **Images**: static brand and product images live in the top-level `assets/` folder, outside `src/`, and are imported with relative paths such as `../../assets/...`. `public/` contains the favicon, `robots.txt` and `sitemap.xml`.
- **Path alias**: `@/*` maps to `src/*` in both apps.

## Deployment

A single Vercel project deploys from the repo root. The root `vercel.json` sends `/admin` and `/admin/*` to `dist/admin/index.html` and everything else to the storefront SPA, It also applies one set of strict security headers to every path, so both apps share a single **Content-Security-Policy**. That CSP already allows `connect-src` and `img-src` to any `https:` origin, so an HTTPS API origin needs no change. External scripts (`script-src 'self'` only), fonts other than Google Fonts, and new payment-gateway form targets (`form-action`) do need to be added, or production will block them. Set `VITE_API_BASE_URL` as a Vercel environment variable; both builds read it at build time. The storefront CSP allows form posts to the eSewa domains (`rc-epay.esewa.com.np`, `epay.esewa.com.np`).

## Notes

- `src/imports/pasted_text/next-protein-nepal-website.md` is the original design brief. It says "not a full e-commerce store", but the site has since gained a cart, checkout and payments, so treat the code as the source of truth wherever the two disagree. The brief's brand-name rule still applies: use "The Next Protein Nepal".
