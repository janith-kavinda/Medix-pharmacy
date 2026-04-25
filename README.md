# Medix-pharmacy

## Payments (Stripe)

The backend now supports Stripe hosted checkout for cart payments.

Add these variables in `backend/.env`:

- `STRIPE_SECRET_KEY` (required)
- `STRIPE_PUBLISHABLE_KEY` (optional, returned by `/api/payments/config`)
- `STRIPE_WEBHOOK_SECRET` (required for webhook verification)
- `STRIPE_CURRENCY` (optional, default: `usd`)
- `FRONTEND_URL` (optional, default: `http://localhost:3000`)

Webhook endpoint (configure in Stripe dashboard / Stripe CLI):

- `POST /api/payments/webhook`