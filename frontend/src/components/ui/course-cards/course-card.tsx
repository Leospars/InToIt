import {
  MorphingDialog,
  MorphingDialogTrigger,
  MorphingDialogContent,
  MorphingDialogTitle,
  MorphingDialogSubtitle,
  MorphingDialogClose,
  MorphingDialogContainer,
  useMorphingDialog,

} from '@/components/ui/dialog/morphing-dialog';

import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/context/auth-context';
import { Tables } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';
import { Cpu, BookOpen, Calculator, Globe } from 'lucide-react';
import { useNavigate } from "react-router-dom";

type Course = Tables<"courses">;

function ProgressBar({ value }: { value: number; }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200">
      <div
        className="h-full rounded-full bg-zinc-900"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

function TopicsList({ course }: { course: Course; }) {
  const navigate = useNavigate();
  const { setIsOpen } = useMorphingDialog();
  const { user } = useAuth();

  const { data: courseTopics } = useQuery({
    queryKey: ["courses", user?.id, "topics"],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("course_modules")
        .select()
        .eq("course_id", course.course_id);

      if (error) throw error;

      return data;
    }
  });

  return (
    <div className="space-y-3">
      {courseTopics?.map((topic) => (
        <button
          key={topic.name}
          onClick={() => {
            setIsOpen(false);

            setTimeout(() => {
              navigate(
                `/course/${course.course_id}/topic/${topic.name
                  .toLowerCase()
                  .replace(/\s+/g, "-")}`
              );
            }, 500);
          }}
          className="w-full text-left rounded-2xl border border-zinc-200 bg-white p-4 hover:bg-zinc-50 transition"
        >
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-zinc-800">
              {topic.name}
            </span>

            <span className="text-sm text-zinc-500">
              {0}%
            </span>
          </div>

          <ProgressBar value={0} />
        </button>
      ))}
    </div>
  );
}

function CourseDialog({ course }: { course: Course; }) {
  const Icon = Cpu;

  return (
    <MorphingDialog
      transition={{
        type: 'spring',
        stiffness: 260,
        damping: 26,
      }}
    >
      <MorphingDialogTrigger
        style={{ borderRadius: 16 }}
        className="w-full border border-zinc-200/70 bg-white p-4 text-left shadow-sm"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-100">
              <Icon size={20} className="text-zinc-700" />
            </div>

            <div>
              <MorphingDialogTitle className="text-sm font-semibold text-zinc-900">
                {course.name}
              </MorphingDialogTitle>

              <MorphingDialogSubtitle className="text-sm text-zinc-500">
                {course.course_id}
              </MorphingDialogSubtitle>
            </div>

          </div>

          <p className="text-sm text-zinc-600">
            {course.description}
          </p>

          <div className="space-y-1.5">
            <div className="flex justify-between text-sm text-zinc-500">
              <span>Progress</span>
              <span>{0}%</span>
            </div>

            <ProgressBar value={0} />
          </div>
        </div>
      </MorphingDialogTrigger>

      <MorphingDialogContainer>
        <MorphingDialogContent
          style={{ borderRadius: 24 }}
          className="relative w-[min(92vw,560px)] border border-zinc-200 bg-white shadow-2xl"
        >
          <ScrollArea className="h-[85vh]">
            <div className="p-6 space-y-6">

              <div className="flex gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100">
                  <Icon size={26} className="text-zinc-700" />
                </div>

                <div>
                  <MorphingDialogTitle className="text-xl font-semibold text-zinc-900">
                    {course.name}
                  </MorphingDialogTitle>

                  <MorphingDialogSubtitle className="text-sm text-zinc-500">
                    {course.course_id} ·
                  </MorphingDialogSubtitle>
                </div>
              </div>

              <p className="text-sm text-zinc-700">
                {course.description}
              </p>

              <div>
                <div className="flex justify-between text-sm font-medium">
                  <span>Course Progress</span>
                  <span>{0}%</span>
                </div>

                <ProgressBar value={0} />
              </div>

              <div className="space-y-3">

                <h3 className="text-sm font-semibold text-zinc-900">
                  Topics
                </h3>

                <TopicsList course={course} />

              </div>

            </div>
          </ScrollArea>

          <MorphingDialogClose className="text-zinc-500" />
        </MorphingDialogContent>
      </MorphingDialogContainer>
    </MorphingDialog>
  );
}

export function CoursesList() {
  const { user } = useAuth();

  const { data: courses } = useQuery({
    queryKey: ["courses", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courses")
        .select()
        .eq("creatorId", user!.id);

      if (error) throw error;

      return data;
    }
  });

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {courses?.map((course) => (
        <CourseDialog key={course.id} course={course} />
      ))}
    </div>
  );
}