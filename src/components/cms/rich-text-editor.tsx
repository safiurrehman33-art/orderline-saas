"use client";

import { useEffect, useRef } from "react";

export function RichTextEditor({
  name,
  defaultValue = "",
  label = "Page content",
}: {
  name: string;
  defaultValue?: string;
  label?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const hiddenRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ref.current && !ref.current.innerHTML) {
      ref.current.innerHTML = defaultValue || "<p></p>";
    }
  }, [defaultValue]);

  function sync() {
    if (hiddenRef.current && ref.current) {
      hiddenRef.current.value = ref.current.innerHTML;
    }
  }

  function cmd(command: string, value?: string) {
    document.execCommand(command, false, value);
    ref.current?.focus();
    sync();
  }

  return (
    <div className="space-y-1.5">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <div className="overflow-hidden rounded-xl border border-line bg-surface">
        <div className="flex flex-wrap gap-1 border-b border-line bg-background/70 p-2">
          {[
            { label: "B", action: () => cmd("bold") },
            { label: "I", action: () => cmd("italic") },
            { label: "U", action: () => cmd("underline") },
            { label: "H2", action: () => cmd("formatBlock", "h2") },
            { label: "H3", action: () => cmd("formatBlock", "h3") },
            { label: "• List", action: () => cmd("insertUnorderedList") },
            { label: "1. List", action: () => cmd("insertOrderedList") },
            {
              label: "Link",
              action: () => {
                const url = window.prompt("Link URL");
                if (url) cmd("createLink", url);
              },
            },
          ].map((b) => (
            <button
              key={b.label}
              type="button"
              onClick={b.action}
              className="rounded-md px-2 py-1 text-xs font-semibold text-muted hover:bg-line hover:text-foreground"
            >
              {b.label}
            </button>
          ))}
        </div>
        <div
          ref={ref}
          contentEditable
          suppressContentEditableWarning
          onInput={sync}
          onBlur={sync}
          className="prose-cms min-h-[280px] max-w-none px-4 py-3 text-sm leading-7 outline-none"
        />
      </div>
      <input
        ref={hiddenRef}
        type="hidden"
        name={name}
        defaultValue={defaultValue}
      />
    </div>
  );
}
