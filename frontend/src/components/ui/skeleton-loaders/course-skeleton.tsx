export function CourseCardSkeleton() {
  return (
    <div className="w-full border border-zinc-200/70 bg-white p-4 shadow-sm rounded-[16px]">
      <div className="space-y-4 animate-pulse">
        <div className="flex items-start gap-3">

          <div className="h-11 w-11 rounded-xl bg-zinc-200" />

          <div className="space-y-2">
            <div className="h-4 w-32 rounded bg-zinc-200" />
            <div className="h-3 w-20 rounded bg-zinc-200" />
          </div>

        </div>

        <div className="h-3 w-full rounded bg-zinc-200" />

        <div className="space-y-1.5">
          <div className="flex justify-between">
            <div className="h-3 w-16 rounded bg-zinc-200" />
            <div className="h-3 w-8 rounded bg-zinc-200" />
          </div>

          <div className="h-2 w-full rounded-full bg-zinc-200" />
        </div>
      </div>
    </div>
  );
}