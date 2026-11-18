"use client";
import { ShieldCheck, Trophy, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { Button, Card, CardSkeleton, ErrorState, Field, Input, Select } from "@/components/ui";
import { SPORT_LABELS, useAction, useApi, useResource } from "./hooks";

/** Mon profil : préférences déclarées et statistiques (fiabilité tirée des feuilles de présence). */
export function ProfilePanel() {
  const client = useApi();
  const { busy, run } = useAction();
  const profile = useResource(() => client.myProfile(), [client]);
  const [form, setForm] = useState({ displayName: "", favoriteSport: "", level: "", district: "", bio: "" });
  useEffect(() => {
    const p = profile.data;
    if (p) setForm({ displayName: p.displayName, favoriteSport: p.favoriteSport ?? "", level: p.level ?? "", district: p.district ?? "", bio: p.bio ?? "" });
  }, [profile.data]);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm({ ...form, [k]: e.target.value });

  const save = async () => {
    const r = await run("save", () => client.updateProfile(form), "Profil enregistré");
    if (r) profile.setData(r);
  };

  if (profile.loading && !profile.data) return <CardSkeleton rows={2} />;
  if (profile.error) return <ErrorState description={profile.error} onRetry={profile.reload} />;
  const s = profile.data?.stats;
  return (
    <div className="grid gap-4 md:grid-cols-[1fr_2fr]">
      <div className="space-y-3">
        <Stat icon={<Trophy />} label="Matchs joués ou à venir" value={String(s?.matchesJoined ?? 0)} />
        <Stat icon={<UserRound />} label="Matchs organisés" value={String(s?.matchesOrganized ?? 0)} />
        <Stat icon={<ShieldCheck />} label="Fiabilité" value={s?.reliabilityPercent == null ? "Nouveau" : `${s.reliabilityPercent} %`}
          hint={s?.attendanceRated ? `${s.attendanceRated} présence(s) renseignée(s), ${s.noShows} absence(s)` : "Calculée quand un organisateur note ta présence"} />
      </div>
      <Card className="space-y-3 p-4">
        <Field label="Nom affiché"><Input value={form.displayName} maxLength={120} onChange={set("displayName")} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Sport préféré"><Select value={form.favoriteSport} onChange={set("favoriteSport")}>
            <option value="">—</option>{Object.entries(SPORT_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </Select></Field>
          <Field label="Niveau"><Select value={form.level} onChange={set("level")}>
            <option value="">—</option><option value="BEGINNER">Débutant</option><option value="INTERMEDIATE">Intermédiaire</option><option value="ADVANCED">Confirmé</option>
          </Select></Field>
        </div>
        <Field label="Quartier"><Input value={form.district} maxLength={80} placeholder="Mermoz, Ngor, Plateau…" onChange={set("district")} /></Field>
        <Field label="Présentation"><Input value={form.bio} maxLength={280} placeholder="Milieu de terrain, dispo le soir" onChange={set("bio")} /></Field>
        <Button loading={busy === "save"} disabled={!form.displayName.trim()} onClick={save}>Enregistrer</Button>
      </Card>
    </div>
  );
}

function Stat({ icon, label, value, hint }: { icon: React.ReactNode; label: string; value: string; hint?: string }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 text-muted [&_svg]:h-4 [&_svg]:w-4">{icon}<span className="text-xs">{label}</span></div>
      <p className="mt-1 font-display text-2xl font-bold tabular">{value}</p>
      {hint && <p className="text-xs text-muted">{hint}</p>}
    </Card>
  );
}
