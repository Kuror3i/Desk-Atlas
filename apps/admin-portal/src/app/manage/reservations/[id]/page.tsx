import { ReservationDetail } from '@/features/reservations';

export default async function ReservationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ReservationDetail id={id} />;
}
