-- Sizes and pack types become admin-managed lists (size_options /
-- pack_options) that variants reference, replacing the free-text
-- size/container_type columns; variants gain an MRP ("normal" price, shown
-- struck through). See docs/decisions.md.

-- Variants move from free text to FKs with no reliable way to backfill pad
-- counts, so refuse loudly rather than half-migrate if any already exist.
-- (Every environment had zero variants when this was written.)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "product_variants") THEN
    RAISE EXCEPTION 'product_variants has rows: backfill size_option_id/pack_option_id/mrp_paise before applying this migration';
  END IF;
END $$;

CREATE TABLE "size_options" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "size_options_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "size_options_name_key" ON "size_options"("name");

CREATE TABLE "pack_options" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "pads_per_pack" INTEGER NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "pack_options_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "pack_options_pads_positive" CHECK ("pads_per_pack" > 0)
);
CREATE UNIQUE INDEX "pack_options_name_key" ON "pack_options"("name");

-- Starting lists, confirmed with the client. The admin can edit these later.
INSERT INTO "size_options" ("name", "sort_order", "updated_at") VALUES
  ('Small', 0, CURRENT_TIMESTAMP),
  ('Medium', 1, CURRENT_TIMESTAMP),
  ('Large', 2, CURRENT_TIMESTAMP);
INSERT INTO "pack_options" ("name", "pads_per_pack", "sort_order", "updated_at") VALUES
  ('Regular Pack', 6, 0, CURRENT_TIMESTAMP),
  ('Jumbo Pack', 12, 1, CURRENT_TIMESTAMP);

DROP INDEX "product_variants_product_id_size_container_type_key";
ALTER TABLE "product_variants"
  DROP COLUMN "name",
  DROP COLUMN "size",
  DROP COLUMN "container_type",
  ADD COLUMN "size_option_id" UUID NOT NULL,
  ADD COLUMN "pack_option_id" UUID NOT NULL,
  ADD COLUMN "mrp_paise" INTEGER NOT NULL,
  ADD CONSTRAINT "product_variants_mrp_not_below_price" CHECK ("mrp_paise" >= "price_paise");

CREATE UNIQUE INDEX "product_variants_product_id_size_option_id_pack_option_id_key"
  ON "product_variants"("product_id", "size_option_id", "pack_option_id");

-- RESTRICT: an option still used by any variant (even an archived one kept
-- for order history) can't be deleted out from under it.
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_size_option_id_fkey"
  FOREIGN KEY ("size_option_id") REFERENCES "size_options"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_pack_option_id_fkey"
  FOREIGN KEY ("pack_option_id") REFERENCES "pack_options"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Same Data API lockdown as every other table (see 20260928100001).
ALTER TABLE "size_options" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "pack_options" ENABLE ROW LEVEL SECURITY;
