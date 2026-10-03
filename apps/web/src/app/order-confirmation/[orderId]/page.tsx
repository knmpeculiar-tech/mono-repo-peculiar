import type { Metadata } from "next";
import { OrderConfirmationClient } from "@/components/order/OrderConfirmationClient";

export const metadata: Metadata = {
  title: "Order confirmation",
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ orderId: string }>;
}

export default async function OrderConfirmationPage({ params }: PageProps) {
  const { orderId } = await params;
  return <OrderConfirmationClient orderId={orderId} />;
}
