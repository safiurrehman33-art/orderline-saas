import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Pagination({
  page,
  pageCount,
  total,
  makeHref,
}: {
  page: number;
  pageCount: number;
  total: number;
  makeHref: (page: number) => string;
}) {
  return (
    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted">
        Page {page} of {pageCount} · {total} total
      </p>
      <div className="flex gap-2">
        <Link href={makeHref(Math.max(1, page - 1))} aria-disabled={page <= 1}>
          <Button variant="secondary" size="sm" disabled={page <= 1}>
            Previous
          </Button>
        </Link>
        <Link
          href={makeHref(Math.min(pageCount, page + 1))}
          aria-disabled={page >= pageCount}
        >
          <Button variant="secondary" size="sm" disabled={page >= pageCount}>
            Next
          </Button>
        </Link>
      </div>
    </div>
  );
}
