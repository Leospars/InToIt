import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../dialog/dialog";
import { useAuth } from "@/context/auth-context";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export function CreateCourseDialog() {
  const [courseName, setCourseName] = useState("");
  const [courseId, setCourseId] = useState("");
  const [open, setOpen] = useState(false);

  const { user } = useAuth();
  const queryClient = useQueryClient();

  const createCourse = useMutation({
    mutationFn: async () => {
      if (!user) return;

      await supabase.from("courses").insert({
        name: courseName,
        course_id: courseId,
        creatorId: user?.id
      }).select();
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses", user?.id] });
      setOpen(false);
    }
  });

  const handleSubmit = async () => {
    await createCourse.mutateAsync();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="inline-flex items-center justify-center bg-gray-950 text-gray-50 h-8 rounded-lg px-3 text-sm w-full">
        + Create
      </DialogTrigger>
      <DialogContent className="w-full max-w-md bg-white p-6 dark:bg-zinc-900">
        <DialogHeader>
          <DialogTitle>Create Course</DialogTitle>
        </DialogHeader>

        <div className='flex flex-col space-y-1.5'>
          <label htmlFor='courseId' className='text-sm font-medium text-zinc-700 dark:text-zinc-300'>
            Course ID
          </label>
          <input
            id='courseId'
            placeholder='Enter course ID'
            value={courseId}
            onChange={e => setCourseId(e.target.value)}
            className='h-9 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-hidden focus:ring-2 focus:ring-black/5 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:focus:ring-white/5'
          />
        </div>

        <div className='flex flex-col space-y-1.5'>
          <label htmlFor='courseName' className='text-sm font-medium text-zinc-700 dark:text-zinc-300'>
            Course Name
          </label>
          <input
            id='courseName'
            placeholder='Enter course name'
            value={courseName}
            onChange={e => setCourseName(e.target.value)}
            className='h-9 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-hidden focus:ring-2 focus:ring-black/5 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:focus:ring-white/5'
          />
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={createCourse.isPending}
          className="inline-flex items-center justify-center w-full rounded-lg bg-black px-4 py-2 text-sm font-medium text-zinc-50 hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
        >
          Create
        </button>
      </DialogContent>
    </Dialog>
  );
}