"use client";

import { useState } from "react";
import { useMostPopular } from "@/hooks/useMostPopular";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import styles from "./TopSlider.module.css";

export default function TopSlider() {
  const { data } = useMostPopular();
  const [active, setActive] = useState(0);

  const items = (data ?? []).filter((i) => !!i.image);
  const enableLoop = items.length > 1;

  if (!items.length) return null;

  return (
    <div className="mb-4">
      <div className="relative">
        <Swiper
          modules={[Pagination, Autoplay]}
          pagination={{ el: ".topslider-pagination", type: "fraction" }}
          autoplay={{
            delay: 3000,
            disableOnInteraction: false,
            pauseOnMouseEnter: true,
          }}
          spaceBetween={12}
          slidesPerView={1}
          loop={enableLoop}
          speed={600}
          grabCursor
          resistanceRatio={0.8}
          touchRatio={1.1}
          longSwipes
          longSwipesRatio={0.2}
          onSlideChange={(swiper) =>
            setActive(swiper.realIndex ?? swiper.activeIndex)
          }
        >
          {items.slice(0, 8).map((item) => (
            <SwiperSlide key={item.url}>
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <img
                  src={item.image!}
                  alt={item.title}
                  className="w-full h-60 sm:h-80 object-cover rounded-lg"
                />
              </a>
            </SwiperSlide>
          ))}
        </Swiper>

        <div
          className={`topslider-pagination ${styles.topsliderPagination}`}
        ></div>
      </div>

      <div className="mt-2">
        <h3 className="font-semibold text-base sm:text-lg line-clamp-2 max-w-[calc(100%-56px)]">
          {items[active]?.title}
        </h3>
      </div>
    </div>
  );
}
