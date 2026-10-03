"use client";

import { type DragEvent, useId, useRef, useState } from "react";

export interface MediaFieldItem {
  key: string;
  src: string;
  removeLabel: string;
  onRemove: () => void;
}

// Admin upload field: the native file input stays hidden (its "Choose files /
// No file chosen" UI can't be styled and doesn't read as a control), and a
// real button tile opens it instead. Selected and already-saved media render
// as thumbnails in the same row, so the count against `max` is visible.
export function MediaField({
  label,
  hint,
  kind,
  items,
  max,
  onFilesSelected,
  error,
}: {
  label: string;
  hint: string;
  kind: "image" | "video";
  items: MediaFieldItem[];
  max: number;
  onFilesSelected: (files: File[]) => void;
  error?: string | null;
}) {
  const inputId = useId();
  const hintId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const isFull = items.length >= max;
  const tileSize = kind === "image" ? "h-24 w-24" : "h-24 w-36";

  function handleDrop(event: DragEvent) {
    event.preventDefault();
    setIsDragging(false);
    if (isFull) return;
    // Drop bypasses the input's `accept`, so filter here too.
    const files = Array.from(event.dataTransfer.files).filter((file) =>
      file.type.startsWith(`${kind}/`),
    );
    if (files.length > 0) onFilesSelected(files);
  }

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();
        if (!isFull) setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <label htmlFor={inputId} className="text-body font-medium">
          {label}
        </label>
        <span className="text-caption tabular-nums">
          {items.length} of {max}
        </span>
      </div>

      <div className="flex flex-wrap gap-3">
        {items.map((item) => (
          <div
            key={item.key}
            className={`border-border bg-surface-muted relative overflow-hidden rounded-md border ${tileSize}`}
          >
            {kind === "image" ? (
              // eslint-disable-next-line @next/next/no-img-element -- admin thumbnail of a blob: or Storage URL; next/image adds nothing here
              <img src={item.src} alt="" className="h-full w-full object-cover" />
            ) : (
              <video
                src={item.src}
                className="h-full w-full object-cover"
                controls
                preload="metadata"
              />
            )}
            <button
              type="button"
              onClick={item.onRemove}
              aria-label={item.removeLabel}
              className="bg-foreground/75 text-surface hover:bg-foreground focus-visible:outline-brand absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full text-sm leading-none focus-visible:outline-2"
            >
              ×
            </button>
          </div>
        ))}

        {!isFull ? (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            aria-describedby={hintId}
            className={`text-muted-foreground hover:border-brand hover:text-brand focus-visible:outline-brand flex flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${tileSize} ${
              isDragging ? "border-brand bg-brand-50 text-brand" : "border-muted-foreground/40"
            }`}
          >
            <span aria-hidden className="text-xl leading-none">
              +
            </span>
            Add {kind}
          </button>
        ) : null}
      </div>

      <p id={hintId} className="text-caption mt-2">
        {isFull ? `Maximum of ${max} reached — remove one to add another.` : hint}
      </p>
      {error ? (
        <p role="alert" className="text-danger text-caption mt-1">
          {error}
        </p>
      ) : null}

      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={`${kind}/*`}
        multiple
        className="sr-only"
        tabIndex={-1}
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []);
          // Reset so picking the same file again after removing it still fires.
          event.target.value = "";
          if (files.length > 0) onFilesSelected(files);
        }}
      />
    </div>
  );
}
