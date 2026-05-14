import Stripe from 'https://esm.sh/stripe@14';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2023-10-16',
});

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const { email, userId } = await req.json();

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'subscription',
    customer_email: email,
    line_items: [{
      price_data: {
        currency: 'eur',
        product_data: { name: 'CloserTrack Pro' },
        unit_amount: 3900,
        recurring: { interval: 'month' },
      },
      quantity: 1,
    }],
    success_url: 'https://closertrack.vercel.app?subscribed=true',
    cancel_url: 'https://closertrack.vercel.app?canceled=true',
    metadata: { userId },
  });

  return new Response(JSON.stringify({ url: session.url }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
