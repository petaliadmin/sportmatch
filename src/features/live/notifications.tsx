"use client";
import { Bell, CheckCheck } from "lucide-react";
import { useEffect } from "react";
import { Button, Card, CardSkeleton, EmptyState, ErrorState } from "@/components/ui";
import { useAction, useApi, useResource, when } from "./hooks";

/** Notifications in-app : les non lues sont mises en avant ; un clic les marque lues. */
export function NotificationsPanel({ onUnreadChange }: { onUnreadChange?: (n: number) => void }) {
  const client = useApi();
  const { busy, run } = useAction();
  const notifications = useResource(() => client.notifications(), [client]);
  useEffect(() => {
    const t = setInterval(notifications.reload, 10000);
    return () => clearInterval(t);
  }, [notifications.reload]);
  const unread = notifications.data?.filter((n) => !n.readAt).length ?? 0;
  useEffect(() => { onUnreadChange?.(unread); }, [unread, onUnreadChange]);

  const read = async (id: string) => {
    const now = new Date().toISOString();
    notifications.setData((list) => list?.map((n) => (n.id === id ? { ...n, readAt: n.readAt ?? now } : n)) ?? null);
    await client.markRead(id).catch(() => undefined);
  };
  const readAll = async () => {
    if (await run("all", () => client.markAllRead())) notifications.reload();
  };

  if (notifications.loading && !notifications.data) return <CardSkeleton rows={3} />;
  if (notifications.error) return <ErrorState description={notifications.error} onRetry={notifications.reload} />;
  if (!notifications.data?.length) return <EmptyState icon={<Bell />} title="Rien de neuf" description="Tes notifications de matchs, réservations et tournois arrivent ici." />;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">{unread ? `${unread} non lue(s)` : "Tout est lu"}</p>
        {unread > 0 && <Button size="sm" variant="outline" loading={busy === "all"} onClick={readAll}><CheckCheck className="h-3.5 w-3.5" /> Tout marquer lu</Button>}
      </div>
      {notifications.data.map((n) => (
        <Card key={n.id} className={`p-4 ${n.readAt ? "" : "border-primary"}`}>
          <button type="button" className="block w-full text-left" onClick={() => !n.readAt && read(n.id)} aria-label={n.readAt ? n.title : `${n.title} (non lue, marquer comme lue)`}>
            <div className="flex items-start justify-between gap-3">
              <p className="font-semibold">{!n.readAt && <span className="mr-2 inline-block h-2 w-2 rounded-full bg-primary align-middle" aria-hidden />}{n.title}</p>
              <span className="shrink-0 text-xs text-muted">{when(n.createdAt)}</span>
            </div>
            <p className="mt-1 text-sm text-muted">{n.body}</p>
          </button>
        </Card>
      ))}
    </div>
  );
}
