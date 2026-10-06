import { AnnouncementDetailView } from "../../../../features/portal/section-view";
import { announcements } from "../../../../features/demo/data/announcements";

export function generateStaticParams() {
  return announcements.map(({ slug }) => ({ slug }));
}

export default async function AnnouncementDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <AnnouncementDetailView slug={slug} />;
}