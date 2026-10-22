import { notFound } from "next/navigation";
import { PageEditorForm } from "@/components/cms/page-editor-form";
import { getCmsPageById } from "@/lib/cms/data";
import {
  SaPageHeader,
  SaSecondaryLink,
} from "@/components/super-admin/sa-page-header";

type Props = { params: Promise<{ id: string }> };

export const metadata = { title: "Edit page · Super Admin" };

export default async function EditCmsPage({ params }: Props) {
  const { id } = await params;
  const page = await getCmsPageById(id);
  if (!page) notFound();

  const liveHref = page.slug === "home" ? "/" : `/${page.slug}`;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <SaPageHeader
        eyebrow="Content"
        title={`Edit · ${page.title}`}
        description="Update content, SEO, and publish state."
        actions={
          <>
            <SaSecondaryLink href="/super-admin/pages">All pages</SaSecondaryLink>
            <SaSecondaryLink href={liveHref}>View live</SaSecondaryLink>
          </>
        }
      />
      <div className="rounded-2xl border border-[#d7e5dc] bg-white p-5 shadow-[0_18px_40px_-34px_rgba(16,36,26,0.45)] sm:p-7">
        <PageEditorForm page={page} />
      </div>
    </div>
  );
}
