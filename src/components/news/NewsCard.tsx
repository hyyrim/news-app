// components/NewsCard.tsx
"use client";

interface Props {
  title: string;
  abstract: string;
  byline: string;
  image?: string | null;
  url: string;
}

export default function NewsCard({
  title,
  abstract,
  byline,
  image,
  url,
}: Props) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="block border p-4 rounded-md hover:shadow"
    >
      {image && (
        <img
          src={image}
          alt={title}
          className="w-full h-48 object-cover rounded mb-3"
        />
      )}

      <h3 className="font-bold mb-2">{title}</h3>
      <p className="text-sm text-gray-700">{abstract}</p>
      <p className="text-xs text-gray-500 mt-2">{byline}</p>
    </a>
  );
}
