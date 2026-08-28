import { ReservationDetail } from '@/features/reservations';

export default function ReservationDetailPage({ params }: { params: { id: string } }) {
  return <ReservationDetail id={params.id} />;
}
