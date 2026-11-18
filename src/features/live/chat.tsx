"use client";
import { MessageCircle, Send, Wifi, WifiOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Badge, Button, Card, CardSkeleton, EmptyState, ErrorState, Input } from "@/components/ui";
import { useSession } from "@/lib/api/auth";
import type { ApiChatMessage } from "@/lib/api/client";
import { wsUrl } from "@/lib/api/config";
import { cn } from "@/lib/utils";
import { hour, useAction, useApi, useResource, when } from "./hooks";

export function ChatPanel({ focusMatchId }: { focusMatchId?: string | null }) {
  const client = useApi();
  const conversations = useResource(() => client.conversations(), [client]);
  const [selected, setSelected] = useState<string | null>(null);

  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    if (!conversations.data) return;
    const focused = focusMatchId ? conversations.data.find((c) => c.matchId === focusMatchId) : undefined;
    // La conversation d'un match tout juste créé arrive via Kafka : on réessaie quelques secondes.
    if (focusMatchId && !focused && attempts < 10) {
      const t = setTimeout(() => { setAttempts((a) => a + 1); conversations.reload(); }, 1500);
      return () => clearTimeout(t);
    }
    if (conversations.data.length) setSelected((s) => (focused ? focused.id : s ?? conversations.data![0].id));
  }, [conversations.data, focusMatchId, attempts, conversations.reload]);

  if (conversations.loading && !conversations.data) return <CardSkeleton rows={3} />;
  if (conversations.error) return <ErrorState description={conversations.error} onRetry={conversations.reload} />;
  if (!conversations.data?.length)
    return <EmptyState icon={<MessageCircle />} title="Pas encore de conversation" description="Crée ou rejoins un match : sa conversation apparaît ici en quelques secondes." action={<Button size="sm" variant="outline" onClick={conversations.reload}>Actualiser</Button>} />;

  return (
    <div className="grid gap-4 md:grid-cols-[240px_1fr]">
      <div className="space-y-2">
        {conversations.data.map((c) => (
          <button key={c.id} onClick={() => setSelected(c.id)} className={cn("w-full rounded-lg border p-3 text-left text-sm", selected === c.id ? "border-primary bg-primary/5" : "border-border")}>
            <p className="font-semibold">Match · {c.members} joueur{c.members > 1 ? "s" : ""}</p>
            <p className="truncate text-muted">{c.lastMessage ?? "Aucun message"}</p>
            {c.lastMessageAt && <p className="text-2xs text-muted">{when(c.lastMessageAt)}</p>}
          </button>
        ))}
      </div>
      {selected && <Conversation key={selected} id={selected} onSent={conversations.reload} />}
    </div>
  );
}

function Conversation({ id, onSent }: { id: string; onSent: () => void }) {
  const client = useApi();
  const { user, token } = useSession();
  const { busy, run } = useAction();
  const history = useResource(() => client.messages(id), [id, client]);
  const [messages, setMessages] = useState<ApiChatMessage[]>([]);
  const [live, setLive] = useState(false);
  const [text, setText] = useState("");
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => { if (history.data) setMessages(history.data); }, [history.data]);
  useEffect(() => { bottom.current?.scrollIntoView({ block: "end" }); }, [messages.length]);

  // Réception temps réel : WebSocket via la gateway (jeton en paramètre, les navigateurs ne posent pas d'en-tête).
  useEffect(() => {
    let socket: WebSocket | null = null;
    let closed = false;
    (async () => {
      const t = await token();
      if (!t || closed) return;
      socket = new WebSocket(wsUrl(`/api/v1/chat/ws?conversationId=${id}&access_token=${encodeURIComponent(t)}`));
      socket.onopen = () => setLive(true);
      socket.onclose = () => setLive(false);
      socket.onmessage = (e) => {
        const m = JSON.parse(e.data) as ApiChatMessage;
        setMessages((prev) => (prev.some((p) => p.id === m.id) ? prev : [...prev, m]));
      };
    })();
    return () => { closed = true; socket?.close(); };
  }, [id, token]);

  const send = async () => {
    const body = text.trim();
    if (!body) return;
    const m = await run("send", () => client.send(id, body));
    if (m) {
      setText("");
      setMessages((prev) => (prev.some((p) => p.id === m.id) ? prev : [...prev, m]));
      onSent();
    }
  };

  return (
    <Card className="flex h-[480px] flex-col">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <p className="font-semibold">Conversation du match</p>
        <Badge tone={live ? "success" : "neutral"}>{live ? <><Wifi /> Temps réel</> : <><WifiOff /> Hors ligne</>}</Badge>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto p-4">
        {history.loading ? <CardSkeleton rows={2} /> : history.error ? <ErrorState description={history.error} onRetry={history.reload} /> :
          messages.length === 0 ? <p className="text-center text-sm text-muted">Lance la discussion : lieu de rendez-vous, couleurs des maillots…</p> :
            messages.map((m) => {
              const mine = m.senderId === user?.id;
              return (
                <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                  <div className={cn("max-w-[75%] rounded-lg px-3 py-2 text-sm", mine ? "bg-primary text-primary-fg" : "bg-surface-2")}>
                    {!mine && <p className="text-2xs font-semibold opacity-70">{m.senderName ?? "Joueur·se"}</p>}
                    <p>{m.body}</p>
                    <p className="mt-0.5 text-right text-2xs opacity-60">{hour(m.sentAt)}</p>
                  </div>
                </div>
              );
            })}
        <div ref={bottom} />
      </div>
      <form className="flex gap-2 border-t border-border p-3" onSubmit={(e) => { e.preventDefault(); send(); }}>
        <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Écrire un message…" maxLength={1000} aria-label="Message" />
        <Button type="submit" size="icon" loading={busy === "send"} aria-label="Envoyer"><Send className="h-4 w-4" /></Button>
      </form>
    </Card>
  );
}
