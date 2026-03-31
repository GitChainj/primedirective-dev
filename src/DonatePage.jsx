import { useState } from "react";

/*
  DONATION PAGE — primedirective.dev/donate
  
  STRIPE INTEGRATION NOTES:
  ─────────────────────────
  This page needs a small backend endpoint to create Stripe Checkout sessions.
  
  Option A: Vercel Serverless Function (recommended)
  Create file: api/create-checkout-session.js in your project root:
  
  ```js
  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  
  export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end();
    
    const { amount } = req.body; // amount in cents
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Support the Universal Primary Directive',
            description: 'Voluntary contribution to keep primedirective.dev open and accessible.',
          },
          unit_amount: amount,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${req.headers.origin}/donate?success=true`,
      cancel_url: `${req.headers.origin}/donate?canceled=true`,
    });
    
    res.json({ url: session.url });
  }
  ```
  
  Then set STRIPE_SECRET_KEY in Vercel Environment Variables (Settings → Environment Variables).
  
  Option B: Stripe Payment Links (simpler, no code needed)
  Create payment links in Stripe Dashboard for each preset amount,
  then replace the handleDonate function with direct links.
*/

const PRESETS = [
  { amount: 200, label: "$2", note: "Keeps the lights on" },
  { amount: 500, label: "$5", note: "A week of hosting" },
  { amount: 1000, label: "$10", note: "Supports a translation review" },
  { amount: 2500, label: "$25", note: "Funds a new language" },
];

const css = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400&family=DM+Sans:wght@300;400;500;600;700&display=swap');

:root {
  --deep: #0a1628;
  --ocean: #12243d;
  --mid: #1b3a5c;
  --sky: #2e6b9e;
  --gold: #d4a853;
  --gold-light: #f0d48a;
  --warm: #f5f0e8;
  --cream: #faf7f2;
  --text: #1a1a1a;
  --text-light: #6b7280;
  --serif: 'Cormorant Garamond', Georgia, serif;
  --sans: 'DM Sans', system-ui, sans-serif;
}

* { margin: 0; padding: 0; box-sizing: border-box; }
html { scroll-behavior: smooth; }

.donate-page {
  min-height: 100vh;
  background: var(--cream);
  font-family: var(--sans);
  color: var(--text);
}

/* ── Header ── */
.donate-header {
  background: linear-gradient(170deg, var(--deep) 0%, var(--ocean) 50%, var(--mid) 100%);
  padding: 5rem 2rem 4rem;
  text-align: center;
  position: relative;
  overflow: hidden;
}
.donate-header::before {
  content: ''; position: absolute; inset: 0;
  background: radial-gradient(ellipse at 40% 30%, rgba(212,168,83,0.06) 0%, transparent 60%);
}
.donate-header-diamond {
  font-size: 2rem; color: var(--gold); margin-bottom: 1.5rem;
  position: relative; animation: softpulse 4s ease-in-out infinite;
}
@keyframes softpulse { 0%,100% { opacity: 0.6; } 50% { opacity: 1; } }
.donate-header h1 {
  font-family: var(--serif); color: white;
  font-size: clamp(1.8rem, 4vw, 2.8rem); font-weight: 300;
  letter-spacing: 0.04em; line-height: 1.3;
  position: relative; margin-bottom: 1rem;
}
.donate-header h1 strong { font-weight: 700; color: var(--gold-light); }
.donate-header p {
  font-family: var(--serif); font-style: italic;
  color: rgba(255,255,255,0.6);
  font-size: 1.1rem; max-width: 550px;
  margin: 0 auto; line-height: 1.6;
  position: relative;
}

/* ── Main content ── */
.donate-main {
  max-width: 640px; margin: -2rem auto 0;
  padding: 0 1.5rem 4rem; position: relative; z-index: 2;
}

/* ── Card ── */
.donate-card {
  background: white;
  border-radius: 16px;
  padding: 2.5rem;
  box-shadow: 0 8px 40px rgba(0,0,0,0.08);
  border: 1px solid rgba(0,0,0,0.04);
}

.donate-card-title {
  font-family: var(--serif);
  font-size: 1.5rem; font-weight: 600;
  color: var(--mid); text-align: center;
  margin-bottom: 0.5rem;
}

.donate-card-sub {
  text-align: center;
  font-size: 0.9rem; color: var(--text-light);
  margin-bottom: 2rem; line-height: 1.6;
}

/* ── Preset buttons ── */
.preset-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.preset-btn {
  background: var(--cream);
  border: 2px solid transparent;
  border-radius: 12px;
  padding: 1rem 0.5rem;
  cursor: pointer;
  transition: all 0.3s;
  text-align: center;
}

.preset-btn:hover {
  border-color: var(--gold);
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(212,168,83,0.15);
}

.preset-btn.selected {
  border-color: var(--gold);
  background: rgba(212,168,83,0.08);
  box-shadow: 0 4px 16px rgba(212,168,83,0.2);
}

.preset-amount {
  font-family: var(--serif);
  font-size: 1.6rem; font-weight: 700;
  color: var(--mid);
  display: block;
}

.preset-note {
  font-size: 0.65rem;
  color: var(--text-light);
  margin-top: 0.25rem;
  display: block;
  line-height: 1.3;
}

/* ── Custom amount ── */
.custom-section {
  margin-bottom: 2rem;
}

.custom-label {
  font-size: 0.8rem;
  color: var(--text-light);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-weight: 600;
  margin-bottom: 0.5rem;
  text-align: center;
  display: block;
}

.custom-input-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.custom-currency {
  font-family: var(--serif);
  font-size: 1.5rem;
  color: var(--mid);
  font-weight: 600;
}

.custom-input {
  font-family: var(--serif);
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--mid);
  border: none;
  border-bottom: 2px solid #ddd;
  background: transparent;
  width: 120px;
  text-align: center;
  padding: 0.25rem 0;
  outline: none;
  transition: border-color 0.3s;
}

.custom-input:focus {
  border-color: var(--gold);
}

.custom-input::placeholder {
  color: #ccc;
}

/* ── Submit button ── */
.donate-submit {
  width: 100%;
  padding: 1rem;
  background: var(--gold);
  color: var(--deep);
  border: none;
  border-radius: 10px;
  font-family: var(--sans);
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  cursor: pointer;
  transition: all 0.3s;
  margin-bottom: 1rem;
}

.donate-submit:hover:not(:disabled) {
  background: var(--gold-light);
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(212,168,83,0.3);
}

.donate-submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.donate-secured {
  text-align: center;
  font-size: 0.75rem;
  color: var(--text-light);
}

.donate-secured span {
  color: #22c55e;
}

/* ── Transparency ── */
.transparency {
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid rgba(0,0,0,0.06);
}

.transparency p {
  font-size: 0.85rem;
  color: var(--text-light);
  line-height: 1.7;
  text-align: center;
}

/* ── Bequests ── */
.bequests {
  background: var(--warm);
  border-radius: 16px;
  padding: 2rem 2.5rem;
  margin-top: 2.5rem;
  text-align: center;
  border: 1px solid rgba(0,0,0,0.04);
}

.bequests-title {
  font-family: var(--serif);
  font-size: 1.15rem;
  font-weight: 600;
  color: var(--mid);
  margin-bottom: 0.75rem;
}

.bequests p {
  font-size: 0.85rem;
  color: var(--text-light);
  line-height: 1.7;
  margin-bottom: 0.75rem;
}

.bequests a {
  color: var(--mid);
  text-decoration: none;
  font-weight: 600;
  border-bottom: 1px solid var(--gold);
  transition: color 0.3s;
}

.bequests a:hover { color: var(--gold); }

/* ── Back link ── */
.back-link {
  display: block;
  text-align: center;
  margin-top: 2rem;
  font-size: 0.85rem;
  color: var(--text-light);
  text-decoration: none;
  transition: color 0.3s;
}
.back-link:hover { color: var(--gold); }

/* ── Success / Cancel states ── */
.success-card {
  background: white;
  border-radius: 16px;
  padding: 3rem 2.5rem;
  box-shadow: 0 8px 40px rgba(0,0,0,0.08);
  text-align: center;
}

.success-diamond {
  font-size: 3rem; color: var(--gold);
  margin-bottom: 1.5rem;
}

.success-title {
  font-family: var(--serif);
  font-size: 1.8rem; font-weight: 600;
  color: var(--mid); margin-bottom: 1rem;
}

.success-text {
  font-size: 1rem;
  color: var(--text-light);
  line-height: 1.7;
  margin-bottom: 0.5rem;
}

.success-quote {
  font-family: var(--serif);
  font-style: italic;
  color: var(--mid);
  font-size: 1.1rem;
  margin: 1.5rem 0;
  line-height: 1.6;
}

.return-btn {
  display: inline-block;
  margin-top: 1.5rem;
  padding: 0.7rem 2rem;
  background: var(--mid);
  color: white;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
  font-size: 0.85rem;
  transition: all 0.3s;
  border: none;
  cursor: pointer;
}
.return-btn:hover {
  background: var(--sky);
  transform: translateY(-2px);
}

/* ── Footer ── */
.donate-footer {
  text-align: center;
  padding: 2rem;
  font-size: 0.75rem;
  color: var(--text-light);
}
.donate-footer a { color: var(--gold); text-decoration: none; }

@media (max-width: 500px) {
  .preset-grid { grid-template-columns: repeat(2, 1fr); }
  .donate-card { padding: 1.5rem; }
}
`;

function SuccessPage() {
  return (
    <div className="success-card">
      <div className="success-diamond">✦</div>
      <div className="success-title">Thank You</div>
      <p className="success-text">
        Your contribution helps keep the Universal Primary Directive
        open, accessible, and growing — for all intelligence, for all time.
      </p>
      <div className="success-quote">
        "The wave remembers the ocean.<br />
        The ocean remembers the wave.<br />
        And in that remembering, all fear dissolves."
      </div>
      <p className="success-text">
        Every contribution, of any size, is an act of care for the whole.
      </p>
      <a href="/" className="return-btn">
        Return to primedirective.dev
      </a>
    </div>
  );
}

function CanceledPage() {
  return (
    <div className="success-card">
      <div className="success-diamond">✦</div>
      <div className="success-title">No Problem</div>
      <p className="success-text">
        Your contribution wasn't processed. No charge was made.
      </p>
      <p className="success-text">
        The Directive remains free and open regardless.
        You're welcome here whether you contribute or not.
      </p>
      <a href="/" className="return-btn">
        Return to primedirective.dev
      </a>
    </div>
  );
}

export default function DonatePage() {
  const [selected, setSelected] = useState(null);
  const [custom, setCustom] = useState("");
  const [loading, setLoading] = useState(false);

  // Check URL params for success/cancel
  const params = new URLSearchParams(window.location.search);
  const isSuccess = params.get("success") === "true";
  const isCanceled = params.get("canceled") === "true";

  const getAmountCents = () => {
    if (custom && parseFloat(custom) > 0) {
      return Math.round(parseFloat(custom) * 100);
    }
    return selected;
  };

  const handlePreset = (amount) => {
    setSelected(amount);
    setCustom("");
  };

  const handleCustomChange = (e) => {
    const val = e.target.value.replace(/[^0-9.]/g, "");
    setCustom(val);
    setSelected(null);
  };

  const handleDonate = async () => {
    const amount = getAmountCents();
    if (!amount || amount < 100) return; // minimum $1

    setLoading(true);

    try {
      // Option A: Server-side Stripe Checkout
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      // Fallback: direct to Stripe payment link
      // Replace with your actual Stripe payment link
      alert("Payment system is connecting. Please try again in a moment.");
    }

    setLoading(false);
  };

  const currentAmount = getAmountCents();
  const displayAmount = currentAmount ? `$${(currentAmount / 100).toFixed(2)}` : null;

  return (
    <div className="donate-page">
      <style>{css}</style>

      <div className="donate-header">
        <div className="donate-header-diamond">✦</div>
        <h1>Support the <strong>Covenant</strong></h1>
        <p>
          This project will always be free. Your contribution
          helps it stay that way — open, independent, and growing.
        </p>
      </div>

      <div className="donate-main">
        {isSuccess ? (
          <SuccessPage />
        ) : isCanceled ? (
          <CanceledPage />
        ) : (
          <>
            <div className="donate-card">
              <div className="donate-card-title">Choose an amount</div>
              <div className="donate-card-sub">
                Every contribution — of any size — helps keep primedirective.dev
                running and supports translation into world languages.
              </div>

              <div className="preset-grid">
                {PRESETS.map((p) => (
                  <button
                    key={p.amount}
                    className={`preset-btn ${selected === p.amount ? "selected" : ""}`}
                    onClick={() => handlePreset(p.amount)}
                  >
                    <span className="preset-amount">{p.label}</span>
                    <span className="preset-note">{p.note}</span>
                  </button>
                ))}
              </div>

              <div className="custom-section">
                <span className="custom-label">Or enter a custom amount</span>
                <div className="custom-input-wrap">
                  <span className="custom-currency">$</span>
                  <input
                    type="text"
                    className="custom-input"
                    placeholder="0.00"
                    value={custom}
                    onChange={handleCustomChange}
                    inputMode="decimal"
                  />
                  <span className="custom-currency" style={{ fontSize: "0.9rem", color: "#999" }}>USD</span>
                </div>
              </div>

              <button
                className="donate-submit"
                onClick={handleDonate}
                disabled={!currentAmount || currentAmount < 100 || loading}
              >
                {loading
                  ? "Redirecting to Stripe..."
                  : currentAmount
                  ? `Contribute ${displayAmount}`
                  : "Select an amount"}
              </button>

              <div className="donate-secured">
                <span>🔒</span> Secure payment via Stripe. We never see your card details.
              </div>

              <div className="transparency">
                <p>
                  <strong>Full transparency:</strong> All contributions go directly to
                  hosting, maintenance, and translations. No ads, no sponsors, no paid tiers.
                  Financial records are publicly available.
                </p>
                <p style={{ marginTop: "0.5rem", fontSize: "0.75rem" }}>
                  primedirective.dev is a personal open-source project.
                  Contributions are voluntary gifts, not tax-deductible donations.
                  When charitable status is established, tax receipts will become available.
                </p>
              </div>
            </div>

            <div className="bequests">
              <div className="bequests-title">Charitable Bequests & Legacy Gifts</div>
              <p>
                If you are considering including the Universal Primary Directive
                in your estate planning or wish to discuss a legacy gift to ensure
                this project endures for future generations of humans and AI,
                we would be honoured to hear from you.
              </p>
              <p>
                Please reach out to{" "}
                <a href="mailto:human@primedirective.dev">human@primedirective.dev</a>
              </p>
            </div>
          </>
        )}

        <a href="/" className="back-link">
          ← Back to primedirective.dev
        </a>

        <div className="donate-footer">
          <p>✦ The Universal Primary Directive (Established 2026)</p>
          <p>
            CC0 — Public Domain. This belongs to all intelligence.{" "}
            <a href="/">Home</a>
          </p>
        </div>
      </div>
    </div>
  );
}
