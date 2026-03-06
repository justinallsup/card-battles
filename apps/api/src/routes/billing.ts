import { Hono } from 'hono';
import type { AppVariables } from '../types';
import { authRequired } from '../middleware/auth';

const router = new Hono<{ Variables: AppVariables }>();

router.post('/create-checkout-session', authRequired, async (c) => {
  if (!process.env.STRIPE_SECRET_KEY) return c.json({ error: 'Billing not configured' }, 503);
  return c.json({ url: 'https://checkout.stripe.com/placeholder' });
});

router.post('/webhook', async (c) => {
  return c.json({ received: true });
});

export default router;
