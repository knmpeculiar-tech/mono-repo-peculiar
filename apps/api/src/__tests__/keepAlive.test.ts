import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { startKeepAlive } from "../jobs/keepAlive";

describe("startKeepAlive", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("is off when the interval is 0", () => {
    const ping = vi.fn(async () => {});
    expect(startKeepAlive(0, ping)).toBeNull();
    vi.advanceTimersByTime(10 * 24 * 60 * 60 * 1000);
    expect(ping).not.toHaveBeenCalled();
  });

  it("pings a minute after start, then every interval", async () => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    const ping = vi.fn(async () => {});
    const stop = startKeepAlive(24, ping)!;

    await vi.advanceTimersByTimeAsync(59 * 1000);
    expect(ping).toHaveBeenCalledTimes(0);
    await vi.advanceTimersByTimeAsync(1000);
    expect(ping).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(24 * 60 * 60 * 1000);
    expect(ping).toHaveBeenCalledTimes(2);

    stop();
    await vi.advanceTimersByTimeAsync(3 * 24 * 60 * 60 * 1000);
    expect(ping).toHaveBeenCalledTimes(2);
  });

  it("logs a failed ping instead of crashing, and keeps going", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "log").mockImplementation(() => {});
    const ping = vi.fn().mockRejectedValueOnce(new Error("db down")).mockResolvedValue(undefined);
    startKeepAlive(1, ping);

    await vi.advanceTimersByTimeAsync(60 * 1000);
    expect(error).toHaveBeenCalledWith("[keep-alive] ping failed:", expect.any(Error));
    await vi.advanceTimersByTimeAsync(60 * 60 * 1000);
    expect(ping).toHaveBeenCalledTimes(2);
  });
});
