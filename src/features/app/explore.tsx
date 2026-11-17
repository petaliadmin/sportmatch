"use client";
import { List, Map as MapIcon, Search, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { MobileHeader } from "@/components/shells/mobile-shell";
import { Button, CardSkeleton, Chip, Drawer, EmptyState, ErrorState, Field, Segmented, Switch } from "@/components/ui";
import { DakarMap } from "@/components/visual/dakar-map";
import { SportVisual } from "@/components/visual/sport-visual";
import { venues } from "@/data/venues";
import { useRouter } from "@/lib/router";
import { mockRequest } from "@/lib/store";
import { cn, fcfa } from "@/lib/utils";
import { SPORTS, sportLabel, VenueRow } from "./shared";

type Sort = "distance" | "price" | "rating";

export function Explore() {
  const { navigate } = useRouter();
  const [view, setView] = useState<"map" | "list">("map");
  const [q, setQ] = useState("");
  const [sport, setSport] = useState<string | null>(null);
  const [maxPrice, setMaxPrice] = useState(100000);
  const [maxDist, setMaxDist] = useState(10);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sort, setSort] = useState<Sort>("distance");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selected, setSelected] = useState<string>("v1");
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  const load = () => {
    setState("loading");
    mockRequest(true, { delay: 600 }).then(() => setState("ready")).catch(() => setState("error"));
  };
  useEffect(load, []);

  const list = useMemo(() => {
    const r = venues.filter(
      (v) =>
        (!sport || v.sports.includes(sport as never)) &&
        v.pricePerHour <= maxPrice &&
        v.distanceKm <= maxDist &&
        (!verifiedOnly || v.verified) &&
        (!q || `${v.name} ${v.district} ${v.kind}`.toLowerCase().includes(q.toLowerCase())),
    );
    return r.sort((a, b) => (sort === "distance" ? a.distanceKm - b.distanceKm : sort === "price" ? a.pricePerHour - b.pricePerHour : b.rating - a.rating));
  }, [q, sport, maxPrice, maxDist, verifiedOnly, sort]);
  const sel = list.find((v) => v.id === selected) ?? list[0];
  const activeFilters = (maxPrice < 100000 ? 1 : 0) + (maxDist < 10 ? 1 : 0) + (verifiedOnly ? 1 : 0);

  return (
    <div className="flex min-h-full flex-col">
      <div className="sticky top-0 z-20 space-y-3 border-b border-border bg-bg/95 px-4 pb-3 pt-4 backdrop-blur">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Terrain, quartier…" aria-label="Rechercher un terrain" className="h-11 w-full rounded-lg border border-border bg-surface pl-9 pr-8 text-sm placeholder:text-muted focus:border-primary focus:outline-none" />
            {q && <button aria-label="Effacer" onClick={() => setQ("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted"><X className="h-4 w-4" /></button>}
          </div>
          <button aria-label="Filtres" onClick={() => setFiltersOpen(true)} className="relative flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-surface">
            <SlidersHorizontal className="h-4 w-4" />
            {activeFilters > 0 && <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-fg">{activeFilters}</span>}
          </button>
        </div>
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
          <Chip active={!sport} onClick={() => setSport(null)}>Tous</Chip>
          {SPORTS.slice(0, 6).map((s) => <Chip key={s.key} active={sport === s.key} onClick={() => setSport(sport === s.key ? null : s.key)}>{s.emoji} {s.label}</Chip>)}
        </div>
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted"><span className="tabular font-semibold text-fg">{list.length}</span> infrastructures · Dakar</p>
          <Segmented size="sm" value={view} onChange={setView} options={[{ value: "map", label: <span className="flex items-center gap-1"><MapIcon className="h-3.5 w-3.5" />Carte</span> }, { value: "list", label: <span className="flex items-center gap-1"><List className="h-3.5 w-3.5" />Liste</span> }]} />
        </div>
      </div>

      {state === "loading" && <div className="p-4"><CardSkeleton rows={4} /></div>}
      {state === "error" && <div className="p-4"><ErrorState onRetry={load} /></div>}
      {state === "ready" && list.length === 0 && (
        <div className="p-4">
          <EmptyState title="Aucun terrain ne correspond" description="Élargis la distance ou retire un filtre." action={<Button size="sm" variant="outline" onClick={() => { setSport(null); setQ(""); setMaxPrice(100000); setMaxDist(10); setVerifiedOnly(false); }}>Réinitialiser les filtres</Button>} />
        </div>
      )}

      {state === "ready" && list.length > 0 && view === "map" && (
        <div className="relative flex-1">
          <DakarMap className="h-[460px]" selectedId={sel?.id} onSelect={setSelected} points={list.map((v) => ({ id: v.id, x: v.map.x, y: v.map.y, label: v.name, price: `${(v.pricePerHour / 1000).toFixed(0)}k` }))} />
          {sel && (
            <div className="absolute inset-x-3 bottom-3 animate-fade-up">
              <button onClick={() => navigate("app-venue", { id: sel.id })} className="flex w-full gap-3 rounded-lg border border-border bg-surface p-2.5 text-left shadow-pop">
                <SportVisual sport={sel.sports[0]} seed={Number(sel.id.slice(1))} className="h-[72px] w-[72px] shrink-0 rounded-md" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{sel.name}</p>
                  <p className="truncate text-xs text-muted">{sel.kind} · {sel.district} · {sel.distanceKm} km · ★ {sel.rating}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="tabular text-sm font-bold">{fcfa(sel.pricePerHour)}<span className="text-2xs font-normal text-muted">/h</span></span>
                    <span className="rounded-md bg-primary px-2.5 py-1 text-xs font-bold text-primary-fg">Voir les créneaux</span>
                  </div>
                </div>
              </button>
            </div>
          )}
        </div>
      )}

      {state === "ready" && list.length > 0 && view === "list" && (
        <div className="space-y-2.5 p-4">
          {list.map((v) => <VenueRow key={v.id} v={v} onClick={() => navigate("app-venue", { id: v.id })} />)}
          <Button variant="ghost" block onClick={() => navigate("app-catalog")}>Voir le catalogue complet des infrastructures</Button>
        </div>
      )}

      <Drawer
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title="Filtres"
        footer={<div className="flex gap-2"><Button variant="outline" onClick={() => { setMaxPrice(100000); setMaxDist(10); setVerifiedOnly(false); }}>Réinitialiser</Button><Button block onClick={() => setFiltersOpen(false)}>Afficher {list.length} résultats</Button></div>}
      >
        <div className="space-y-6">
          <Field label={`Prix max : ${fcfa(maxPrice)} / h`}><input type="range" min={5000} max={100000} step={5000} value={maxPrice} onChange={(e) => setMaxPrice(+e.target.value)} className="w-full accent-[rgb(var(--primary))]" /></Field>
          <Field label={`Distance max : ${maxDist} km`}><input type="range" min={1} max={10} value={maxDist} onChange={(e) => setMaxDist(+e.target.value)} className="w-full accent-[rgb(var(--primary))]" /></Field>
          <div className="flex items-center justify-between"><span className="text-sm font-semibold">Établissements vérifiés uniquement</span><Switch label="Vérifiés uniquement" checked={verifiedOnly} onChange={setVerifiedOnly} /></div>
          <Field label="Trier par">
            <Segmented value={sort} onChange={setSort} options={[{ value: "distance", label: "Distance" }, { value: "price", label: "Prix" }, { value: "rating", label: "Note" }]} />
          </Field>
        </div>
      </Drawer>
    </div>
  );
}

export function Catalog() {
  const { navigate, back } = useRouter();
  const kinds = Array.from(new Set(venues.map((v) => v.kind)));
  const [kind, setKind] = useState<string | null>(null);
  return (
    <div>
      <MobileHeader title="Infrastructures sportives" onBack={back} />
      <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 py-3">
        <Chip active={!kind} onClick={() => setKind(null)}>Toutes</Chip>
        {kinds.map((k) => <Chip key={k} active={kind === k} onClick={() => setKind(k)}>{k}</Chip>)}
      </div>
      <div className="grid grid-cols-2 gap-3 px-4 pb-6">
        {venues.filter((v) => !kind || v.kind === kind).map((v) => (
          <button key={v.id} onClick={() => navigate("app-venue", { id: v.id })} className="overflow-hidden rounded-lg border border-border bg-surface text-left transition hover:border-muted">
            <SportVisual sport={v.sports[0]} seed={Number(v.id.slice(1))} className="h-24" />
            <div className="p-2.5">
              <p className="truncate text-sm font-semibold">{v.name}</p>
              <p className="truncate text-2xs text-muted">{v.district} · {v.sports.map(sportLabel).join(", ")}</p>
              <p className={cn("tabular mt-1.5 text-sm font-bold")}>{fcfa(v.pricePerHour)}<span className="text-2xs font-normal text-muted">/h</span></p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
