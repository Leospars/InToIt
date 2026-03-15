import { useParams, useNavigate } from "react-router-dom";
import { Layers } from "lucide-react";

const TopicPage = () => {
  const { courseId, topicId } = useParams();
  const navigate = useNavigate();

  const topicName = topicId?.replace(/-/g, " ");

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-8 py-10">

     
      <div className="border-b pb-6 flex flex-col gap-4">

        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white shadow">
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

     



    </div>
  );
};

export default TopicPage;