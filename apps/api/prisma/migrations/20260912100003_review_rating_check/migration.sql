-- Defense-in-depth, matching the CHECK-constraint style already used on the
-- pre-existing tables (orders/payments/product_variants) in this database.
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_rating_check" CHECK ("rating" >= 1 AND "rating" <= 5);
