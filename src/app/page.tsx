"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { categories } from "@/constants/categories";
import { useNews } from "@/hooks/useNews";

export default function Page() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const selected = searchParams.get("category") || "기술";
  const { data, isLoading } = useNews(selected);

  const handleSelect = (cat: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("category", cat);
    router.push(`/?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="px-4 py-6 max-w-5xl mx-auto">
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => handleSelect(cat)}
            className={`px-4 py-2 rounded-full border text-sm 
              ${
                selected === cat
                  ? "bg-black text-white"
                  : "bg-white text-gray-700"
              }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p>로딩 중...</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {data?.map((item) => (
            <div key={item.link}>{item.title}</div>
          ))}
        </div>
      )}
    </div>
  );
}
