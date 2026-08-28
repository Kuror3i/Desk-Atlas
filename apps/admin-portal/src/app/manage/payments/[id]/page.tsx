import { PaymentReview } from '@/features/payments';

export default function PaymentReviewPage({ params }: { params: { id: string } }) {
  return <PaymentReview id={params.id} />;
}
