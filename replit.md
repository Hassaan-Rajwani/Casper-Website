# Workspace

## Overview

npm workspace monorepo using TypeScript. Tissue paper ecommerce website "SoftTouch".

## Stack

- **Monorepo tool**: npm workspaces
- **Node.js version**: 24
- **Package manager**: npm
- **TypeScript version**: 5.9
- **Backend data/auth**: Firebase Firestore + Firebase Auth (REST integration)
- **Frontend**: React + Vite, TailwindCSS, Framer Motion, React Hook Form

## Artifacts

### `tissue-shop` - SoftTouch Ecommerce Website
- Tissue paper selling website for Pakistani market
- Pages: Home, Products, Product Detail, Cart, Checkout, Order Confirmation
- Preview path: `/`

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── tissue-shop/        # React Vite ecommerce frontend
│   └── mockup-sandbox/     # Design sandbox
```

## Firebase Collections

- `categories` - Product categories
- `products` - Catalog items
- `carts` - Cart documents keyed by browser session
- `orders` - Checkout orders
- Firebase Auth email/password - Admin authentication

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`.

## Root Scripts

- `npm run build` — runs `typecheck` first, then recursively runs `build` in active frontend workspaces
- `npm run typecheck` — recursively runs `typecheck` in active frontend workspaces
