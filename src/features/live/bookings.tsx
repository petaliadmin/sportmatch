"use client";
import { CalendarCheck } from "lucide-react";
import { Badge, Button, Card, CardSkeleton, EmptyState, ErrorState } from "@/components/ui";
import { fcfa } from "@/lib/utils";
import { useAction, useApi, useResource, when } from "./hooks";

export function BookingsPanel() {
  const client = useApi();
  const { busy, run } = useAction();
  const bookings = useResource(() => client.myBookings(), [client]);

  const cancel = async (id: string) => {
    const r = await run(id, () => client.cancelBooking(id), "Réservation annulée, le créneau est libéré");
    if (r) bookings.reload();
  };

  if (bookings.loading) return <CardSkeleton rows={3} />;
  if (bookings.error) return <ErrorState description={bookings.error} onRetry={bookings.reload} />;
  if (!bookings.data?.length) return <EmptyState icon={<CalendarCheck />} title="Aucune réservation" description="Réserve un créneau depuis l'onglet Terrains." />;
  return (
    <div className="space-y-3">
      {bookings.data.map((b) => {
        const upcoming = b.status === "CONFIRMED" && new Date(b.startsAt) > new Date();
        return (
          <Card key={b.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <p className="font-semibold">{b.courtName} · {b.venueName}</p>
              <p className="text-sm text-muted">{when(b.startsAt)} → {when(b.endsAt).split(" ").pop()} · {fcfa(b.priceFcfa)} (démo)</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge tone={b.status === "CONFIRMED" ? "success" : "neutral"}>{b.status === "CONFIRMED" ? "Confirmée" : "Annulée"}</Badge>
              {upcoming && <Button size="sm" variant="outline" loading={busy === b.id} onClick={() => cancel(b.id)}>Annuler</Button>}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
