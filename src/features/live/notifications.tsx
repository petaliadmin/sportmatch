"use client";
import { Bell } from "lucide-react";
import { useEffect } from "react";
import { Card, CardSkeleton, EmptyState, ErrorState } from "@/components/ui";
import { useApi, useResource, when } from "./hooks";

export function NotificationsPanel() {
  const client = useApi();
  const notifications = useResource(() => client.notifications(), [client]);
  useEffect(() => {
    const t = setInterval(notifications.reload, 10000);
    return () => clearInterval(t);
  }, [notifications.reload]);

  if (notifications.loading && !notifications.data) return <CardSkeleton rows={3} />;
  if (notifications.error) return <ErrorState description={notifications.error} onRetry={notifications.reload} />;
  if (!notifications.data?.length) return <EmptyState icon={<Bell />} title="Rien de neuf" description="Tes notifications de matchs, réservations et tournois arrivent ici." />;
  return (
    <div className="space-y-2">
      {notifications.data.map((n) => (
        <Card key={n.id} className="p-4">
          <div className="flex items-start justify-between gap-3">
            <p className="font-semibold">{n.title}</p>
            <span className="shrink-0 text-xs text-muted">{when(n.createdAt)}</span>
          </div>
          <p className="mt-1 text-sm text-muted">{n.body}</p>
        </Card>
      ))}
    </div>
  );
}
