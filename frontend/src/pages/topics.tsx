import { useParams } from "react-router-dom";
import { Layers } from "lucide-react";
import { useState } from "react";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel/carousel";

import BottomBar from "@/components/bottom-navbar";

const TopicPage = () => {
  const { topicId } = useParams();

  const topicName = topicId?.replace(/-/g, " ");
  const ITEMS = new Array(4).fill(null).map((_, index) => index + 1);

  const [index, setIndex] = useState(0);

  const next = () => {
    if (index < ITEMS.length - 1) {
      setIndex(index + 1);
    }
  };

  const prev = () => {
    if (index > 0) {
      setIndex(index - 1);
    }
  };

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 py-10 pb-28">

      {/* Header */}
      <div className="flex flex-col gap-4 border-b pb-6">
        <div className="flex size-8 items-center justify-center rounded-lg bg-white shadow">
          <Layers size={18} className="text-gray-500" />
        </div>

        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-semibold tracking-tight capitalize">
            {topicName}
          </h2>

          <p className="text-gray-600">
            Study this topic using flashcards, quizzes, or AI tutoring.
          </p>
        </div>
      </div>

      {/* Flashcard Carousel */}
      <div className="relative w-full">
        <Carousel index={index} onIndexChange={setIndex}>
          <CarouselContent className="relative">
            {ITEMS.map((item) => (
              <CarouselItem key={item} className="flex justify-center px-4">
                <div className="flex w-full max-w-3xl aspect-[16/9] items-center justify-center rounded-xl border border-zinc-200 bg-white text-3xl font-semibold shadow-sm transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950">
                  {item}
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>

     
     <BottomBar className="flex justify-center items-center gap-3">

  <button
    onClick={prev}
    disabled={index === 0}
    className="inline-flex items-center gap-2 justify-center rounded-[10px] bg-white px-4 h-10 shadow hover:bg-gray-100 disabled:opacity-40"
  >
    <svg className="size-5 text-gray-800" viewBox="0 0 24 24" fill="none">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2ZM10.2929 15.7071C10.6834 16.0976 11.3166 16.0976 11.7071 15.7071C12.0976 15.3166 12.0976 14.6834 11.7071 14.2929L10.4142 13H16C16.5523 13 17 12.5523 17 12C17 11.4477 16.5523 11 16 11H10.4142L11.7071 9.70711C12.0976 9.31658 12.0976 8.68342 11.7071 8.29289C11.3166 7.90237 10.6834 7.90237 10.2929 8.29289L7.29289 11.2929C6.90237 11.6834 6.90237 12.3166 7.29289 12.7071L10.2929 15.7071Z"
        fill="currentColor"
      />
    </svg>

    <span className="text-sm font-medium text-gray-800">Previous</span>
  </button>


  <button
    onClick={next}
    disabled={index === ITEMS.length - 1}
    className="inline-flex items-center gap-2 justify-center rounded-[10px] bg-white px-4 h-10 shadow hover:bg-gray-100 disabled:opacity-40"
  >
    <span className="text-sm font-medium text-gray-800">Next</span>

    <svg className="size-5 text-gray-800" viewBox="0 0 24 24" fill="none">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22ZM13.7071 8.29289C13.3166 7.90237 12.6834 7.90237 12.2929 8.29289C11.9024 8.68342 11.9024 9.31658 12.2929 9.70711L13.5858 11H8C7.44772 11 7 11.4477 7 12C7 12.5523 7.44772 13 8 13H13.5858L12.2929 14.2929C11.9024 14.6834 11.9024 15.3166 12.2929 15.7071C12.6834 16.0976 13.3166 16.0976 13.7071 15.7071L16.7071 12.7071C17.0976 12.3166 17.0976 11.6834 16.7071 11.2929L13.7071 8.29289Z"
        fill="currentColor"
      />
    </svg>
  </button>

</BottomBar>
    </div>
  );
};

export default TopicPage;