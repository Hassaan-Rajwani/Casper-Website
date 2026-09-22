/** Public contact email — set via Netlify/local env, never hardcode in source. */
export const CONTACT_EMAIL =
  process.env.NEXT_PUBLIC_CONTACT_EMAIL ??
  process.env.NEXT_PUBLIC_ORDER_NOTIFICATION_EMAIL ??
  "";
