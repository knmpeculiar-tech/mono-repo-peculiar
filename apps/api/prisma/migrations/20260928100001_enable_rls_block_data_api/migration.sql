-- Supabase auto-exposes every public-schema table through its Data API
-- (PostgREST), reachable with the publishable key that ships in the browser
-- bundle. With RLS off, anyone could read/write orders, profiles, payments,
-- etc. directly through that API, skipping Express entirely.
--
-- Enabling RLS with *no* policies denies the anon/authenticated roles
-- everything. Prisma is unaffected: it connects as the table owner, and
-- owners bypass RLS (deliberately NOT using FORCE ROW LEVEL SECURITY, which
-- would block Prisma too). Authorization stays in Express middleware — see
-- docs/decisions.md. apps/web never queries these tables via supabase-js.
ALTER TABLE "products"          ENABLE ROW LEVEL SECURITY;
ALTER TABLE "product_images"    ENABLE ROW LEVEL SECURITY;
ALTER TABLE "product_variants"  ENABLE ROW LEVEL SECURITY;
ALTER TABLE "orders"            ENABLE ROW LEVEL SECURITY;
ALTER TABLE "order_items"       ENABLE ROW LEVEL SECURITY;
ALTER TABLE "payments"          ENABLE ROW LEVEL SECURITY;
ALTER TABLE "payment_events"    ENABLE ROW LEVEL SECURITY;
ALTER TABLE "idempotency_keys"  ENABLE ROW LEVEL SECURITY;
ALTER TABLE "profiles"          ENABLE ROW LEVEL SECURITY;
ALTER TABLE "reviews"           ENABLE ROW LEVEL SECURITY;
ALTER TABLE "blog_posts"        ENABLE ROW LEVEL SECURITY;
ALTER TABLE "_prisma_migrations" ENABLE ROW LEVEL SECURITY;
