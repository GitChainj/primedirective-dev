// api/create-checkout-session.js
// 
// Vercel Serverless Function — Stripe Checkout Session Creator
// Place this file at: /api/create-checkout-session.js in your project root
//
// SETUP:
// 1. Install stripe: npm install stripe
// 2. In Vercel Dashboard → Settings → Environment Variables, add:
//    STRIPE_SECRET_KEY = sk_live_your_key_here (or sk_test_ for testing)
// 3. Deploy. The endpoint will be available at /api/create-checkout-session

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { amount } = req.body;

    // Validate amount (minimum $1 = 100 cents, maximum $10,000 = 1000000 cents)
    if (!amount || amount < 100 || amount > 1000000) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    // Create Stripe Checkout Session
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
            unit_amount: amount, // amount in cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${req.headers.origin}/donate?success=true`,
      cancel_url: `${req.headers.origin}/donate?canceled=true`,
      // Optional: collect email for thank-you / transparency records
      // customer_email: undefined, // let Stripe collect it
      billing_address_collection: 'auto',
    });

    res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Stripe error:', err.message);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
}
