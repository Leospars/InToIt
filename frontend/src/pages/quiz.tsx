import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { JAMAICA_HISTORY } from "../data/question-1";
import { Popover } from "@base-ui/react/popover";
import NumberFlow from "@number-flow/react";
import BottomBar from "@/components/bottom-navbar";
import { Button } from "@/components/ui/button";
import { BookOpen } from "lucide-react";

type Question = {
  question: string;
  options: string[];
  answer: string;
};

const Quiz = () => {
  const questions: Question[] = JAMAICA_HISTORY.questions;

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [previousAnswer, setPreviousAnswer] = useState<number | null>(null);
  const [isAlreadyAnswered, setIsAlreadyAnswered] = useState<boolean>(false);

  const [direction, setDirection] = useState<number>(1);

  const [goToPopoverOpen, setGoToPopoverOpen] = useState(false);

  const [showProgressRestored] = useState(false);
  const [showProgressDeleted] = useState(false);

  const [isPracticeMode] = useState(false);
  const [, setSummaryDrawerOpen] = useState(false);

  const currentQuestion = questions[currentIndex];

  const correctAnswerIndex = currentQuestion.options.findIndex(
    (opt) => opt === currentQuestion.answer,
  );

  const isLastQuestion = currentIndex === questions.length - 1;

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 20 : -20,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 20 : -20,
      opacity: 0,
      scale: 0.98,
      transition: { duration: 0.075 },
    }),
  };

  const handleOptionClick = (index: number) => {
    if (selectedAnswer !== null) return;

    setSelectedAnswer(index);
    setPreviousAnswer(index);
    setIsAlreadyAnswered(true);
  };

  const handleNext = () => {
    if (isLastQuestion) return;

    setDirection(1);
    setCurrentIndex((prev) => prev + 1);

    setSelectedAnswer(null);
    setIsAlreadyAnswered(false);
  };

  const handlePrevious = () => {
    if (currentIndex === 0) return;

    setDirection(-1);
    setCurrentIndex((prev) => prev - 1);

    setSelectedAnswer(null);
    setIsAlreadyAnswered(false);
  };

  return (
    <div className="flex flex-col items-center w-full max-w-5xl mx-auto  h-full  gap-10 py-10">


      <div className="border-b pb-6 flex flex-col gap-4 w-full">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white shadow">
          <BookOpen size={18} className="text-gray-500" />
        </div>

        <h2 className="text-2xl font-semibold tracking-tight">Quiz</h2>

        <p className="text-gray-600">
         Take quizzes for each topic, check your understanding, and track your progress over time.
        </p>
      </div>

      <div className="w-full">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25 }}
            className="space-y-4"
          >
            <h2 className="text-[0.92rem] md:text-xl font-medium leading-normal mb-6 md:mb-7">
              {currentQuestion.question}
            </h2>

            <div className="grid gap-2 md:gap-3">
              {currentQuestion.options.map((option, index) => {
                const isSelected = selectedAnswer === index;
                const isCorrect = index === correctAnswerIndex;

                const wasPreviouslySelected = previousAnswer === index;
                const previousWasCorrect =
                  previousAnswer === correctAnswerIndex;

                const showCorrect =
                  (selectedAnswer !== null && isCorrect) ||
                  (isAlreadyAnswered && isCorrect);

                const showIncorrect =
                  (selectedAnswer !== null && isSelected && !isCorrect) ||
                  (isAlreadyAnswered &&
                    wasPreviouslySelected &&
                    !previousWasCorrect);

                let buttonClass = "button-3";

                if (showCorrect) buttonClass = "button-correct";
                else if (showIncorrect) buttonClass = "button-incorrect";

                const isClickable =
                  !isAlreadyAnswered && selectedAnswer === null;

                return (
                  <div
                    key={index}
                    onClick={() => handleOptionClick(index)}
                    className={`flex items-center gap-3 px-3 py-2.5 font-medium ${buttonClass} rounded-lg transition-colors ${
                      isClickable ? "cursor-pointer" : "cursor-default"
                    }`}
                  >
                    <div className="border-[2.5px] border-[#f3f3f3] text-gray-300 font-semibold flex items-center justify-center size-8 rounded-lg shrink-0">
                      {String.fromCharCode(65 + index)}
                    </div>

                    <p className="text-[0.9rem] md:text-base">{option}</p>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <BottomBar className="flex justify-center items-center gap-3">
        <div
          className="flex justify-center items-center gap-4  mt-auto w-full  mx-auto"
          style={{ fontWeight: 700 }}
        >
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className="inline-flex items-center gap-2 justify-center rounded-[10px] px-4 h-10 shadow"
          >
            Prev
          </Button>

          <div className="relative hidden md:flex flex-col items-center">
            <AnimatePresence>
              {showProgressRestored && (
                <motion.div
                  initial={{
                    y: 6,
                    opacity: 0,
                    scale: 0.9,
                    filter: "blur(1.5px)",
                  }}
                  animate={{ y: 0, opacity: 1, scale: 1, filter: "blur(0px)" }}
                  exit={{ y: 9, opacity: 0, scale: 0.85, filter: "blur(2px)" }}
                  transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
                  className="absolute -top-14 text-sm font-medium text-blue-600 whitespace-nowrap"
                >
                  Progress Restored
                </motion.div>
              )}

              {showProgressDeleted && (
                <motion.div
                  initial={{
                    y: 6,
                    opacity: 0,
                    scale: 0.9,
                    filter: "blur(1.5px)",
                  }}
                  animate={{ y: 0, opacity: 1, scale: 1, filter: "blur(0px)" }}
                  exit={{ y: 9, opacity: 0, scale: 0.85, filter: "blur(2px)" }}
                  transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
                  className="absolute -top-14 text-sm font-medium text-red-600 whitespace-nowrap"
                >
                  Progress Deleted
                </motion.div>
              )}
            </AnimatePresence>

            <Popover.Root
              open={goToPopoverOpen}
              onOpenChange={setGoToPopoverOpen}
            >
              <Popover.Trigger
                id="progress-container"
                className="font-semibold tabular-nums opacity-70 w-20 flex items-center justify-center cursor-pointer"
              >
                <NumberFlow
                  value={currentIndex + 1}
                  transformTiming={{
                    duration: 260,
                    easing:
                      "linear(0, 0.0018, 0.0069 1.16%, 0.0262 2.32%, 0.0642, 0.1143 5.23%, 0.2244 7.84%, 0.5881 15.68%, 0.6933, 0.7839, 0.8591, 0.9191 26.13%, 0.9693, 1.0044 31.93%, 1.0234, 1.0358 36.58%, 1.0434 39.19%, 1.046 42.39%, 1.0446 44.71%, 1.0404 47.61%, 1.0118 61.84%, 1.0028 69.39%, 0.9981 80.42%, 0.9991 99.87%)",
                  }}
                />
                <span className="ml-1 mr-2 opacity-30">/</span>
                {questions.length}
              </Popover.Trigger>

              <Popover.Portal>
                <Popover.Positioner side="top" sideOffset={14}>
                  <Popover.Popup className="bg-white rounded-lg shadow-lg border border-gray-200 px-3.5 py-2">
                    <div className="font-semibold text-sm">
                      Go to{" "}
                      <input
                        autoFocus
                        className="border ml-1 rounded-sm px-1 py-0.5 focus:outline-none min-w-4"
                        min={1}
                        max={questions.length}
                        style={{ fieldSizing: "content" }}
                        onBlur={() => setGoToPopoverOpen(false)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            const value = parseInt(
                              (e.target as HTMLInputElement).value,
                              10,
                            );
                            if (
                              !isNaN(value) &&
                              value >= 1 &&
                              value <= questions.length
                            ) {
                              setCurrentIndex(value - 1);
                              setGoToPopoverOpen(false);
                            }
                          }
                        }}
                      />
                    </div>
                  </Popover.Popup>
                </Popover.Positioner>
              </Popover.Portal>
            </Popover.Root>

            <div
              id="progress-container-mobile"
              className="font-semibold tabular-nums opacity-70 w-20 flex md:hidden items-center justify-center"
            >
              <NumberFlow value={currentIndex + 1} />
              <span className="ml-1 mr-2 opacity-30">/</span>
              {questions.length}
            </div>
          </div>

          <Button
            variant="outline"
            onClick={
              isLastQuestion && !isPracticeMode
                ? () => setSummaryDrawerOpen(true)
                : handleNext
            }
            disabled={isLastQuestion && isPracticeMode}
            className="inline-flex items-center gap-2 justify-center rounded-[10px] px-4 h-10 shadow"
          >
            {isLastQuestion && !isPracticeMode ? "Summary" : "Next"}
          </Button>
        </div>
      </BottomBar>
    </div>
  );
};

export default Quiz;
