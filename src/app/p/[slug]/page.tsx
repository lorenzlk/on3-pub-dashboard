import { PublisherPageClient } from "./PublisherPageClient";

export default async function PublisherPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <PublisherPageClient slug={slug} />;
}

