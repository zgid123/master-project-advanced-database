export function TopicDetailPage({ topicId }: { topicId: string }) {
  return (
    <div className="island-shell rounded-2xl p-10 text-center">
      <h1 className="text-2xl font-bold text-sea-ink">Topic Detail: {topicId}</h1>
      <p className="mt-4 text-sea-ink-soft">Detail view is temporarily disabled due to YAGNI refactoring.</p>
    </div>
  );
}
