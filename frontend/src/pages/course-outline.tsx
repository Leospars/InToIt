import { CoursesList } from "@/components/ui/course-cards/course-card";
import { CreateCourseDialog } from "@/components/ui/course-cards/course-dialog";
import { BookOpen } from "lucide-react";

const CourseOutline = () => {
  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-10 py-10">

      <div className="border-b pb-6 flex flex-col gap-4">


        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white shadow">
          <BookOpen size={18} className="text-gray-500" />
        </div>


        <h2 className="text-2xl font-semibold tracking-tight">
          <CreateCourseDialog />
          Courses
        </h2>


        <p className="text-gray-600">
          Access your courses, follow the curriculum, and keep track of your learning progress.
        </p>

      </div>

      <CoursesList />

    </div>
  );
};

export default CourseOutline;