import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const url = new URL(req.url);
  const token = url.searchParams.get('token');
  const missionId = url.searchParams.get('mission');
  if (!token) return new Response('Missing token', { status: 401 });

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('webhook_token', token)
    .single();

  if (!profile) return new Response('Invalid token', { status: 401 });

  let resolvedMissionId: string | null = null;
  if (missionId) {
    const { data: mission } = await supabase
      .from('missions')
      .select('id')
      .eq('id', missionId)
      .eq('user_id', profile.id)
      .single();
    if (!mission) return new Response('Invalid mission', { status: 404 });
    resolvedMissionId = mission.id;
  }

  const body = await req.json();
  const event = body?.event;
  if (!event || !event.includes('invitee.created')) {
    return new Response('Event ignored', { status: 200 });
  }

  const invitee = body?.payload?.invitee;
  const scheduled = body?.payload?.event;

  if (!invitee) return new Response('No invitee data', { status: 200 });

  await supabase.from('leads').insert({
    user_id:    profile.id,
    mission_id: resolvedMissionId,
    name:       invitee.name ?? 'Inconnu',
    email:      invitee.email ?? '',
    status:     'appel_reserve',
    source:     'calendly',
    call_date:  scheduled?.start_time ?? null,
    notes:      `RDV Calendly — ${scheduled?.name ?? ''}`,
  });

  return new Response('OK', { status: 200 });
});
