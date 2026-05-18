import Stripe from "stripe";

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2026-04-22.dahlia",
  });
}

let _stripe: Stripe | null = null;
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    if (!_stripe) _stripe = getStripe();
    return Reflect.get(_stripe, prop);
  },
});

export const BEEF_FEE_RATE = 0.015;   // 1.5% platform cut
export const STRIPE_FEE_RATE = 0.035; // 3.5% Stripe cut (informational)
export const TOTAL_FEE_RATE = BEEF_FEE_RATE + STRIPE_FEE_RATE;

export const ANTE_MIN = 5;
export const ANTE_MAX = 500;
