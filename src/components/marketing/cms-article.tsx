export function CmsArticle({
  title,
  excerpt,
  html,
}: {
  title: string;
  excerpt?: string | null;
  html: string;
}) {
  return (
    <article className="mx-auto w-full max-w-3xl px-6 py-16">
      <h1 className="font-[family-name:var(--font-sora)] text-4xl font-semibold tracking-tight text-[#10241a]">
        {title}
      </h1>
      {excerpt ? (
        <p className="mt-4 text-lg leading-8 text-[#5f7a6c]">{excerpt}</p>
      ) : null}
      <div
        className="prose-cms mt-8 text-[#4b6558]"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </article>
  );
}
