import { useParams, useNavigate } from "react-router-dom";
import { Layers } from "lucide-react";
import { useState } from "react";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel/carousel";

import BottomBar from "@/components/bottom-navbar";

import {
  MorphingPopover,
  MorphingPopoverContent,
  MorphingPopoverTrigger,
  useMorphingPopover,
} from "@/components/ui/popover/morphing-popover";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

function PopoverActions() {
  const navigate = useNavigate();
  const { courseId, topicId } = useParams();
  const { close } = useMorphingPopover();

  const goToQuiz = () => {
    close();
    navigate(`/course/${courseId}/topic/${topicId}/quiz/1`);
  };

  return (
    <div className="flex flex-col gap-3">
      <motion.div
        layoutId="topic-next-button"
        className="text-sm font-semibold text-center"
      >
        Finished
      </motion.div>

      <Button variant="outline" className="w-full" onClick={goToQuiz}>
        Quiz
      </Button>

      <Button className="w-full">Prompt AI</Button>
    </div>
  );
}

const TopicPage = () => {
  const { topicId } = useParams();
  const topicName = topicId?.replace(/-/g, " ");

  const ITEMS = new Array(4).fill(null).map((_, index) => index + 1);

  const [index, setIndex] = useState(0);

  const prev = () => {
    if (index > 0) {
      setIndex(index - 1);
    }
  };

  const handleNext = (e: React.MouseEvent) => {
    if (index < ITEMS.length - 1) {
      e.preventDefault();
      e.stopPropagation();
      setIndex((prev) => prev + 1);
    }
  };

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 py-10 pb-28">

 
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
          <span className="text-sm font-medium text-gray-800">
            Previous
          </span>
        </button>

      
        <MorphingPopover
          variants={{
            initial: { opacity: 0, filter: "blur(10px)" },
            animate: { opacity: 1, filter: "blur(0px)" },
            exit: { opacity: 0, filter: "blur(10px)" },
          }}
          transition={{
            duration: 0.25,
            ease: "easeOut",
          }}
        >
          <MorphingPopoverTrigger asChild>
            <Button
              variant="outline"
              onClick={handleNext}
              className="inline-flex items-center gap-2 justify-center rounded-[10px] px-4 h-10 shadow"
            >
              <motion.span
                layoutId="topic-next-button"
                layout="position"
                className="flex gap-2"
              >
                Next
              </motion.span>
            </Button>
          </MorphingPopoverTrigger>

          <MorphingPopoverContent className="w-56 p-3 shadow-sm">
            <PopoverActions />
          </MorphingPopoverContent>

        </MorphingPopover>

      </BottomBar>
    </div>
  );
};

export default TopicPage;