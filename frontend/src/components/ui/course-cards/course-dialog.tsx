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
      <DialogTrigger  className="inline-flex shrink-0 touch-manipulation select-none items-center justify-center whitespace-nowrap font-medium transition-[color,background-color,border-color,fill,box-shadow,scale] duration-150 ease-out will-change-transform active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0 bg-gray-950 text-gray-50 h-10 gap-1.5 rounded-[10px] px-4 text-sm pr-4 pl-3"
  data-slot="button">
         <svg
    aria-hidden="true"
    className="size-5 text-gray-50"
    width="24px"
    height="24px"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12ZM16 12.9999C16.5523 12.9999 17 12.5522 17 11.9999C17 11.4476 16.5523 10.9999 16 10.9999L13 11V8.00012C13 7.44784 12.5523 7.00012 12 7.00012C11.4477 7.00012 11 7.44784 11 8.00012V11L7.99997 11.0001C7.44769 11.0001 6.99998 11.4479 7 12.0001C7.00002 12.5524 7.44774 13.0001 8.00003 13.0001L11 13V16C11 16.5523 11.4477 17 12 17C12.5523 17 13 16.5523 13 16V13L16 12.9999Z"
      fill="currentColor"
    />
  </svg>
  Create

      </DialogTrigger>
<DialogContent className="w-full max-w-md bg-white p-6 dark:bg-zinc-900">
  <DialogHeader>
    <DialogTitle>Create Course</DialogTitle>
  </DialogHeader>

  <div className="flex flex-col gap-4 mt-4">
    <div className='flex flex-col space-y-2'>
      <label
        htmlFor='courseId'
        className='text-sm font-medium text-zinc-700 dark:text-zinc-300'
      >
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

    <div className='flex flex-col space-y-2'>
      <label
        htmlFor='courseName'
        className='text-sm font-medium text-zinc-700 dark:text-zinc-300'
      >
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
      className="inline-flex items-center justify-center w-full rounded-lg bg-black px-4 py-2 text-sm font-medium text-zinc-50 hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 mt-2"
    >
      Create
    </button>
  </div>
</DialogContent>
    </Dialog>
  );
}