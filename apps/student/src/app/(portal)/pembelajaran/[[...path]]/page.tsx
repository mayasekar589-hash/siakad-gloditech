import { LearningView } from "../../../../features/learning/learning-view";

export default async function LearningPage({ params }: { params: Promise<{ path?: string[] }> }) {
  const { path = [] } = await params;
  return <LearningView path={path} />;
}