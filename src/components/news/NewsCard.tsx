type NewsItem = {
  title: string;
  description: string;
  pubDate: string;
  link: string;
  category: string;
  source: string;
};

export function NewsCard({ item }: { item: NewsItem }) {
  return (
    <div className="bg-white rounded-lg shadow p-4 space-y-2">
      <div className="text-xs text-gray-500">{item.category}</div>
      <h3 className="font-semibold text-base">{item.title}</h3>
      <p className="text-sm text-gray-600">{item.description}</p>
      <div className="text-xs text-gray-400">
        {item.source} · {item.pubDate}
      </div>
    </div>
  );
}
