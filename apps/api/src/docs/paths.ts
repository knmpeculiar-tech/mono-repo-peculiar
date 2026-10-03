import { z } from "zod";
import {
  createBlogPostSchema,
  updateBlogPostSchema,
} from "../validators/blog.validator";
import {
  createOrderSchema,
  orderStatusFilterSchema,
  updateOrderCommunicationSchema,
  updateOrderStatusSchema,
} from "../validators/order.validator";
import {
  razorpayWebhookEventSchema,
  verifyPaymentSchema,
} from "../validators/payment.validator";
import {
  createImageSchema,
  createProductSchema,
  setVariantsSchema,
  updateImageSchema,
  updateProductSchema,
} from "../validators/product.validator";
import {
  createPackOptionSchema,
  createSizeOptionSchema,
  updatePackOptionSchema,
  updateSizeOptionSchema,
} from "../validators/option.validator";
import { createReviewSchema, updateReviewSchema } from "../validators/review.validator";
import { statsRangeSchema } from "../validators/stats.validator";
import { createUserSchema } from "../validators/user.validator";
import {
  AdminUserDetailSchema,
  AdminUserListItemSchema,
  BlogPostSchema,
  ErrorResponseSchema,
  OrderSchema,
  PackOptionSchema,
  ProductImageSchema,
  ProductSchema,
  ProfileSchema,
  ReviewSchema,
  SizeOptionSchema,
  StatsSchema,
} from "./schemas";
import { registry } from "./registry";

const jsonBody = <T extends z.ZodTypeAny>(schema: T) => ({
  content: { "application/json": { schema } },
});

const ok = <T extends z.ZodTypeAny>(description: string, schema: T) => ({
  description,
  ...jsonBody(schema),
});

const noContent = (description: string) => ({ description });

const err = (description: string) => ({ description, ...jsonBody(ErrorResponseSchema) });

const BAD_REQUEST = err("Validation failed");
const UNAUTHORIZED = err("Missing or invalid session");
const FORBIDDEN = err("Authenticated but not an admin");
const NOT_FOUND = err("No matching record");
const CONFLICT = err("A uniqueness or state conflict (e.g. insufficient stock, idempotency key reuse)");

const authSecurity = { security: [{ bearerAuth: [] }] };
const uuidParam = (name: string) => z.object({ [name]: z.string().uuid() });

// ---------------------------------------------------------------------------
// Health
// ---------------------------------------------------------------------------

registry.registerPath({
  method: "get",
  path: "/health",
  tags: ["Health"],
  summary: "Liveness check",
  responses: {
    200: ok("Service is up", z.object({ status: z.literal("ok") })),
  },
});

// ---------------------------------------------------------------------------
// Products (public)
// ---------------------------------------------------------------------------

registry.registerPath({
  method: "get",
  path: "/products",
  tags: ["Products"],
  summary: "List active products with their active variants and images",
  responses: { 200: ok("Products", z.array(ProductSchema)) },
});

registry.registerPath({
  method: "get",
  path: "/products/{slug}",
  tags: ["Products"],
  summary: "Get one active product by slug",
  request: { params: z.object({ slug: z.string() }) },
  responses: { 200: ok("Product", ProductSchema), 404: NOT_FOUND },
});

// ---------------------------------------------------------------------------
// Profile (admin)
// ---------------------------------------------------------------------------

registry.registerPath({
  method: "get",
  path: "/admin/me",
  tags: ["Admin"],
  summary: "Get the logged-in admin's own profile",
  description:
    "Lets the frontend confirm the logged-in user is actually an admin (401/403 otherwise) before " +
    "rendering the dashboard, rather than inferring it from whether other admin calls happen to succeed.",
  ...authSecurity,
  responses: { 200: ok("Profile", ProfileSchema), 401: UNAUTHORIZED, 403: FORBIDDEN },
});

// ---------------------------------------------------------------------------
// Stats (admin)
// ---------------------------------------------------------------------------

registry.registerPath({
  method: "get",
  path: "/admin/stats",
  tags: ["Admin"],
  summary: "Overview dashboard stats for a time range",
  ...authSecurity,
  request: { query: z.object({ range: statsRangeSchema }) },
  responses: { 200: ok("Stats", StatsSchema), 400: BAD_REQUEST, 401: UNAUTHORIZED, 403: FORBIDDEN },
});

// ---------------------------------------------------------------------------
// Users (admin)
// ---------------------------------------------------------------------------

registry.registerPath({
  method: "get",
  path: "/admin/users",
  tags: ["Admin / Users"],
  summary: "List all users with their order count",
  ...authSecurity,
  responses: {
    200: ok("Users", z.array(AdminUserListItemSchema)),
    401: UNAUTHORIZED,
    403: FORBIDDEN,
  },
});

registry.registerPath({
  method: "get",
  path: "/admin/users/{id}",
  tags: ["Admin / Users"],
  summary: "Get one user with their order history",
  ...authSecurity,
  request: { params: uuidParam("id") },
  responses: {
    200: ok("User", AdminUserDetailSchema),
    401: UNAUTHORIZED,
    403: FORBIDDEN,
    404: NOT_FOUND,
  },
});

registry.registerPath({
  method: "post",
  path: "/admin/users",
  tags: ["Admin / Users"],
  summary: "Create a user (customer or admin) directly, no signup flow",
  ...authSecurity,
  request: { body: jsonBody(createUserSchema) },
  responses: {
    201: ok("Created", ProfileSchema),
    400: BAD_REQUEST,
    401: UNAUTHORIZED,
    403: FORBIDDEN,
    409: err("Email already registered"),
  },
});

registry.registerPath({
  method: "delete",
  path: "/admin/users/{id}",
  tags: ["Admin / Users"],
  summary: "Delete a user",
  description:
    "Their past orders are kept but detached (profileId set to null), never deleted. Rejects " +
    "deleting your own account or the last remaining admin.",
  ...authSecurity,
  request: { params: uuidParam("id") },
  responses: {
    204: noContent("Deleted"),
    400: err("Can't delete your own account"),
    401: UNAUTHORIZED,
    403: FORBIDDEN,
    404: NOT_FOUND,
    409: err("Can't delete the last remaining admin account"),
  },
});

// ---------------------------------------------------------------------------
// Products (admin)
// ---------------------------------------------------------------------------

registry.registerPath({
  method: "get",
  path: "/admin/products",
  tags: ["Admin / Products"],
  summary: "List all products, including inactive ones",
  ...authSecurity,
  responses: { 200: ok("Products", z.array(ProductSchema)), 401: UNAUTHORIZED, 403: FORBIDDEN },
});

registry.registerPath({
  method: "get",
  path: "/admin/products/{id}",
  tags: ["Admin / Products"],
  summary: "Get one product (any status) with all its variants and images",
  ...authSecurity,
  request: { params: uuidParam("id") },
  responses: {
    200: ok("Product", ProductSchema),
    401: UNAUTHORIZED,
    403: FORBIDDEN,
    404: NOT_FOUND,
  },
});

registry.registerPath({
  method: "post",
  path: "/admin/products",
  tags: ["Admin / Products"],
  summary: "Create a product",
  ...authSecurity,
  request: { body: jsonBody(createProductSchema) },
  responses: {
    201: ok("Created", ProductSchema),
    400: BAD_REQUEST,
    401: UNAUTHORIZED,
    403: FORBIDDEN,
    409: CONFLICT,
  },
});

registry.registerPath({
  method: "patch",
  path: "/admin/products/{id}",
  tags: ["Admin / Products"],
  summary: "Update a product",
  ...authSecurity,
  request: { params: uuidParam("id"), body: jsonBody(updateProductSchema) },
  responses: {
    200: ok("Updated", ProductSchema),
    400: BAD_REQUEST,
    401: UNAUTHORIZED,
    403: FORBIDDEN,
    404: NOT_FOUND,
    409: CONFLICT,
  },
});

registry.registerPath({
  method: "delete",
  path: "/admin/products/{id}",
  tags: ["Admin / Products"],
  summary: "Archive a product (soft delete — isActive: false, never a hard delete)",
  ...authSecurity,
  request: { params: uuidParam("id") },
  responses: {
    200: ok("Archived", ProductSchema),
    401: UNAUTHORIZED,
    403: FORBIDDEN,
    404: NOT_FOUND,
  },
});

// --- Variants (nested under a product) ---

registry.registerPath({
  method: "put",
  path: "/admin/products/{id}/variants",
  tags: ["Admin / Products"],
  summary: "Set the product's full size x pack grid in one step",
  description:
    "Every listed size/pack combination is created or updated and made live; any existing " +
    "variant not listed is archived (never deleted). Omit `stock` on a row to leave an " +
    "existing variant's stock untouched.",
  ...authSecurity,
  request: { params: uuidParam("id"), body: jsonBody(setVariantsSchema) },
  responses: {
    200: ok("The product with its updated variants", ProductSchema),
    400: BAD_REQUEST,
    401: UNAUTHORIZED,
    403: FORBIDDEN,
    404: NOT_FOUND,
    409: CONFLICT,
  },
});

// --- Size and pack options (shared across products) ---

for (const option of [
  {
    path: "sizes",
    label: "size",
    schema: SizeOptionSchema,
    create: createSizeOptionSchema,
    update: updateSizeOptionSchema,
  },
  {
    path: "packs",
    label: "pack",
    schema: PackOptionSchema,
    create: createPackOptionSchema,
    update: updatePackOptionSchema,
  },
] as const) {
  const tags = ["Admin / Sizes & packs"];
  registry.registerPath({
    method: "get",
    path: `/admin/${option.path}`,
    tags,
    summary: `List ${option.label} options with how many variants use each`,
    ...authSecurity,
    responses: { 200: ok("Options", z.array(option.schema)), 401: UNAUTHORIZED, 403: FORBIDDEN },
  });
  registry.registerPath({
    method: "post",
    path: `/admin/${option.path}`,
    tags,
    summary: `Create a ${option.label} option`,
    ...authSecurity,
    request: { body: jsonBody(option.create) },
    responses: {
      201: ok("Created", option.schema),
      400: BAD_REQUEST,
      401: UNAUTHORIZED,
      403: FORBIDDEN,
      409: CONFLICT,
    },
  });
  registry.registerPath({
    method: "patch",
    path: `/admin/${option.path}/{id}`,
    tags,
    summary: `Rename/reorder a ${option.label} option (applies to every product using it)`,
    ...authSecurity,
    request: { params: uuidParam("id"), body: jsonBody(option.update) },
    responses: {
      200: ok("Updated", option.schema),
      400: BAD_REQUEST,
      401: UNAUTHORIZED,
      403: FORBIDDEN,
      404: NOT_FOUND,
      409: CONFLICT,
    },
  });
  registry.registerPath({
    method: "delete",
    path: `/admin/${option.path}/{id}`,
    tags,
    summary: `Delete a ${option.label} option — 409 while any variant (even archived) uses it`,
    ...authSecurity,
    request: { params: uuidParam("id") },
    responses: {
      204: noContent("Deleted"),
      401: UNAUTHORIZED,
      403: FORBIDDEN,
      404: NOT_FOUND,
      409: CONFLICT,
    },
  });
}

// --- Images (nested under a product) ---

registry.registerPath({
  method: "post",
  path: "/admin/products/{id}/images",
  tags: ["Admin / Products"],
  summary: "Attach an image (Supabase Storage path) to a product",
  description: "A product can have at most 4 images.",
  ...authSecurity,
  request: { params: uuidParam("id"), body: jsonBody(createImageSchema) },
  responses: {
    201: ok("Created", ProductImageSchema),
    400: BAD_REQUEST,
    401: UNAUTHORIZED,
    403: FORBIDDEN,
    404: NOT_FOUND,
    409: err("The product already has 4 images"),
  },
});

registry.registerPath({
  method: "patch",
  path: "/admin/products/images/{imageId}",
  tags: ["Admin / Products"],
  summary: "Update an image's alt text, sort order, or primary flag",
  ...authSecurity,
  request: { params: uuidParam("imageId"), body: jsonBody(updateImageSchema) },
  responses: {
    200: ok("Updated", ProductImageSchema),
    400: BAD_REQUEST,
    401: UNAUTHORIZED,
    403: FORBIDDEN,
    404: NOT_FOUND,
  },
});

registry.registerPath({
  method: "delete",
  path: "/admin/products/images/{imageId}",
  tags: ["Admin / Products"],
  summary: "Remove an image (hard delete — no order-history dependency)",
  ...authSecurity,
  request: { params: uuidParam("imageId") },
  responses: { 204: noContent("Deleted"), 401: UNAUTHORIZED, 403: FORBIDDEN, 404: NOT_FOUND },
});

// ---------------------------------------------------------------------------
// Reviews
// ---------------------------------------------------------------------------

registry.registerPath({
  method: "get",
  path: "/products/{productId}/reviews",
  tags: ["Reviews"],
  summary: "List published reviews for a product",
  request: { params: uuidParam("productId") },
  responses: { 200: ok("Reviews", z.array(ReviewSchema)) },
});

registry.registerPath({
  method: "get",
  path: "/admin/reviews",
  tags: ["Admin / Reviews"],
  summary: "List all reviews, including unpublished",
  ...authSecurity,
  responses: { 200: ok("Reviews", z.array(ReviewSchema)), 401: UNAUTHORIZED, 403: FORBIDDEN },
});

registry.registerPath({
  method: "post",
  path: "/admin/reviews",
  tags: ["Admin / Reviews"],
  summary: "Write a review (admin-authored — there is no customer review-submission flow)",
  ...authSecurity,
  request: { body: jsonBody(createReviewSchema) },
  responses: {
    201: ok("Created", ReviewSchema),
    400: BAD_REQUEST,
    401: UNAUTHORIZED,
    403: FORBIDDEN,
  },
});

registry.registerPath({
  method: "patch",
  path: "/admin/reviews/{id}",
  tags: ["Admin / Reviews"],
  summary: "Update a review",
  ...authSecurity,
  request: { params: uuidParam("id"), body: jsonBody(updateReviewSchema) },
  responses: {
    200: ok("Updated", ReviewSchema),
    400: BAD_REQUEST,
    401: UNAUTHORIZED,
    403: FORBIDDEN,
    404: NOT_FOUND,
  },
});

registry.registerPath({
  method: "delete",
  path: "/admin/reviews/{id}",
  tags: ["Admin / Reviews"],
  summary: "Delete a review (hard delete)",
  ...authSecurity,
  request: { params: uuidParam("id") },
  responses: { 204: noContent("Deleted"), 401: UNAUTHORIZED, 403: FORBIDDEN, 404: NOT_FOUND },
});

// ---------------------------------------------------------------------------
// Blog
// ---------------------------------------------------------------------------

registry.registerPath({
  method: "get",
  path: "/blog",
  tags: ["Blog"],
  summary: "List published posts",
  responses: { 200: ok("Posts", z.array(BlogPostSchema)) },
});

registry.registerPath({
  method: "get",
  path: "/blog/{slug}",
  tags: ["Blog"],
  summary: "Get one published post by slug",
  request: { params: z.object({ slug: z.string() }) },
  responses: { 200: ok("Post", BlogPostSchema), 404: NOT_FOUND },
});

registry.registerPath({
  method: "get",
  path: "/admin/blog",
  tags: ["Admin / Blog"],
  summary: "List all posts, including unpublished drafts",
  ...authSecurity,
  responses: { 200: ok("Posts", z.array(BlogPostSchema)), 401: UNAUTHORIZED, 403: FORBIDDEN },
});

registry.registerPath({
  method: "get",
  path: "/admin/blog/{id}",
  tags: ["Admin / Blog"],
  summary: "Get one post (any status)",
  ...authSecurity,
  request: { params: uuidParam("id") },
  responses: {
    200: ok("Post", BlogPostSchema),
    401: UNAUTHORIZED,
    403: FORBIDDEN,
    404: NOT_FOUND,
  },
});

registry.registerPath({
  method: "post",
  path: "/admin/blog",
  tags: ["Admin / Blog"],
  summary: "Create a post",
  ...authSecurity,
  request: { body: jsonBody(createBlogPostSchema) },
  responses: {
    201: ok("Created", BlogPostSchema),
    400: BAD_REQUEST,
    401: UNAUTHORIZED,
    403: FORBIDDEN,
    409: CONFLICT,
  },
});

registry.registerPath({
  method: "patch",
  path: "/admin/blog/{id}",
  tags: ["Admin / Blog"],
  summary: "Update a post (publishedAt is stamped automatically the first time isPublished becomes true)",
  ...authSecurity,
  request: { params: uuidParam("id"), body: jsonBody(updateBlogPostSchema) },
  responses: {
    200: ok("Updated", BlogPostSchema),
    400: BAD_REQUEST,
    401: UNAUTHORIZED,
    403: FORBIDDEN,
    404: NOT_FOUND,
    409: CONFLICT,
  },
});

registry.registerPath({
  method: "delete",
  path: "/admin/blog/{id}",
  tags: ["Admin / Blog"],
  summary: "Delete a post (hard delete)",
  ...authSecurity,
  request: { params: uuidParam("id") },
  responses: { 204: noContent("Deleted"), 401: UNAUTHORIZED, 403: FORBIDDEN, 404: NOT_FOUND },
});

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

registry.registerPath({
  method: "post",
  path: "/orders",
  tags: ["Orders"],
  summary: "Create an order from the client-side cart and initiate a Razorpay order",
  description:
    "Requires a signed-in customer — every order is tied to an account so order history always works. " +
    "The Idempotency-Key header is required: a retried request with the same key and body replays the " +
    "original response instead of creating a duplicate order or double-decrementing stock.",
  ...authSecurity,
  request: {
    headers: z.object({
      "Idempotency-Key": z
        .string()
        .uuid()
        .openapi({ description: "Client-generated UUID, unique per checkout attempt" }),
    }),
    body: jsonBody(createOrderSchema),
  },
  responses: {
    201: ok("Order created (or the cached result of a replayed request)", OrderSchema),
    400: BAD_REQUEST,
    401: UNAUTHORIZED,
    409: err("Insufficient stock, or this Idempotency-Key was already used with a different body"),
    502: err("Order was created but Razorpay could not be reached — stock was restocked automatically"),
  },
});

registry.registerPath({
  method: "get",
  path: "/orders",
  tags: ["Orders"],
  summary: "List the logged-in customer's own orders",
  ...authSecurity,
  responses: { 200: ok("Orders", z.array(OrderSchema)), 401: UNAUTHORIZED },
});

registry.registerPath({
  method: "get",
  path: "/orders/{id}",
  tags: ["Orders"],
  summary: "Get one of the logged-in customer's own orders",
  ...authSecurity,
  request: { params: uuidParam("id") },
  responses: { 200: ok("Order", OrderSchema), 401: UNAUTHORIZED, 404: NOT_FOUND },
});

registry.registerPath({
  method: "get",
  path: "/admin/orders",
  tags: ["Admin / Orders"],
  summary: "List all orders, optionally filtered by status",
  ...authSecurity,
  request: { query: z.object({ status: orderStatusFilterSchema }) },
  responses: { 200: ok("Orders", z.array(OrderSchema)), 401: UNAUTHORIZED, 403: FORBIDDEN },
});

registry.registerPath({
  method: "get",
  path: "/admin/orders/{id}",
  tags: ["Admin / Orders"],
  summary: "Get any order",
  ...authSecurity,
  request: { params: uuidParam("id") },
  responses: {
    200: ok("Order", OrderSchema),
    401: UNAUTHORIZED,
    403: FORBIDDEN,
    404: NOT_FOUND,
  },
});

registry.registerPath({
  method: "patch",
  path: "/admin/orders/{id}/status",
  tags: ["Admin / Orders"],
  summary: "Advance or cancel an order's status",
  description:
    "'confirmed' is never a valid target here — that transition happens automatically on payment " +
    "capture. Cancelling a pending or confirmed order restocks its items.",
  ...authSecurity,
  request: { params: uuidParam("id"), body: jsonBody(updateOrderStatusSchema) },
  responses: {
    200: ok("Updated", OrderSchema),
    400: BAD_REQUEST,
    401: UNAUTHORIZED,
    403: FORBIDDEN,
    404: NOT_FOUND,
    409: err("That status transition isn't allowed from the order's current status"),
  },
});

registry.registerPath({
  method: "patch",
  path: "/admin/orders/{id}/communication",
  tags: ["Admin / Orders"],
  summary: "Mark a WhatsApp communication milestone sent or unsent",
  description:
    "Independent of order status — the admin sends these messages manually over WhatsApp and marks " +
    "them here to track what's been sent. sent: false clears it back to unsent (correcting a misclick).",
  ...authSecurity,
  request: { params: uuidParam("id"), body: jsonBody(updateOrderCommunicationSchema) },
  responses: {
    200: ok("Updated", OrderSchema),
    400: BAD_REQUEST,
    401: UNAUTHORIZED,
    403: FORBIDDEN,
    404: NOT_FOUND,
  },
});

// ---------------------------------------------------------------------------
// Payments
// ---------------------------------------------------------------------------

registry.registerPath({
  method: "post",
  path: "/payments/verify",
  tags: ["Payments"],
  summary: "Client-side checkout success callback",
  description:
    "Verifies the Razorpay checkout signature and marks the order paid. Fast path for UI feedback — " +
    "the webhook below is the actual source of truth if the browser never calls this.",
  request: { body: jsonBody(verifyPaymentSchema) },
  responses: {
    200: ok("Order after payment capture", OrderSchema),
    400: err("Invalid payment signature"),
    404: NOT_FOUND,
  },
});

registry.registerPath({
  method: "post",
  path: "/payments/webhook",
  tags: ["Payments"],
  summary: "Razorpay webhook",
  description:
    "Verified against the raw request body via the x-razorpay-signature header (HMAC with the webhook " +
    "secret). Deduplicated by event id — a retried delivery (Razorpay retries on any non-2xx response) " +
    "is a harmless no-op.",
  request: {
    headers: z.object({
      "x-razorpay-signature": z.string().openapi({ description: "HMAC-SHA256 of the raw body" }),
    }),
    body: jsonBody(razorpayWebhookEventSchema),
  },
  responses: {
    200: ok("Acknowledged", z.object({ received: z.literal(true) })),
    400: err("Invalid or missing webhook signature"),
  },
});
