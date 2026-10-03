// Mirrors the shapes apps/api actually returns (see apps/api/src/docs/schemas.ts
// and apps/api/prisma/schema.prisma) — kept in sync by hand since apps/web never touches
// Prisma directly.

export interface ProductImage {
  id: string;
  productId: string;
  storagePath: string;
  altText: string | null;
  sortOrder: number;
  isPrimary: boolean;
  createdAt: string;
}

export interface ProductVariant {
  id: string;
  productId: string;
  sizeOptionId: string;
  packOptionId: string;
  /** Computed display label, e.g. "Medium - Jumbo Pack (12 pads)". */
  name: string;
  /** The linked size option's name. */
  size: string;
  /** The linked pack option's name. */
  containerType: string;
  padsPerPack: number;
  sku: string;
  /** Selling price — what the customer pays. */
  priceInPaise: number;
  /** Higher "normal" price, shown struck through. Never charged; always >= priceInPaise. */
  mrpInPaise: number;
  stock: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Admin-managed size (e.g. "Medium"). `_count.variants` includes archived variants. */
export interface SizeOption {
  id: string;
  name: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  _count?: { variants: number };
}

/** Admin-managed pack type (e.g. "Jumbo Pack", 12 pads). */
export interface PackOption {
  id: string;
  name: string;
  padsPerPack: number;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  _count?: { variants: number };
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  variants: ProductVariant[];
  images: ProductImage[];
}

export interface OrderItem {
  id: string;
  orderId: string;
  variantId: string;
  /** Snapshotted at purchase time. */
  productName: string;
  variantName: string;
  sku: string;
  quantity: number;
  unitPriceInPaise: number;
  totalPriceInPaise: number;
  createdAt: string;
}

export type PaymentStatus = "created" | "pending" | "paid" | "failed" | "refunded";

export interface Payment {
  id: string;
  orderId: string;
  provider: string;
  providerOrderId: string | null;
  providerPaymentId: string | null;
  amountInPaise: number;
  status: PaymentStatus;
  createdAt: string;
  updatedAt: string;
}

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

export interface ShippingAddress {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  /** Null only on orders placed before sign-in was required. */
  profileId: string | null;
  status: OrderStatus;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string;
  shippingAddress: ShippingAddress;
  subtotalInPaise: number;
  shippingInPaise: number;
  totalInPaise: number;
  /** Set when the admin marks the WhatsApp confirmation message sent. */
  confirmationMsgSentAt: string | null;
  /** Set when the admin marks the WhatsApp dispatch message sent. */
  dispatchMsgSentAt: string | null;
  /** Set when the admin marks the WhatsApp delivery message sent. */
  deliveryMsgSentAt: string | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  payments: Payment[];
}

export interface Review {
  id: string;
  productId: string;
  authorName: string;
  rating: number;
  title: string;
  body: string;
  isPublished: boolean;
  /** Supabase Storage paths, max 4. */
  imagePaths: string[];
  /** Supabase Storage paths, max 2. */
  videoPaths: string[];
  createdAt: string;
  updatedAt: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  coverImageUrl: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  isPublished: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type Role = "CUSTOMER" | "ADMIN";

export interface Profile {
  id: string;
  email: string;
  fullName: string | null;
  phone: string | null;
  role: Role;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUserListItem extends Profile {
  orderCount: number;
}

export interface AdminUserDetail extends Profile {
  orders: Order[];
}

export type StatsRange = "7d" | "30d" | "90d" | "all";

export interface Stats {
  totalOrders: number;
  totalRevenueInPaise: number;
  newCustomers: number;
  totalCustomersAllTime: number;
  ordersByStatus: Partial<Record<OrderStatus, number>>;
  dailySeries: { date: string; orders: number; revenueInPaise: number }[];
}

export interface ApiErrorBody {
  error: string;
}
