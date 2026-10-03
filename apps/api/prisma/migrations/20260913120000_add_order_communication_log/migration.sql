-- Tracks whether the admin has sent each WhatsApp communication milestone
-- for an order, independent of order.status (see docs/decisions.md).
-- null = not sent yet; a timestamp = when it was marked sent.
ALTER TABLE "orders" ADD COLUMN "confirmation_msg_sent_at" TIMESTAMPTZ;
ALTER TABLE "orders" ADD COLUMN "dispatch_msg_sent_at" TIMESTAMPTZ;
ALTER TABLE "orders" ADD COLUMN "delivery_msg_sent_at" TIMESTAMPTZ;
