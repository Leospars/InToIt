import { Layers } from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

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

import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { axiosInstance } from "@/utils/axios";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";

function PopoverActions() {
  const navigate = useNavigate();
  const { courseId, topicId } = useParams();
  const { close } = useMorphingPopover();

  const goToQuiz = () => {
    close();
    navigate(`/course/${courseId}/topic/${topicId}/quiz/1`);
  };

  const goToLive = () => {
    close();
    navigate(`/live-chat`);
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

      <Button variant="outline" className="w-full" onClick={goToLive}>
        Prompt AI
      </Button>
    </div>
  );
}

const TopicPage = () => {
  const { topicId, courseId } = useParams();
  const topicName = topicId?.replace(/-/g, " ");

  const { user } = useAuth();

  const difficulty = "medium";
  const { data: cardsRes } = useQuery({
    queryKey: ["courses", user?.id, courseId, topicId, difficulty],
    enabled: !!user,
    queryFn: async () => await axiosInstance
      .post(`/api/generate/flashcards`, {
        topic: topicName,
        num_cards: 5,
      })
      .then(res => JSON.parse(res.data) as { flashcards: { front: string, back: string; }[]; })
  });

  const [index, setIndex] = useState(0);
  const [flippedCards, setFlippedCards] = useState<Set<number>>(new Set());

  const toggleFlip = (cardIndex: number) => {
    setFlippedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(cardIndex)) {
        newSet.delete(cardIndex);
      } else {
        newSet.add(cardIndex);
      }
      return newSet;
    });
  };

  const prev = () => {
    if (index > 0) {
      setIndex(index - 1);
    }
  };

  const handleNext = (e: React.MouseEvent) => {
    if (!cardsRes) return;

    if (index < cardsRes.flashcards.length - 1) {
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
            {cardsRes?.flashcards.map((item, cardIndex) => (
              <CarouselItem key={cardIndex} className="flex justify-center px-4">
                <div
                  className="relative w-full max-w-3xl aspect-[16/9] cursor-pointer"
                  style={{ perspective: '1000px' }}
                  onClick={() => toggleFlip(cardIndex)}
                >
                  <motion.div
                    className="absolute inset-0 rounded-xl border border-zinc-200 bg-white shadow-sm transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950 flex items-center justify-center p-6"
                    initial={false}
                    animate={{ rotateY: flippedCards.has(cardIndex) ? 180 : 0 }}
                    transition={{ duration: 0.6 }}
                    style={{ transformStyle: 'preserve-3d' }}
                  >
                    <div
                      className="absolute inset-0 flex items-center justify-center text-center text-2xl font-semibold"
                      style={{ backfaceVisibility: 'hidden' }}
                    >
                      {item.front}
                    </div>
                    <div
                      className="absolute inset-0 flex items-center justify-center text-center text-2xl font-semibold"
                      style={{ transform: 'rotateY(180deg)', backfaceVisibility: 'hidden' }}
                    >
                      {item.back}
                    </div>
                  </motion.div>
                  <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-sm text-gray-500">
                    Click to flip
                  </div>
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