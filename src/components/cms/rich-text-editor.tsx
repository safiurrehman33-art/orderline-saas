"use client";

import { useEffect, useRef, useState } from "react";
import { Code2, Eye } from "lucide-react";

export function RichTextEditor({
  name,
  defaultValue = "",
  label = "Page editor",
}: {
  name: string;
  defaultValue?: string;
  label?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<"visual" | "html">("visual");
  const [html, setHtml] = useState(defaultValue || "<p></p>");

  useEffect(() => {
    if (mode !== "visual" || !ref.current) return;
    ref.current.innerHTML = html || "<p></p>";
    // Only rehydrate the visual canvas when entering Visual mode.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  function syncFromVisual() {
    if (ref.current) setHtml(ref.current.innerHTML);
  }

  function switchMode(next: "visual" | "html") {
    if (next === mode) return;
    if (mode === "visual") syncFromVisual();
    setMode(next);
  }

  function cmd(command: string, value?: string) {
    document.execCommand(command, false, value);
    ref.current?.focus();
    syncFromVisual();
  }

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <div className="inline-flex rounded-lg border border-line bg-background p-0.5">
          <button
            type="button"
            onClick={() => switchMode("visual")}
            className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition ${
              mode === "visual"
                ? "bg-accent text-white"
                : "text-muted hover:text-foreground"
            }`}
          >
            <Eye className="h-3.5 w-3.5" />
            Visual
          </button>
          <button
            type="button"
            onClick={() => switchMode("html")}
            className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition ${
              mode === "html"
                ? "bg-accent text-white"
                : "text-muted hover:text-foreground"
            }`}
          >
            <Code2 className="h-3.5 w-3.5" />
            HTML
          </button>
        </div>
      </div>

      <p className="text-xs text-muted">
        Use Visual for formatting, or switch to HTML to paste/edit raw markup.
        Saved HTML renders on the public frontend.
      </p>

      <div className="overflow-hidden rounded-xl border border-line bg-surface">
        {mode === "visual" ? (
          <>
            <div className="flex flex-wrap gap-1 border-b border-line bg-background/70 p-2">
              {[
                { label: "B", action: () => cmd("bold") },
                { label: "I", action: () => cmd("italic") },
                { label: "U", action: () => cmd("underline") },
                { label: "H2", action: () => cmd("formatBlock", "h2") },
                { label: "H3", action: () => cmd("formatBlock", "h3") },
                { label: "P", action: () => cmd("formatBlock", "p") },
                { label: "• List", action: () => cmd("insertUnorderedList") },
                { label: "1. List", action: () => cmd("insertOrderedList") },
                {
                  label: "Link",
                  action: () => {
                    const url = window.prompt("Link URL");
                    if (url) cmd("createLink", url);
                  },
                },
                {
                  label: "Image",
                  action: () => {
                    const url = window.prompt("Image URL");
                    if (url) cmd("insertImage", url);
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
              onInput={syncFromVisual}
              onBlur={syncFromVisual}
              className="prose-cms min-h-[320px] max-w-none px-4 py-3 text-sm leading-7 text-foreground outline-none"
            />
          </>
        ) : (
          <textarea
            value={html}
            onChange={(e) => setHtml(e.target.value)}
            spellCheck={false}
            className="min-h-[360px] w-full resize-y bg-[#0f1a15] px-4 py-3 font-mono text-xs leading-6 text-[#d7e5dc] outline-none"
            placeholder="<h2>Heading</h2>&#10;<p>Your HTML content…</p>"
          />
        )}
      </div>

      <input type="hidden" name={name} value={html} />

      {mode === "html" ? (
        <div className="rounded-xl border border-dashed border-line bg-background/50 p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
            Live preview
          </p>
          <div
            className="prose-cms max-w-none text-sm text-foreground"
            dangerouslySetInnerHTML={{ __html: html || "<p></p>" }}
          />
        </div>
      ) : null}
    </div>
  );
}
