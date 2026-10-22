import Link from "next/link";
import { Pencil, PlusCircle } from "lucide-react";
import { listCmsPagesForAdmin } from "@/lib/cms/data";
import { Badge } from "@/components/ui/badge";
import { DeletePageButton } from "@/components/cms/delete-page-button";
import {
  SaPageHeader,
  SaPrimaryLink,
} from "@/components/super-admin/sa-page-header";

export const metadata = { title: "Pages · Super Admin" };

export default async function SuperAdminPagesPage() {
  const pages = await listCmsPagesForAdmin();

  return (
    <div className="space-y-6">
      <SaPageHeader
        eyebrow="Content"
        title="Pages"
        description="Create unlimited pages. Edit content, SEO, and publish to the frontend."
        actions={
          <SaPrimaryLink href="/super-admin/pages/new">
            <PlusCircle className="h-4 w-4" />
            New page
          </SaPrimaryLink>
        }
      />

      <div className="overflow-hidden rounded-2xl border border-[#d7e5dc] bg-white shadow-[0_18px_40px_-34px_rgba(16,36,26,0.45)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-[#e7eee9] bg-[#f7fbf8] text-[11px] uppercase tracking-[0.14em] text-[#5f7a6c]">
              <tr>
                <th className="px-5 py-3.5 font-semibold">Title</th>
                <th className="px-5 py-3.5 font-semibold">Slug</th>
                <th className="px-5 py-3.5 font-semibold">Status</th>
                <th className="px-5 py-3.5 font-semibold">SEO</th>
                <th className="px-5 py-3.5 font-semibold">Updated</th>
                <th className="px-5 py-3.5 font-semibold" />
              </tr>
            </thead>
            <tbody>
              {pages.map((page) => (
                <tr
                  key={page.id}
                  className="border-b border-[#e7eee9] last:border-0 hover:bg-[#f7fbf8]/80"
                >
                  <td className="px-5 py-4">
                    <div className="font-medium text-[#10241a]">{page.title}</div>
                    {page.isSystem ? (
                      <span className="mt-1 inline-flex rounded-md bg-[#e8f7f0] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#0d9f6e]">
                        System
                      </span>
                    ) : null}
                  </td>
                  <td className="px-5 py-4 font-mono text-xs text-[#5f7a6c]">
                    /{page.slug === "home" ? "" : page.slug}
                  </td>
                  <td className="px-5 py-4">
                    <Badge
                      tone={page.status === "PUBLISHED" ? "success" : "neutral"}
                    >
                      {page.status}
                    </Badge>
                  </td>
                  <td className="px-5 py-4 text-[#5f7a6c]">
                    {page.metaTitle || page.metaDescription ? (
                      <span className="inline-flex rounded-full bg-[#e8f7f0] px-2 py-0.5 text-xs font-medium text-[#0d9f6e]">
                        Ready
                      </span>
                    ) : (
                      <span className="text-xs text-[#9aafa3]">Missing</span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-xs text-[#7a9184]">
                    {new Date(page.updatedAt).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/super-admin/pages/${page.id}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-[#d7e5dc] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#3d5649] transition hover:bg-[#eef5f1]"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </Link>
                      {!page.isSystem ? (
                        <DeletePageButton id={page.id} />
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
