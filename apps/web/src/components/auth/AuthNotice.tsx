const TONE_CLASSES = {
  success: "border-success/30 bg-success/5 text-foreground",
  error: "border-danger/30 bg-danger/5 text-foreground",
} as const;

export function AuthNotice({
  tone,
  children,
}: {
  tone: keyof typeof TONE_CLASSES;
  children: React.ReactNode;
}) {
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={`rounded-md border px-3 py-2 text-sm ${TONE_CLASSES[tone]}`}
    >
      {children}
    </p>
  );
}
