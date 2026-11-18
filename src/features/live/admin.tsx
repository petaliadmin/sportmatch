"use client";
import { Activity, ScrollText } from "lucide-react";
import { useState } from "react";
import { Badge, Card, CardSkeleton, Chip, EmptyState, ErrorState } from "@/components/ui";
import { useApi, useResource, when } from "./hooks";

const KPI_LABELS: Record<string, string> = {
  matchsCrees7j: "Matchs créés", inscriptionsMatch7j: "Inscriptions aux matchs", matchsAnnules7j: "Matchs annulés",
  reservations7j: "Réservations", annulationsReservation7j: "Annulations de réservation",
  tournoisCrees7j: "Tournois créés", equipesInscrites7j: "Équipes inscrites",
};

/** Back-office : activité de la plateforme sur 7 jours et journal des événements (audit). */
export function AdminPanel() {
  const client = useApi();
  const overview = useResource(() => client.adminOverview(), [client]);
  const [type, setType] = useState<string>("");
  const events = useResource(() => client.adminEvents(type || undefined), [client, type]);

  return (
    <div className="space-y-6">
      {overview.loading && !overview.data ? <CardSkeleton rows={2} /> : overview.error ? <ErrorState description={overview.error} onRetry={overview.reload} /> : overview.data && (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {Object.entries(overview.data.kpis).map(([k, v]) => (
              <Card key={k} className="p-4">
                <p className="text-xs text-muted">{KPI_LABELS[k] ?? k} · 7 j</p>
                <p className="mt-1 font-display text-2xl font-bold tabular">{v}</p>
              </Card>
            ))}
          </div>
          <Card className="p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold"><Activity className="h-4 w-4" /> Événements par jour ({overview.data.totalEvents} au total)</div>
            <div className="flex h-28 items-end gap-2">
              {overview.data.last7Days.map((d) => {
                const max = Math.max(1, ...overview.data!.last7Days.map((x) => x.count));
                return (
                  <div key={d.day} className="flex flex-1 flex-col items-center gap-1">
                    <span className="text-2xs tabular text-muted">{d.count}</span>
                    <div className="w-full rounded-t bg-primary" style={{ height: `${Math.max(4, (d.count / max) * 80)}px` }} />
                    <span className="text-2xs text-muted">{new Date(d.day).toLocaleDateString("fr-FR", { weekday: "short" })}</span>
                  </div>
                );
              })}
            </div>
          </Card>
        </>
      )}

      <section className="space-y-3">
        <h3 className="flex items-center gap-2 font-display text-lg font-bold"><ScrollText className="h-5 w-5" /> Journal des événements</h3>
        <div className="flex flex-wrap gap-2">
          <Chip active={type === ""} onClick={() => setType("")}>Tous</Chip>
          {overview.data?.byType.map((t) => (
            <Chip key={t.eventType} active={type === t.eventType} onClick={() => setType(t.eventType)}>{t.eventType} · {t.last7d}</Chip>
          ))}
        </div>
        {events.loading && !events.data ? <CardSkeleton rows={3} /> : events.error ? <ErrorState description={events.error} onRetry={events.reload} /> :
          !events.data?.length ? <EmptyState icon={<ScrollText />} title="Aucun événement" description="L'activité de la plateforme apparaîtra ici." /> : (
            <div className="space-y-2">
              {events.data.map((e) => (
                <Card key={e.eventId} className="p-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2"><Badge tone="primary">{e.eventType}</Badge><span className="text-muted">{e.source}</span></div>
                    <span className="text-xs text-muted">{when(e.occurredAt)}</span>
                  </div>
                  <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-all text-2xs text-muted">{e.payload}</pre>
                </Card>
              ))}
            </div>
          )}
      </section>
    </div>
  );
}
