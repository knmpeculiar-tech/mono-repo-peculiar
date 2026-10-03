// Peculiar is an India-only business — always show exact times in IST
// regardless of the viewer's own device timezone, rather than a vague
// relative date or the browser's local time.
const IST_FORMATTER = new Intl.DateTimeFormat("en-IN", {
  timeZone: "Asia/Kolkata",
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: true,
});

export function formatIST(dateString: string): string {
  return `${IST_FORMATTER.format(new Date(dateString))} IST`;
}
