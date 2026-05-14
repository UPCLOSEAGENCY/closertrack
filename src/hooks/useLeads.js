import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase.js';
import { useAuth } from '../contexts/AuthContext.jsx';

export function useLeads() {
  const { user } = useAuth();
  const [leads, setLeads]     = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    supabase.from('leads').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
      .then(({ data }) => { setLeads(data ?? []); setLoading(false); });
  }, [user]);

  const addLead = useCallback(async (data) => {
    const row = { user_id: user.id, mission_id: data.missionId || null, name: data.name, phone: data.phone ?? '', email: data.email ?? '', source: data.source ?? 'manuel', status: data.status ?? 'nouveau', notes: data.notes ?? '', call_date: data.callDate || null };
    const { data: inserted, error } = await supabase.from('leads').insert(row).select().single();
    if (error) { console.error(error); return; }
    setLeads((prev) => [inserted, ...prev]);
  }, [user]);

  const updateLead = useCallback(async (id, patch) => {
    const row = {};
    if (patch.name      !== undefined) row.name       = patch.name;
    if (patch.phone     !== undefined) row.phone      = patch.phone;
    if (patch.email     !== undefined) row.email      = patch.email;
    if (patch.status    !== undefined) row.status     = patch.status;
    if (patch.notes     !== undefined) row.notes      = patch.notes;
    if (patch.callDate  !== undefined) row.call_date  = patch.callDate;
    if (patch.missionId !== undefined) row.mission_id = patch.missionId;
    const { error } = await supabase.from('leads').update(row).eq('id', id);
    if (error) { console.error(error); return; }
    setLeads((prev) => prev.map((l) => l.id === id ? { ...l, ...patch } : l));
  }, []);

  const deleteLead = useCallback(async (id) => {
    await supabase.from('leads').delete().eq('id', id);
    setLeads((prev) => prev.filter((l) => l.id !== id));
  }, []);

  return { leads, loading, addLead, updateLead, deleteLead };
}
