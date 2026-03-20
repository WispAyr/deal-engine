/**
 * Stripe integration: customers, checkout, portal, webhooks.
 * Env: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_PRICE_ID (optional)
 */
import Stripe from 'stripe';
import { listUsers } from './users.js';

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const PRICE_ID = process.env.STRIPE_PRICE_ID;

export const stripeEnabled = () => !!stripe;

export async function createStripeCustomer(email) {
  if (!stripe) return null;
  const customer = await stripe.customers.create({ email });
  return customer.id;
}

export async function createCheckoutSession(customerId, priceId = PRICE_ID, successUrl, cancelUrl) {
  if (!stripe || !customerId || !priceId) return null;
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: priceId }],
    success_url: successUrl,
    cancel_url: cancelUrl,
  });
  return session.url;
}

export async function createPortalSession(customerId, returnUrl) {
  if (!stripe || !customerId) return null;
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
  return session.url;
}

function findUserByStripeCustomerId(customerId) {
  const users = listUsers();
  return users.find(u => u.stripeCustomerId === customerId);
}

export async function handleWebhook(rawBody, signature) {
  if (!stripe || !WEBHOOK_SECRET) return { status: 400, body: 'Stripe not configured' };
  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, WEBHOOK_SECRET);
  } catch (err) {
    return { status: 400, body: `Webhook error: ${err.message}` };
  }
  const { updateUser } = await import('./users.js');
  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const sub = event.data.object;
      const status = sub.status;
      const user = findUserByStripeCustomerId(sub.customer);
      if (user) updateUser(user.id, { subscriptionStatus: status });
      break;
    }
    case 'customer.subscription.deleted': {
      const sub = event.data.object;
      const user = findUserByStripeCustomerId(sub.customer);
      if (user) updateUser(user.id, { subscriptionStatus: 'canceled' });
      break;
    }
    case 'invoice.paid':
    case 'invoice.payment_failed':
      break;
    default:
      break;
  }
  return { status: 200, body: JSON.stringify({ received: true }) };
}
