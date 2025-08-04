"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useNews } from "@/hooks/useNews";
import { nytSections } from "@/constants/categories";

export default function Page() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const selected = searchParams.get("section") || "home";
  const { data, isLoading } = useNews(selected);

  const handleSelect = (section: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("section", section);
    router.push(`/?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="px-4 py-6 max-w-5xl mx-auto">
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {nytSections.map((section) => (
          <button
            key={section}
            onClick={() => handleSelect(section)}
            className={`px-4 py-2 rounded-full border text-sm 
              ${
                selected === section
                  ? "bg-black text-white"
                  : "bg-white text-gray-700"
              }`}
          >
            {section}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p>로딩 중...</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {data?.map((item) => (
            <a
              key={item.url}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block border p-4 rounded-md hover:shadow"
            >
              {item.image && (
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-48 object-cover rounded mb-3"
                />
              )}

              <h3 className="font-bold mb-2">{item.title}</h3>
              <p className="text-sm text-gray-700">{item.abstract}</p>
              <p className="text-xs text-gray-500 mt-2">{item.byline}</p>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
