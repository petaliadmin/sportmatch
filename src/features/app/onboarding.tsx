"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Check, Lock, Mail, Phone, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Logo } from "@/components/shells/brand";
import { Button, Field, Input, Segmented, Select } from "@/components/ui";
import { SportVisual } from "@/components/visual/sport-visual";
import { useRouter } from "@/lib/router";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { SPORTS } from "./shared";

export function Splash() {
  const { navigate } = useRouter();
  useEffect(() => {
    const t = setTimeout(() => navigate("app-onboarding"), 1600);
    return () => clearTimeout(t);
  }, [navigate]);
  return (
    <button onClick={() => navigate("app-onboarding")} className="relative flex h-full min-h-[100dvh] w-full flex-col items-center justify-center bg-[#101A17] text-white lg:min-h-full">
      <div className="absolute inset-0 opacity-[.07]" style={{ backgroundImage: "repeating-linear-gradient(90deg,#B7F34A 0 2px,transparent 2px 56px)" }} />
      <div className="animate-fade-up text-center">
        <Logo className="scale-150" compact />
        <p className="mt-8 font-display text-3xl font-extrabold tracking-tight">SPORT<span className="text-[#B7F34A]">MATCH</span></p>
        <p className="mt-2 text-sm text-white/60">Find your game. Book your sport.</p>
      </div>
      <div className="absolute bottom-14 h-1 w-24 overflow-hidden rounded-full bg-white/10"><div className="h-full w-1/2 animate-[shimmer_1.2s_infinite] bg-[#B7F34A]" /></div>
    </button>
  );
}

const slides = [
  { sport: "football" as const, title: "Trouve un match en 30 secondes", text: "Des matchs près de chez toi, à ton niveau, à l’heure qui t’arrange." },
  { sport: "padel" as const, title: "Réserve ton terrain en 3 clics", text: "Créneaux en temps réel, paiement partagé entre joueurs." },
  { sport: "basketball" as const, title: "Ne joue plus jamais à 8 contre 10", text: "Smart Fill complète ton équipe avec des joueurs fiables et compatibles." },
];

export function Onboarding() {
  const { navigate } = useRouter();
  const [i, setI] = useState(0);
  const s = slides[i];
  return (
    <div className="flex min-h-full flex-col">
      <div className="relative">
        <SportVisual sport={s.sport} seed={i + 2} className="h-[380px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-bg" />
        <button onClick={() => navigate("app-auth")} className="absolute right-4 top-4 rounded-full bg-black/40 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur">Passer</button>
      </div>
      <div className="flex flex-1 flex-col px-6 pb-8">
        <div className="mb-5 flex gap-1.5">{slides.map((_, k) => <span key={k} className={cn("h-1.5 rounded-full transition-all", k === i ? "w-8 bg-primary" : "w-1.5 bg-border")} />)}</div>
        <h1 key={s.title} className="animate-fade-up font-display text-[28px] font-extrabold leading-tight tracking-tight">{s.title}</h1>
        <p className="mt-3 text-muted">{s.text}</p>
        <div className="mt-auto pt-8">
          <Button block size="lg" onClick={() => (i < slides.length - 1 ? setI(i + 1) : navigate("app-auth"))}>
            {i < slides.length - 1 ? "Continuer" : "Commencer"} <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

const signupSchema = z.object({
  name: z.string().min(2, "Ton nom doit contenir au moins 2 caractères"),
  phone: z.string().regex(/^(\+221)?\s?7[05678]\s?\d{3}\s?\d{2}\s?\d{2}$/, "Numéro sénégalais attendu, ex. 77 123 45 67"),
  email: z.string().email("Adresse e-mail invalide").or(z.literal("")),
  password: z.string().min(8, "8 caractères minimum"),
});
type SignupForm = z.infer<typeof signupSchema>;

export function Auth() {
  const { navigate } = useRouter();
  const { toast } = useStore();
  const [mode, setMode] = useState<"signup" | "login">("signup");
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: "Moussa Diop", phone: "77 123 45 67", email: "", password: "" },
  });
  const onSubmit = async () => {
    await new Promise((r) => setTimeout(r, 700));
    toast({ title: mode === "signup" ? "Compte créé (simulation)" : "Connexion réussie (simulation)" });
    navigate(mode === "signup" ? "app-sports" : "app-home");
  };
  return (
    <div className="flex min-h-full flex-col px-6 pb-8 pt-10">
      <Logo />
      <h1 className="mt-8 font-display text-[26px] font-extrabold tracking-tight">{mode === "signup" ? "Crée ton compte" : "Content de te revoir"}</h1>
      <p className="mt-1 text-sm text-muted">Rejoins la communauté sportive de Dakar.</p>
      <Segmented className="mt-6 w-full [&>button]:flex-1" value={mode} onChange={setMode} options={[{ value: "signup", label: "Inscription" }, { value: "login", label: "Connexion" }]} />
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 space-y-4">
        {mode === "signup" && (
          <Field label="Nom complet" error={errors.name?.message}>
            <Input icon={<UserRound />} aria-invalid={!!errors.name} {...register("name")} />
          </Field>
        )}
        <Field label="Téléphone" error={errors.phone?.message} hint="Un code de vérification sera envoyé (simulé).">
          <Input icon={<Phone />} inputMode="tel" aria-invalid={!!errors.phone} {...register("phone")} />
        </Field>
        {mode === "signup" && (
          <Field label="E-mail (optionnel)" error={errors.email?.message}>
            <Input icon={<Mail />} type="email" aria-invalid={!!errors.email} {...register("email")} />
          </Field>
        )}
        <Field label="Mot de passe" error={errors.password?.message}>
          <Input icon={<Lock />} type="password" placeholder="8 caractères minimum" aria-invalid={!!errors.password} {...register("password")} />
        </Field>
        <Button type="submit" block size="lg" loading={isSubmitting}>{mode === "signup" ? "Créer mon compte" : "Se connecter"}</Button>
      </form>
      <div className="my-6 flex items-center gap-3 text-xs text-muted"><span className="h-px flex-1 bg-border" />ou<span className="h-px flex-1 bg-border" /></div>
      <div className="grid grid-cols-2 gap-3">
        <Button variant="outline" onClick={() => { toast({ title: "Connexion Google simulée" }); navigate("app-sports"); }}>Google</Button>
        <Button variant="outline" onClick={() => { toast({ title: "Connexion Apple simulée" }); navigate("app-sports"); }}>Apple</Button>
      </div>
      <p className="mt-auto pt-6 text-center text-2xs text-muted">En continuant, tu acceptes les conditions d’utilisation et la politique de confidentialité (démo).</p>
    </div>
  );
}

export function SportsPick() {
  const { navigate } = useRouter();
  const { favoriteSports, setFavoriteSports } = useStore();
  const toggle = (k: string) => setFavoriteSports(favoriteSports.includes(k) ? favoriteSports.filter((x) => x !== k) : [...favoriteSports, k]);
  return (
    <div className="flex min-h-full flex-col px-6 pb-8 pt-10">
      <p className="text-xs font-bold uppercase tracking-widest text-primary-ink">Étape 1 / 2</p>
      <h1 className="mt-2 font-display text-[26px] font-extrabold tracking-tight">Quels sports pratiques-tu ?</h1>
      <p className="mt-1 text-sm text-muted">Choisis-en au moins un. Tu pourras modifier plus tard.</p>
      <div className="mt-6 grid grid-cols-2 gap-3">
        {SPORTS.map((s) => {
          const on = favoriteSports.includes(s.key);
          return (
            <button key={s.key} aria-pressed={on} onClick={() => toggle(s.key)} className={cn("relative flex h-24 flex-col justify-between rounded-lg border p-3 text-left transition", on ? "border-primary bg-primary/10" : "border-border bg-surface hover:border-muted")}>
              <span className="text-2xl">{s.emoji}</span>
              <span className="font-semibold">{s.label}</span>
              {on && <span className="absolute right-2.5 top-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-fg"><Check className="h-3 w-3" /></span>}
            </button>
          );
        })}
      </div>
      <div className="mt-auto pt-8">
        <Button block size="lg" disabled={!favoriteSports.length} onClick={() => navigate("app-profile-setup")}>Continuer ({favoriteSports.length})</Button>
      </div>
    </div>
  );
}

export function ProfileSetup() {
  const { navigate } = useRouter();
  const { setOnboarded, toast } = useStore();
  const [level, setLevel] = useState("Confirmé");
  const [radius, setRadius] = useState(5);
  const [slots, setSlots] = useState<string[]>(["Soir"]);
  return (
    <div className="flex min-h-full flex-col px-6 pb-8 pt-10">
      <p className="text-xs font-bold uppercase tracking-widest text-primary-ink">Étape 2 / 2</p>
      <h1 className="mt-2 font-display text-[26px] font-extrabold tracking-tight">Ton profil sportif</h1>
      <p className="mt-1 text-sm text-muted">Il sert à te proposer des matchs et des joueurs compatibles.</p>
      <div className="mt-6 space-y-5">
        <Field label="Niveau général">
          <div className="grid grid-cols-2 gap-2">
            {["Débutant", "Intermédiaire", "Confirmé", "Expert"].map((l) => (
              <button key={l} onClick={() => setLevel(l)} aria-pressed={level === l} className={cn("rounded-md border px-3 py-2.5 text-sm font-semibold", level === l ? "border-primary bg-primary/10" : "border-border bg-surface")}>{l}</button>
            ))}
          </div>
        </Field>
        <Field label="Poste préféré (football)"><Select defaultValue="Milieu">{["Gardien", "Défenseur", "Milieu", "Attaquant", "Polyvalent"].map((p) => <option key={p}>{p}</option>)}</Select></Field>
        <Field label="Quartier"><Select defaultValue="Mermoz">{["Almadies", "Mermoz", "Ouakam", "Point E", "Plateau", "Liberté 6", "Yoff", "Ngor", "Sacré-Cœur"].map((p) => <option key={p}>{p}</option>)}</Select></Field>
        <Field label={`Distance maximale : ${radius} km`}>
          <input type="range" min={1} max={20} value={radius} onChange={(e) => setRadius(+e.target.value)} className="w-full accent-[rgb(var(--primary))]" />
        </Field>
        <Field label="Disponibilités habituelles">
          <div className="flex flex-wrap gap-2">
            {["Matin", "Midi", "Après-midi", "Soir", "Week-end"].map((s) => {
              const on = slots.includes(s);
              return <button key={s} aria-pressed={on} onClick={() => setSlots(on ? slots.filter((x) => x !== s) : [...slots, s])} className={cn("rounded-full border px-3.5 py-1.5 text-sm font-medium", on ? "border-primary bg-primary text-primary-fg" : "border-border")}>{s}</button>;
            })}
          </div>
        </Field>
      </div>
      <div className="mt-auto pt-8">
        <Button block size="lg" onClick={() => { setOnboarded(true); toast({ title: "Profil prêt 🎉", body: "On te propose déjà 3 matchs ce soir." }); navigate("app-home"); }}>Terminer</Button>
      </div>
    </div>
  );
}
