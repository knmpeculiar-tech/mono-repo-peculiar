import type { Metadata } from "next";
import Link from "next/link";
import { BarChart } from "@/components/admin/BarChart";
import { StatCard } from "@/components/admin/StatCard";
import { getAdminStats } from "@/lib/api/admin/stats";
import { formatPaise } from "@/lib/money";
import { ORDER_STATUS_LABEL } from "@/lib/orderStatus";
import { createClient } from "@/lib/supabase/server";
import type { OrderStatus, StatsRange } from "@/types/api";

export const metadata: Metadata = { title: "Overview" };

const RANGE_TABS: { label: string; value: StatsRange }[] = [
  { label: "7 days", value: "7d" },
  { label: "30 days", value: "30d" },
  { label: "90 days", value: "90d" },
  { label: "All time", value: "all" },
];

const STATUS_ORDER: OrderStatus[] = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

interface OverviewPageProps {
  searchParams: Promise<{ range?: string }>;
}

export default async function AdminOverviewPage({ searchParams }: OverviewPageProps) {
  const { range: rawRange } = await searchParams;
  const range = RANGE_TABS.find((tab) => tab.value === rawRange)?.value ?? "30d";

  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const stats = await getAdminStats(range, session?.access_token);

  const maxStatusCount = Math.max(...STATUS_ORDER.map((status) => stats.ordersByStatus[status] ?? 0), 1);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <h1 className="text-heading-1">Overview</h1>
        <nav className="flex flex-wrap gap-2" aria-label="Time range">
          {RANGE_TABS.map((tab) => (
            <Link
              key={tab.value}
              href={`/admin?range=${tab.value}`}
              className={`rounded-full px-3 py-1 text-sm ${
                tab.value === range
                  ? "bg-brand text-brand-foreground"
                  : "bg-surface-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Orders" value={String(stats.totalOrders)} />
        <StatCard label="Revenue" value={formatPaise(stats.totalRevenueInPaise)} sublabel="Paid orders only" />
        <StatCard label="New customers" value={String(stats.newCustomers)} />
        <StatCard label="Total customers" value={String(stats.totalCustomersAllTime)} sublabel="All time" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="border-border bg-surface rounded-lg border p-5">
          <h2 className="text-heading-3 mb-4">Orders per day</h2>
          <BarChart data={stats.dailySeries.map((point) => ({ label: point.date.slice(5), value: point.orders }))} />
        </div>
        <div className="border-border bg-surface rounded-lg border p-5">
          <h2 className="text-heading-3 mb-4">Revenue per day</h2>
          <BarChart
            data={stats.dailySeries.map((point) => ({
              label: point.date.slice(5),
              value: point.revenueInPaise,
            }))}
            formatValue={(value) => formatPaise(value)}
          />
        </div>
      </div>

      <div className="border-border bg-surface rounded-lg border p-5">
        <h2 className="text-heading-3 mb-4">Orders by status</h2>
        <div className="flex flex-col gap-2">
          {STATUS_ORDER.map((status) => {
            const count = stats.ordersByStatus[status] ?? 0;
            return (
              <div key={status} className="flex items-center gap-3">
                <span className="text-caption w-24 shrink-0">{ORDER_STATUS_LABEL[status]}</span>
                <div className="bg-surface-muted h-3 flex-1 overflow-hidden rounded-full">
                  <div
                    className="bg-brand h-full rounded-full"
                    style={{ width: `${(count / maxStatusCount) * 100}%` }}
                  />
                </div>
                <span className="text-caption w-8 shrink-0 text-right">{count}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
