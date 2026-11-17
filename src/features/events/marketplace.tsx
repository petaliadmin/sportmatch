"use client";
import { ArrowRight, Check, Clock, FileText, GitCompare, MapPin, Plus, Search, ShoppingCart, Trash2, X } from "lucide-react";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/shells/console-shell";
import { Badge, Button, Card, Chip, EmptyState, Field, Input, Modal, Progress, Rating, Segmented, Select, Stepper, Switch, Tabs, Textarea, Verified } from "@/components/ui";
import { DakarMap } from "@/components/visual/dakar-map";
import { categories, categoryOf, providers } from "@/data/providers";
import type { Provider, ProviderCategory } from "@/data/types";
import { useRouter } from "@/lib/router";
import { cartLineTotal, useStore } from "@/lib/store";
import { cn, fcfa } from "@/lib/utils";

export function ProviderLogo({ p, size = 44 }: { p: Provider; size?: number }) {
  const Icon = categoryOf(p.category).icon;
  return <span className="flex shrink-0 items-center justify-center rounded-lg bg-surface-2 text-primary-ink" style={{ width: size, height: size }}><Icon className="h-5 w-5" /></span>;
}

/** Booking engine: the configuration form adapts to the service type. */
export function ConfigureService({ p, open, onClose }: { p: Provider | null; open: boolean; onClose: () => void }) {
  const { addToCart, event, toast } = useStore();
  const defaults: Record<ProviderCategory, number> = { infrastructures: 8, arbitres: 6, transport: 2, medical: 2, securite: 6, restauration: event.participants, personnel: 4, materiel: 1, media: 1 };
  const [q, setQ] = useState(() => (p ? defaults[p.category] : 1));
  const [days, setDays] = useState(event.durationDays);
  if (!p) return null;
  const cat = p.category;
  const total = p.price * q * days;
  const qtyLabel: Record<ProviderCategory, string> = { infrastructures: "Heures par jour", arbitres: "Nombre de matchs", transport: "Nombre de trajets", medical: "Demi-journées par jour", securite: "Nombre d’agents", restauration: "Nombre de personnes", personnel: "Nombre de personnes", materiel: "Nombre de lots", media: "Prestations" };

  const confirm = () => {
    addToCart(p, q, days);
    toast({ title: `${p.name} ajouté au panier`, body: `${fcfa(total)} · ${days} jour(s)` });
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={`Configurer · ${p.name}`} description={`Réservation : ${categoryOf(cat).booking}`} size="md"
      footer={<><div className="mr-auto"><p className="text-2xs text-muted">Estimation</p><p className="tabular font-display text-lg font-bold">{fcfa(total)}</p></div><Button variant="ghost" onClick={onClose}>Annuler</Button><Button onClick={confirm}><ShoppingCart className="h-4 w-4" />Ajouter au panier</Button></>}>
      <div className="space-y-4">
        {cat === "infrastructures" && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Créneau"><Select><option>08:00 – 16:00</option><option>09:00 – 18:00</option><option>14:00 – 22:00</option></Select></Field>
            <Field label="Terrains"><Select><option>2 terrains</option><option>3 terrains</option><option>Complexe entier</option></Select></Field>
          </div>
        )}
        {cat === "transport" && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Départ"><Input defaultValue="Parcelles Assainies" /></Field>
            <Field label="Arrivée"><Input defaultValue="Stade de Yoff" /></Field>
            <Field label="Capacité"><Select><option>15 places</option><option>30 places</option><option>2 × 30 places</option></Select></Field>
            <Field label="Horaire aller"><Input type="time" defaultValue="07:30" /></Field>
          </div>
        )}
        {cat === "arbitres" && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Mission"><Select><option>Arbitre central</option><option>Trio arbitral</option><option>Délégué de match</option></Select></Field>
            <Field label="Qualification"><Select><option>Régionale</option><option>Nationale</option><option>Futsal</option></Select></Field>
            <Field label="Durée par match"><Select><option>2 × 20 min</option><option>2 × 30 min</option><option>2 × 45 min</option></Select></Field>
          </div>
        )}
        {cat === "securite" && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Mission"><Select><option>Contrôle d’accès</option><option>Surveillance générale</option><option>Sécurité VIP</option></Select></Field>
            <Field label="Amplitude"><Select><option>8 h / jour</option><option>12 h / jour</option></Select></Field>
          </div>
        )}
        {cat === "restauration" && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Menu"><Select><option>Thiéboudienne + boisson</option><option>Yassa poulet + boisson</option><option>Box sportive + fruits</option></Select></Field>
            <Field label="Service"><Select><option>Déjeuner</option><option>Déjeuner + collation</option></Select></Field>
          </div>
        )}
        {cat === "medical" && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Couverture"><Select><option>Ambulance + médecin</option><option>Poste de secours</option><option>Secouristes seuls</option></Select></Field>
            <Field label="Horaires"><Select><option>Toute la durée de l’événement</option><option>Matchs uniquement</option></Select></Field>
          </div>
        )}
        {(cat === "personnel" || cat === "materiel" || cat === "media") && (
          <Field label="Précisions"><Textarea placeholder={cat === "media" ? "Photo + vidéo highlights, finale filmée…" : cat === "materiel" ? "40 chasubles, 20 ballons, 2 buts mobiles…" : "Ramasseurs de balles, accueil, billetterie…"} /></Field>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Card className="flex items-center justify-between p-3"><span className="text-xs font-semibold">{qtyLabel[cat]}</span><Stepper value={q} min={1} max={1000} onChange={setQ} /></Card>
          <Card className="flex items-center justify-between p-3"><span className="text-xs font-semibold">Jours</span><Stepper value={days} min={1} max={10} onChange={setDays} /></Card>
        </div>
        <p className="tabular text-xs text-muted">{fcfa(p.price)} / {p.unit} × {q} × {days} jour(s)</p>
      </div>
    </Modal>
  );
}

export function Marketplace({ initialCategory }: { initialCategory?: ProviderCategory }) {
  const { navigate } = useRouter();
  const { cart } = useStore();
  const [cat, setCat] = useState<ProviderCategory | "all">(initialCategory ?? "all");
  const [q, setQ] = useState("");
  const [verified, setVerified] = useState(false);
  const [maxDist, setMaxDist] = useState(10);
  const [sort, setSort] = useState<"rating" | "price" | "distance">("rating");
  const [view, setView] = useState<"grid" | "map">("grid");
  const [compare, setCompare] = useState<string[]>([]);
  const [config, setConfig] = useState<Provider | null>(null);

  const list = useMemo(() => providers
    .filter((p) => (cat === "all" || p.category === cat) && (!verified || p.verified) && p.distanceKm <= maxDist && (!q || `${p.name} ${p.description} ${p.district}`.toLowerCase().includes(q.toLowerCase())))
    .sort((a, b) => (sort === "rating" ? b.rating - a.rating : sort === "price" ? a.price - b.price : a.distanceKm - b.distanceKm)), [cat, verified, maxDist, q, sort]);
  const inCart = (id: string) => cart.some((c) => c.provider.id === id);

  return (
    <div>
      <PageHeader eyebrow="Service Marketplace" title={initialCategory === "infrastructures" ? "Infrastructures" : "Prestataires"} subtitle={`${providers.length} prestataires fictifs à Dakar · vérification professionnelle, tarifs et disponibilités`} actions={<>
        <Button variant="outline" disabled={compare.length < 2} onClick={() => navigate("events-compare", { ids: compare.join(",") })}><GitCompare className="h-4 w-4" />Comparer ({compare.length})</Button>
        <Button onClick={() => navigate("events-cart")}><ShoppingCart className="h-4 w-4" />Panier · {cart.length}</Button>
      </>} />

      <div className="no-scrollbar -mx-1 mb-4 flex gap-2 overflow-x-auto px-1">
        <Chip active={cat === "all"} onClick={() => setCat("all")}>Tous</Chip>
        {categories.map((c) => <Chip key={c.key} active={cat === c.key} onClick={() => setCat(c.key)} icon={<c.icon />}>{c.label}</Chip>)}
      </div>

      <Card className="mb-5 flex flex-col gap-3 p-3 md:flex-row md:items-center">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un prestataire, un service…" aria-label="Rechercher un prestataire" className="h-10 w-full rounded-md border border-border bg-bg pl-9 pr-3 text-sm placeholder:text-muted focus:border-primary focus:outline-none" /></div>
        <label className="flex items-center gap-2 text-xs text-muted">Rayon {maxDist} km<input type="range" min={1} max={10} value={maxDist} onChange={(e) => setMaxDist(+e.target.value)} className="w-24 accent-[rgb(var(--primary))]" /></label>
        <label className="flex items-center gap-2 text-xs font-semibold"><Switch label="Vérifiés" checked={verified} onChange={setVerified} />Vérifiés</label>
        <Select value={sort} onChange={(e) => setSort(e.target.value as "rating")} className="h-10 w-40" aria-label="Trier"><option value="rating">Mieux notés</option><option value="price">Prix croissant</option><option value="distance">Plus proches</option></Select>
        <Segmented size="sm" value={view} onChange={setView} options={[{ value: "grid", label: "Grille" }, { value: "map", label: "Carte" }]} />
      </Card>

      {list.length === 0 ? <EmptyState title="Aucun prestataire" description="Élargis le rayon ou retire le filtre « vérifiés »." /> : view === "map" ? (
        <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
          <DakarMap className="h-[520px] rounded-lg border border-border" showUser={false} points={list.map((p, i) => ({ id: p.id, x: 15 + ((i * 37) % 70), y: 20 + ((i * 23) % 65), label: p.name, price: categoryOf(p.category).label.split(" ")[0] }))} onSelect={(id) => setConfig(providers.find((p) => p.id === id) ?? null)} />
          <div className="scroll-thin max-h-[520px] space-y-2 overflow-auto">{list.map((p) => <Card key={p.id} className="flex items-center gap-3 p-3"><ProviderLogo p={p} size={36} /><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{p.name}</p><p className="text-xs text-muted">{p.district} · {fcfa(p.price)}/{p.unit}</p></div><Button size="sm" variant="secondary" onClick={() => setConfig(p)}>Ajouter</Button></Card>)}</div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((p) => (
            <Card key={p.id} className="flex flex-col p-4">
              <div className="flex items-start gap-3">
                <ProviderLogo p={p} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{p.name}</p>
                  <p className="text-xs text-muted">{categoryOf(p.category).label}</p>
                  <div className="mt-1 flex items-center gap-2"><Rating value={p.rating} count={p.reviews} />{p.verified && <Verified />}</div>
                </div>
                <label className="flex cursor-pointer items-center gap-1 text-2xs text-muted" title="Comparer">
                  <input type="checkbox" checked={compare.includes(p.id)} onChange={(e) => setCompare(e.target.checked ? [...compare, p.id].slice(-3) : compare.filter((x) => x !== p.id))} className="accent-[rgb(var(--primary))]" />Comparer
                </label>
              </div>
              <p className="mt-3 text-sm text-muted">{p.description}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">{p.highlights.map((h) => <Badge key={h} tone="outline">{h}</Badge>)}</div>
              <div className="mt-3 flex items-center gap-3 text-xs text-muted"><span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{p.district} · {p.distanceKm} km</span><span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />Répond {p.responseTime}</span></div>
              <div className="mt-auto flex items-end justify-between pt-4">
                <div><p className="tabular font-display text-lg font-bold">{fcfa(p.price)}</p><p className="text-2xs text-muted">par {p.unit}</p></div>
                <div className="flex items-center gap-2">
                  <Badge tone={p.availability === "Disponible" ? "success" : p.availability === "Limité" ? "warning" : "error"} dot>{p.availability}</Badge>
                  {inCart(p.id) ? <Button size="sm" variant="secondary" onClick={() => navigate("events-cart")}><Check className="h-3.5 w-3.5" />Au panier</Button> : <Button size="sm" onClick={() => setConfig(p)}><Plus className="h-3.5 w-3.5" />Ajouter</Button>}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      <ConfigureService key={config?.id} p={config} open={!!config} onClose={() => setConfig(null)} />
    </div>
  );
}

export function Compare() {
  const { params, navigate } = useRouter();
  const ids = (params.ids ?? "s7,s8").split(",");
  const items = providers.filter((p) => ids.includes(p.id));
  const [config, setConfig] = useState<Provider | null>(null);
  const best = (f: (p: Provider) => number, dir: 1 | -1) => items.reduce((a, b) => (f(b) * dir > f(a) * dir ? b : a)).id;
  const rows: { l: string; v: (p: Provider) => React.ReactNode; best?: string }[] = [
    { l: "Catégorie", v: (p) => categoryOf(p.category).label },
    { l: "Tarif", v: (p) => <span className="tabular font-semibold">{fcfa(p.price)} / {p.unit}</span>, best: best((p) => p.price, -1) },
    { l: "Note", v: (p) => <Rating value={p.rating} count={p.reviews} />, best: best((p) => p.rating, 1) },
    { l: "Vérifié", v: (p) => (p.verified ? <Verified /> : <span className="text-xs text-muted">Non</span>) },
    { l: "Distance", v: (p) => `${p.distanceKm} km`, best: best((p) => p.distanceKm, -1) },
    { l: "Délai de réponse", v: (p) => p.responseTime },
    { l: "Disponibilité", v: (p) => <Badge tone={p.availability === "Disponible" ? "success" : "warning"} dot>{p.availability}</Badge> },
    { l: "Points forts", v: (p) => <div className="flex flex-wrap gap-1">{p.highlights.map((h) => <Badge key={h} tone="outline">{h}</Badge>)}</div> },
  ];
  return (
    <div>
      <PageHeader eyebrow="Comparaison" title="Comparer les prestataires" subtitle="Le meilleur score de chaque ligne est surligné." actions={<Button variant="outline" onClick={() => navigate("events-marketplace")}>Retour au catalogue</Button>} />
      {items.length < 2 ? <EmptyState title="Sélectionne au moins 2 prestataires" action={<Button onClick={() => navigate("events-marketplace")}>Choisir</Button>} /> : (
        <div className="scroll-thin overflow-x-auto rounded-lg border border-border bg-surface">
          <table className="w-full min-w-[720px] text-sm">
            <thead><tr className="border-b border-border"><th className="w-44 p-4" />{items.map((p) => <th key={p.id} className="p-4 text-left"><div className="flex items-center gap-3"><ProviderLogo p={p} size={36} /><span className="font-semibold">{p.name}</span></div></th>)}</tr></thead>
            <tbody>
              {rows.map((r) => <tr key={r.l} className="border-b border-border last:border-0"><td className="p-4 text-xs font-semibold text-muted">{r.l}</td>{items.map((p) => <td key={p.id} className={cn("p-4", r.best === p.id && "bg-primary/10")}>{r.v(p)}</td>)}</tr>)}
              <tr><td className="p-4" />{items.map((p) => <td key={p.id} className="p-4"><Button size="sm" onClick={() => setConfig(p)}><Plus className="h-3.5 w-3.5" />Ajouter au panier</Button></td>)}</tr>
            </tbody>
          </table>
        </div>
      )}
      <ConfigureService key={config?.id} p={config} open={!!config} onClose={() => setConfig(null)} />
    </div>
  );
}

export function Cart() {
  const { navigate } = useRouter();
  const { cart, updateCart, removeFromCart, event, toast } = useStore();
  const subtotal = cart.reduce((s, c) => s + cartLineTotal(c), 0);
  const fees = Math.round(subtotal * 0.05);
  const total = subtotal + fees;
  const pct = (total / event.budget) * 100;
  const requestQuotes = () => {
    cart.forEach((c, i) => {
      updateCart(c.id, { status: "Devis demandé" });
      setTimeout(() => updateCart(c.id, { status: "Devis reçu" }), 1500 + i * 700);
    });
    toast({ title: `${cart.length} demandes de devis envoyées`, body: "Les prestataires répondent en moyenne sous 3 h (simulé)." });
    navigate("events-quotes");
  };
  return (
    <div>
      <PageHeader eyebrow={event.name} title="Panier de services" subtitle={`${event.participants} participants · ${event.durationDays} jours · ${event.location}`} actions={<Button variant="outline" onClick={() => navigate("events-marketplace")}><Plus className="h-4 w-4" />Ajouter des services</Button>} />
      {cart.length === 0 ? (
        <EmptyState icon={<ShoppingCart />} title="Ton panier est vide" description="Lance l’Event Planner pour une sélection automatique, ou parcours le catalogue." action={<div className="flex gap-2"><Button onClick={() => navigate("events-planner")}>Event Planner</Button><Button variant="outline" onClick={() => navigate("events-marketplace")}>Catalogue</Button></div>} />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-3">
            {cart.map((c) => (
              <Card key={c.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                <ProviderLogo p={c.provider} />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{c.provider.name}</p>
                  <p className="text-xs text-muted">{categoryOf(c.provider.category).label} · {fcfa(c.provider.price)} / {c.provider.unit}</p>
                  <Badge className="mt-1.5" tone={c.status === "Validé" ? "success" : c.status === "Devis reçu" ? "info" : c.status === "Devis demandé" ? "warning" : "neutral"} dot>{c.status}</Badge>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-center"><p className="mb-1 text-2xs text-muted">Quantité</p><Stepper value={c.qty} min={1} max={1000} onChange={(n) => updateCart(c.id, { qty: n })} /></div>
                  <div className="text-center"><p className="mb-1 text-2xs text-muted">Jours</p><Stepper value={c.days} min={1} max={10} onChange={(n) => updateCart(c.id, { days: n })} /></div>
                </div>
                <div className="flex items-center gap-2 sm:w-40 sm:justify-end">
                  <p className="tabular font-display font-bold">{fcfa(cartLineTotal(c))}</p>
                  <button aria-label={`Retirer ${c.provider.name}`} onClick={() => { removeFromCart(c.id); toast({ title: "Service retiré", tone: "info" }); }} className="rounded-md p-2 text-muted hover:bg-error/10 hover:text-error"><Trash2 className="h-4 w-4" /></button>
                </div>
              </Card>
            ))}
          </div>
          <Card className="h-fit space-y-3 p-5 lg:sticky lg:top-24">
            <p className="font-display text-lg font-bold">Budget global</p>
            <div className="space-y-2 text-sm">
              {categories.filter((k) => cart.some((c) => c.provider.category === k.key)).map((k) => (
                <div key={k.key} className="flex justify-between"><span className="text-muted">{k.label}</span><span className="tabular">{fcfa(cart.filter((c) => c.provider.category === k.key).reduce((s, c) => s + cartLineTotal(c), 0))}</span></div>
              ))}
              <div className="flex justify-between"><span className="text-muted">Frais de service (5 %)</span><span className="tabular">{fcfa(fees)}</span></div>
            </div>
            <div className="border-t border-border pt-3"><div className="flex justify-between font-display text-xl font-bold"><span>Total</span><span className="tabular">{fcfa(total)}</span></div></div>
            <div>
              <div className="flex justify-between text-xs"><span className="text-muted">Budget prévu {fcfa(event.budget)}</span><span className={cn("tabular font-semibold", pct > 100 ? "text-error" : "text-success")}>{pct.toFixed(0)} %</span></div>
              <Progress className="mt-1.5" value={Math.min(pct, 100)} tone={pct > 100 ? "error" : pct > 85 ? "warning" : "success"} />
              {pct > 100 && <p className="mt-2 text-xs text-error">Dépassement de {fcfa(total - event.budget)}. Réduis une quantité ou compare les offres.</p>}
            </div>
            <p className="tabular text-xs text-muted">≈ {fcfa(total / event.participants)} par participant</p>
            <Button block onClick={requestQuotes} disabled={cart.every((c) => c.status !== "Brouillon")}><FileText className="h-4 w-4" />Demander les devis</Button>
            <Button block variant="outline" onClick={() => navigate("events-quotes")}>Suivre les devis<ArrowRight className="h-4 w-4" /></Button>
          </Card>
        </div>
      )}
    </div>
  );
}

export function Quotes() {
  const { navigate } = useRouter();
  const { cart, updateCart, toast } = useStore();
  const [tab, setTab] = useState<"all" | "received" | "validated">("all");
  const [view, setView] = useState<string | null>(null);
  const list = cart.filter((c) => tab === "all" || (tab === "received" ? c.status === "Devis reçu" : c.status === "Validé"));
  const viewed = cart.find((c) => c.id === view);
  const quotePrice = (c: (typeof cart)[number]) => Math.round(cartLineTotal(c) * (0.92 + (Number(c.provider.id.slice(1)) % 5) * 0.03));
  return (
    <div>
      <PageHeader eyebrow="Devis & validation" title="Demandes de devis" subtitle="Compare le devis au prix catalogue, puis valide pour bloquer la réservation." actions={<Button variant="outline" onClick={() => navigate("events-cart")}>Retour au panier</Button>} />
      <Tabs className="mb-4" value={tab} onChange={setTab} tabs={[{ value: "all", label: "Toutes", count: cart.length }, { value: "received", label: "À valider", count: cart.filter((c) => c.status === "Devis reçu").length }, { value: "validated", label: "Validées", count: cart.filter((c) => c.status === "Validé").length }]} />
      {list.length === 0 ? <EmptyState icon={<FileText />} title="Aucune demande ici" description="Ajoute des services au panier puis demande les devis." action={<Button onClick={() => navigate("events-marketplace")}>Catalogue</Button>} /> : (
        <div className="space-y-2">
          {list.map((c) => (
            <Card key={c.id} className="flex flex-wrap items-center gap-4 p-4">
              <ProviderLogo p={c.provider} size={40} />
              <div className="min-w-[180px] flex-1"><p className="font-semibold">{c.provider.name}</p><p className="text-xs text-muted">{categoryOf(c.provider.category).label} · réf. DV-{c.id.toUpperCase()}</p></div>
              <div className="text-right"><p className="text-2xs text-muted">Catalogue</p><p className="tabular text-sm">{fcfa(cartLineTotal(c))}</p></div>
              <div className="w-32 text-right"><p className="text-2xs text-muted">Devis</p><p className="tabular font-semibold">{c.status === "Brouillon" || c.status === "Devis demandé" ? "—" : fcfa(quotePrice(c))}</p></div>
              <Badge tone={c.status === "Validé" ? "success" : c.status === "Devis reçu" ? "info" : c.status === "Devis demandé" ? "warning" : "neutral"} dot className={c.status === "Devis demandé" ? "animate-pulse2" : ""}>{c.status}</Badge>
              <div className="flex gap-2">
                {c.status === "Brouillon" && <Button size="sm" variant="secondary" onClick={() => { updateCart(c.id, { status: "Devis demandé" }); setTimeout(() => updateCart(c.id, { status: "Devis reçu" }), 1500); }}>Demander</Button>}
                {c.status === "Devis reçu" && <><Button size="sm" variant="ghost" onClick={() => setView(c.id)}>Voir</Button><Button size="sm" onClick={() => { updateCart(c.id, { status: "Validé" }); toast({ title: "Réservation validée", body: c.provider.name }); }}><Check className="h-3.5 w-3.5" />Valider</Button></>}
                {c.status === "Validé" && <Button size="sm" variant="ghost" onClick={() => navigate("events-payments")}>Payer</Button>}
              </div>
            </Card>
          ))}
        </div>
      )}
      <Modal open={!!viewed} onClose={() => setView(null)} title={`Devis · ${viewed?.provider.name ?? ""}`} description="Document généré automatiquement (fictif)"
        footer={<><Button variant="ghost" onClick={() => { if (viewed) updateCart(viewed.id, { status: "Brouillon" }); setView(null); toast({ title: "Devis refusé", tone: "info" }); }}><X className="h-4 w-4" />Refuser</Button><Button onClick={() => { if (viewed) updateCart(viewed.id, { status: "Validé" }); setView(null); toast({ title: "Devis accepté" }); }}>Accepter le devis</Button></>}>
        {viewed && (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted">Prestation</span><span>{categoryOf(viewed.provider.category).label}</span></div>
            <div className="flex justify-between"><span className="text-muted">Quantité</span><span className="tabular">{viewed.qty} × {viewed.days} j</span></div>
            <div className="flex justify-between"><span className="text-muted">Prix unitaire</span><span className="tabular">{fcfa(viewed.provider.price)}</span></div>
            <div className="flex justify-between"><span className="text-muted">Remise négociée</span><span className="tabular text-success">−{fcfa(cartLineTotal(viewed) - quotePrice(viewed))}</span></div>
            <div className="flex justify-between border-t border-border pt-2 font-bold"><span>Total TTC</span><span className="tabular">{fcfa(quotePrice(viewed))}</span></div>
            <p className="pt-2 text-xs text-muted">Conditions : acompte 30 % à la validation, solde J-2. Annulation gratuite jusqu’à J-7.</p>
          </div>
        )}
      </Modal>
    </div>
  );
}
