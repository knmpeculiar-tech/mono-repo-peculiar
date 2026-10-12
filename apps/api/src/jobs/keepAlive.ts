import { prisma } from "../lib/prisma";
import { supabaseAdmin } from "../lib/supabase";

const HOUR_MS = 60 * 60 * 1000;
// First ping a minute after boot, not instantly: startup stays fast and a
// crash-looping process doesn't hammer the database.
const FIRST_PING_DELAY_MS = 60 * 1000;

// Supabase pauses free-plan projects after 7 days without activity, and the
// site starts with little traffic. Two tiny reads cover both kinds of activity:
// a direct Postgres query (Prisma) and a request through Supabase's own API.
export async function pingSupabase(): Promise<void> {
  await prisma.product.findFirst({ select: { id: true } });
  const { error } = await supabaseAdmin.from("products").select("id").limit(1);
  if (error) throw new Error(`Supabase API ping failed: ${error.message}`);
}

// Only works because the API runs on an always-on server (the Hostinger VPS);
// on a host that sleeps when idle this timer would never fire. A failed ping
// is logged, never thrown — it must not take down the server it's keeping alive.
export function startKeepAlive(
  intervalHours: number,
  ping: () => Promise<void> = pingSupabase,
): (() => void) | null {
  if (intervalHours <= 0) return null;

  const run = () => {
    ping()
      .then(() => console.log(`[keep-alive] Supabase pinged at ${new Date().toISOString()}`))
      .catch((err: unknown) => console.error("[keep-alive] ping failed:", err));
  };

  let interval: NodeJS.Timeout | undefined;
  const first = setTimeout(() => {
    run();
    interval = setInterval(run, intervalHours * HOUR_MS);
    interval.unref();
  }, FIRST_PING_DELAY_MS);
  // unref: these timers never keep the process alive on their own (clean shutdowns).
  first.unref();

  return () => {
    clearTimeout(first);
    if (interval) clearInterval(interval);
  };
}
