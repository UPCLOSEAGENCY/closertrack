import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase.js';
import { useAuth } from '../contexts/AuthContext.jsx';

export function useInstallmentStatuses(saleIds) {
  const { user } = useAuth();
  const [statuses, setStatuses] = useState({});

  useEffect(() => {
    if (!user || !saleIds?.length) return;
    supabase.from('installment_statuses')
      .select('*')
      .eq('user_id', user.id)
      .in('sale_id', saleIds)
      .then(({ data }) => {
        const map = {};
        for (const row of data ?? []) {
          if (!map[row.sale_id]) map[row.sale_id] = {};
          map[row.sale_id][row.installment_index] = row.status;
        }
        setStatuses(map);
      });
  }, [user, saleIds?.join(',')]);

  const setStatus = useCallback(async (saleId, index, status) => {
    await supabase.from('installment_statuses').upsert({
      user_id: user.id,
      sale_id: saleId,
      installment_index: index,
      status,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'sale_id,installment_index' });
    setStatuses((prev) => ({
      ...prev,
      [saleId]: { ...(prev[saleId] ?? {}), [index]: status },
    }));
  }, [user]);

  const getStatus = useCallback((saleId, index) => {
    return statuses[saleId]?.[index] ?? 'pending';
  }, [statuses]);

  return { getStatus, setStatus };
}
