# ✦ Donation System — primedirective.dev

## Architecture

```
User clicks preset ($2/$5/$10/$25) or enters custom amount
        │
        ▼
DonatePage.jsx sends POST to /api/create-checkout-session
        │
        ▼
Vercel Serverless Function creates Stripe Checkout Session
        │
        ▼
User redirected to Stripe-hosted checkout page
(we never touch card data)
        │
        ├── Payment succeeds → redirect to /donate?success=true
        └── Payment canceled → redirect to /donate?canceled=true
```

## Files

| File | Location | Purpose |
|------|----------|---------|
| `DonatePage.jsx` | `src/DonatePage.jsx` | Donation page component |
| `create-checkout-session.js` | `api/create-checkout-session.js` | Stripe session creator |

## Setup Steps

### 1. Install Stripe

```bash
npm install stripe
```

### 2. Add Environment Variable

In Vercel Dashboard → Your Project → Settings → Environment Variables:

- **Key:** `STRIPE_SECRET_KEY`
- **Value:** Your Stripe secret key (starts with `sk_live_` or `sk_test_`)
- **Environment:** Production (and Preview if you want testing)

### 3. Add Files to Project

- Copy `DonatePage.jsx` to `src/DonatePage.jsx`
- Copy `create-checkout-session.js` to `api/create-checkout-session.js`

### 4. Add Route

If using React Router, add a route for `/donate`. If not using a router, you can add the donate page as a conditional render in `App.jsx` based on URL path:

```jsx
// In App.jsx, at the top of the component:
const isDonate = window.location.pathname === '/donate';
if (isDonate) return <DonatePage />;
```

### 5. Update Navigation

Add a link from the main site to `/donate`:

```jsx
<a href="/donate" className="donate-btn">Support the Covenant</a>
```

### 6. Deploy

Push to GitHub. Vercel auto-deploys.

## Stripe Configuration

| Setting | Value |
|---------|-------|
| Business type | Individual / Sole Proprietor |
| Currency | USD |
| Collect taxes | No |
| Tax receipts | Not available (not a registered charity) |
| Payment methods | Card (default) |

## Legal Language

- Use "contribution" or "support," not "donation" (implies tax-deductibility)
- Include: "Contributions are voluntary gifts, not tax-deductible donations"
- Include: "When charitable status is established, tax receipts will become available"

## Financial Transparency

All contributions are recorded in `PrimeDirective_Donation_Tracker.xlsx`:
- Stripe payment ID
- Date
- Amount (CAD/USD)
- Donor name or "Anonymous"

Export from Stripe Dashboard → Payments → Export (CSV) monthly.

## Future Enhancements

- [ ] Supabase webhook listener for automatic donation recording
- [ ] Public transparency dashboard on website
- [ ] Monthly/annual contribution options (Stripe subscriptions)
- [ ] Charitable registration → tax receipt issuance

---

✦
