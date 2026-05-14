import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const url = new URL(req.url);
  const token = url.searchParams.get('token');
  if (!token) return new Response('Missing token', { status: 401 });

  // Trouve le closer via son webhook_token
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('webhook_token', token)
    .single();

  if (!profile) return new Response('Invalid token', { status: 401 });

  const body = await req.json();
  const event = body?.event;
  if (!event || !event.includes('invitee.created')) {
    return new Response('Event ignored', { status: 200 });
  }

  const invitee = body?.payload?.invitee;
  const scheduled = body?.payload?.event;

  if (!invitee) return new Response('No invitee data', { status: 200 });

  // Crée le lead automatiquement
  await supabase.from('leads').insert({
    user_id:   profile.id,
    name:      invitee.name ?? 'Inconnu',
    email:     invitee.email ?? '',
    status:    'rdv',
    source:    'calendly',
    call_date: scheduled?.start_time ?? null,
    notes:     `RDV Calendly — ${scheduled?.name ?? ''}`,
  });

  return new Response('OK', { status: 200 });
});
