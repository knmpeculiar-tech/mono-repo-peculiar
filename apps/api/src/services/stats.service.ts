import { prisma } from "../lib/prisma";
import type { StatsRange } from "../validators/stats.validator";

const RANGE_DAYS: Record<Exclude<StatsRange, "all">, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
};

// A fixed, far-past floor for "all" rather than a separate no-filter code
// path — every range runs the exact same queries, just with a different
// `createdAt >= from` boundary.
const EPOCH = new Date(0);

// "Paid" for revenue purposes — pending hasn't been paid yet, cancelled never
// will be. Matches the same statuses order.service.ts's ALLOWED_TRANSITIONS
// treats as post-payment.
const PAID_STATUSES = ["confirmed", "processing", "shipped", "delivered"];

function rangeStart(range: StatsRange): Date {
  if (range === "all") return EPOCH;
  const start = new Date();
  start.setDate(start.getDate() - RANGE_DAYS[range]);
  return start;
}

interface DailyRow {
  day: Date;
  orders: number;
  revenue: bigint;
}

export async function getOverviewStats(range: StatsRange) {
  const from = rangeStart(range);

  const [totalOrders, revenueAgg, newCustomers, totalCustomersAllTime, statusGroups, dailySeries] =
    await Promise.all([
      prisma.order.count({ where: { createdAt: { gte: from } } }),
      prisma.order.aggregate({
        where: { createdAt: { gte: from }, status: { in: PAID_STATUSES } },
        _sum: { totalInPaise: true },
      }),
      prisma.profile.count({ where: { role: "CUSTOMER", createdAt: { gte: from } } }),
      prisma.profile.count({ where: { role: "CUSTOMER" } }),
      prisma.order.groupBy({
        by: ["status"],
        where: { createdAt: { gte: from } },
        _count: { _all: true },
      }),
      // date_trunc'd daily buckets aren't expressible through Prisma's query
      // builder — the documented raw-SQL exception in database.md. The only
      // interpolated value is `from`, safely parameterized by the tagged
      // template; the status list is a hardcoded literal, not user input.
      prisma.$queryRaw<DailyRow[]>`
        SELECT
          date_trunc('day', created_at) AS day,
          COUNT(*)::int AS orders,
          COALESCE(
            SUM(CASE WHEN status IN ('confirmed', 'processing', 'shipped', 'delivered') THEN total_paise ELSE 0 END),
            0
          )::bigint AS revenue
        FROM orders
        WHERE created_at >= ${from}
        GROUP BY day
        ORDER BY day ASC
      `,
    ]);

  return {
    totalOrders,
    totalRevenueInPaise: revenueAgg._sum.totalInPaise ?? 0,
    newCustomers,
    totalCustomersAllTime,
    ordersByStatus: Object.fromEntries(statusGroups.map((group) => [group.status, group._count._all])),
    dailySeries: dailySeries.map((row) => ({
      date: row.day.toISOString().slice(0, 10),
      orders: row.orders,
      revenueInPaise: Number(row.revenue),
    })),
  };
}
