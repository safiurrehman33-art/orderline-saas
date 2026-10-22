import { PageEditorForm } from "@/components/cms/page-editor-form";
import {
  SaPageHeader,
  SaSecondaryLink,
} from "@/components/super-admin/sa-page-header";

export const metadata = { title: "New page · Super Admin" };

export default function NewCmsPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <SaPageHeader
        eyebrow="Content"
        title="Create page"
        description="Add content with the editor and configure SEO before publishing."
        actions={
          <SaSecondaryLink href="/super-admin/pages">Back to pages</SaSecondaryLink>
        }
      />
      <div className="rounded-2xl border border-[#d7e5dc] bg-white p-5 shadow-[0_18px_40px_-34px_rgba(16,36,26,0.45)] sm:p-7">
        <PageEditorForm />
      </div>
    </div>
  );
}
