import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';
import type { DashboardData } from '../types/db';

export function useDashboardData(enabled: boolean) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const timer = useRef<number | undefined>(undefined);
  const alive = useRef(true);
  const lastTick = useRef(0);

  const load = useCallback(async () => {
    try {
      const d = await api.data();
      if (!alive.current) return null;
      setData(d);
      setError(null);
      return d;
    } catch (e: any) {
      if (alive.current) setError(e?.message || 'تعذّر جلب البيانات');
      return null;
    } finally {
      if (alive.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    alive.current = true;
    if (!enabled) return;
    const tick = async () => {
      const d = await load();
      const running = d?.jobs.some((j) => j.status === 'running');
      // The cron advances jobs every minute; this just makes progress feel faster while someone is watching.
      if (running && !document.hidden && Date.now() - lastTick.current > 15000) {
        lastTick.current = Date.now();
        api.tick().catch(() => {});
      }
      timer.current = window.setTimeout(tick, document.hidden ? 30000 : running ? 3000 : 12000);
    };
    tick();
    return () => {
      alive.current = false;
      window.clearTimeout(timer.current);
    };
  }, [enabled, load]);

  return { data, error, loading, refresh: load };
}
