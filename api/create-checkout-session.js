import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { amount } = req.body;

    if (!amount || amount < 100 || amount > 1000000) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Support the Universal Primary Directive',
              description: 'Voluntary contribution to keep primedirective.dev open, accessible, and growing.',
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${req.headers.origin}/donate?success=true`,
      cancel_url: `${req.headers.origin}/donate?canceled=true`,
    });

    res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Stripe error:', err.message);
    res.status(500).json({ error: err.message });
  }
}
```

The key change is `import Stripe from 'stripe'` instead of `require('stripe')` — this uses ES modules which is what your project is configured for (`"type": "module"` in package.json).

Commit that change.

**Issue 2: Remove the fake fallback URL from DonatePage.jsx**

Go to GitHub → `src/DonatePage.jsx` → click pencil to edit. Find this line:
```
window.location.href = "https://donate.stripe.com/YOUR_PAYMENT_LINK";
```

Replace it with:
```
alert("Payment system is connecting. Please try again in a moment.");
