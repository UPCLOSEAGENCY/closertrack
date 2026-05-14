import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase.js';
import { useAuth } from '../contexts/AuthContext.jsx';

export function useAppData() {
  const { user } = useAuth();
  const [missions, setMissions] = useState([]);
  const [sales, setSales]       = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    Promise.all([
      supabase.from('missions').select('*').eq('user_id', user.id).order('created_at', { ascending: true }),
      supabase.from('sales').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    ]).then(([{ data: m }, { data: s }]) => {
      setMissions((m ?? []).map(fromDB_mission));
      setSales((s ?? []).map(fromDB_sale));
      setLoading(false);
    });
  }, [user]);

  const addMission = useCallback(async (data) => {
    const row = { user_id: user.id, name: data.name, default_rate: data.defaultRate, status: data.status ?? 'active', notes: data.notes ?? '' };
    const { data: inserted, error } = await supabase.from('missions').insert(row).select().single();
    if (error) { console.error(error); return; }
    setMissions((prev) => [...prev, fromDB_mission(inserted)]);
  }, [user]);

  const updateMission = useCallback(async (id, patch) => {
    const row = toDB_mission_patch(patch);
    const { error } = await supabase.from('missions').update(row).eq('id', id);
    if (error) { console.error(error); return; }
    setMissions((prev) => prev.map((m) => m.id === id ? { ...m, ...patch } : m));
  }, []);

  const deleteMission = useCallback(async (id) => {
    const { error } = await supabase.from('missions').delete().eq('id', id);
    if (error) { console.error(error); return; }
    setMissions((prev) => prev.filter((m) => m.id !== id));
    setSales((prev) => prev.filter((s) => s.missionId !== id));
  }, []);

  const addSale = useCallback(async (data) => {
    const row = { user_id: user.id, mission_id: data.missionId, client: data.client, amount: data.amount, rate: data.rate, installments: data.installments, sale_month: data.saleMonth };
    const { data: inserted, error } = await supabase.from('sales').insert(row).select().single();
    if (error) { console.error(error); return; }
    setSales((prev) => [fromDB_sale(inserted), ...prev]);
  }, [user]);

  const updateSale = useCallback(async (id, patch) => {
    const row = toDB_sale_patch(patch);
    const { error } = await supabase.from('sales').update(row).eq('id', id);
    if (error) { console.error(error); return; }
    setSales((prev) => prev.map((s) => s.id === id ? { ...s, ...patch } : s));
  }, []);

  const deleteSale = useCallback(async (id) => {
    const { error } = await supabase.from('sales').delete().eq('id', id);
    if (error) { console.error(error); return; }
    setSales((prev) => prev.filter((s) => s.id !== id));
  }, []);

  return { missions, sales, loading, addMission, updateMission, deleteMission, addSale, updateSale, deleteSale };
}

function fromDB_mission(row) {
  return { id: row.id, name: row.name, defaultRate: Number(row.default_rate), status: row.status, notes: row.notes ?? '', createdAt: row.created_at };
}

function fromDB_sale(row) {
  return { id: row.id, missionId: row.mission_id, client: row.client, amount: Number(row.amount), rate: Number(row.rate), installments: row.installments, saleMonth: row.sale_month, createdAt: row.created_at };
}

function toDB_mission_patch(patch) {
  const row = {};
  if (patch.name !== undefined) row.name = patch.name;
  if (patch.defaultRate !== undefined) row.default_rate = patch.defaultRate;
  if (patch.status !== undefined) row.status = patch.status;
  if (patch.notes !== undefined) row.notes = patch.notes;
  return row;
}

function toDB_sale_patch(patch) {
  const row = {};
  if (patch.client !== undefined) row.client = patch.client;
  if (patch.amount !== undefined) row.amount = patch.amount;
  if (patch.rate !== undefined) row.rate = patch.rate;
  if (patch.installments !== undefined) row.installments = patch.installments;
  if (patch.saleMonth !== undefined) row.sale_month = patch.saleMonth;
  return row;
}
