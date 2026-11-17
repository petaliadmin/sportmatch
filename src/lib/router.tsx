"use client";
import { createContext, useCallback, useContext, useEffect, useState } from "react";

/**
 * Minimal client router for the static prototype.
 * - Route names are flat ASCII slugs (e.g. "app-venue") so they survive the
 *   artifact sandbox, which only forwards a plain `#name` hash.
 * - Params (ids) live in memory. In the production Next.js app each route name
 *   maps 1:1 to an App Router segment (see AI_CONTEXT.md).
 */
export type Params = Record<string, string>;
interface RouterCtx {
  route: string;
  params: Params;
  navigate: (route: string, params?: Params) => void;
  back: () => void;
}
const Ctx = createContext<RouterCtx | null>(null);

export function RouterProvider({ initial = "hub", children }: { initial?: string; children: React.ReactNode }) {
  const [stack, setStack] = useState<{ route: string; params: Params }[]>([{ route: initial, params: {} }]);
  const current = stack[stack.length - 1];

  useEffect(() => {
    const read = () => {
      try {
        const h = window.location.hash.replace(/^#/, "");
        if (h && /^[a-z0-9-]+$/.test(h)) setStack((s) => (s[s.length - 1].route === h ? s : [...s, { route: h, params: {} }]));
      } catch {}
    };
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, []);

  const navigate = useCallback((route: string, params: Params = {}) => {
    setStack((s) => [...s.slice(-30), { route, params }]);
    try {
      if (window.location.hash !== `#${route}`) history.replaceState(null, "", `#${route}`);
    } catch {}
    try {
      document.querySelectorAll("[data-scroll-root]").forEach((el) => (el.scrollTop = 0));
      window.scrollTo({ top: 0 });
    } catch {}
  }, []);

  const back = useCallback(() => {
    setStack((s) => {
      const next = s.length > 1 ? s.slice(0, -1) : s;
      try { history.replaceState(null, "", `#${next[next.length - 1].route}`); } catch {}
      return next;
    });
  }, []);

  return <Ctx.Provider value={{ route: current.route, params: current.params, navigate, back }}>{children}</Ctx.Provider>;
}

export function useRouter() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useRouter outside RouterProvider");
  return c;
}
