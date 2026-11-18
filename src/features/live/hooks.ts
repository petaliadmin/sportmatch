"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "@/lib/api/auth";
import { ApiError, api } from "@/lib/api/client";
import { useStore } from "@/lib/store";

export function useApi() {
  const { token } = useSession();
  return useMemo(() => api(token), [token]);
}

/** Charge une ressource ; reload() la recharge. */
export function useResource<T>(load: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const loader = useRef(load);
  loader.current = load;
  const reload = useCallback(() => {
    setLoading(true);
    setError(null);
    loader.current()
      .then((d) => setData(d))
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Erreur inattendue"))
      .finally(() => setLoading(false));
  }, []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(reload, deps);
  return { data, error, loading, reload, setData };
}

/** Exécute une action API avec toast d'erreur / de succès. */
export function useAction() {
  const { toast } = useStore();
  const [busy, setBusy] = useState<string | null>(null);
  const run = useCallback(
    async <T,>(key: string, fn: () => Promise<T>, success?: string): Promise<T | null> => {
      setBusy(key);
      try {
        const r = await fn();
        if (success) toast({ title: success, tone: "success" });
        return r;
      } catch (e) {
        toast({ title: "Action impossible", body: e instanceof ApiError || e instanceof Error ? e.message : String(e), tone: "error" });
        return null;
      } finally {
        setBusy(null);
      }
    },
    [toast],
  );
  return { busy, run };
}

const DAKAR = "Africa/Dakar";
export const when = (iso: string) =>
  new Date(iso).toLocaleString("fr-FR", { timeZone: DAKAR, weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
export const hour = (iso: string) => new Date(iso).toLocaleTimeString("fr-FR", { timeZone: DAKAR, hour: "2-digit", minute: "2-digit" });
export const isoDay = (d: Date) => d.toISOString().slice(0, 10);
export const SPORT_LABELS: Record<string, string> = { FOOTBALL: "Football", BASKETBALL: "Basket", TENNIS: "Tennis", PADEL: "Padel" };
export const sportName = (s: string) => SPORT_LABELS[s] ?? s;
