import { PaymentSessionPage } from "@/features/payment";

export default async function PaymentRoute({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <PaymentSessionPage token={token} />;
}
