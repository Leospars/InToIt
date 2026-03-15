import {
  MorphingDialog,
  MorphingDialogTrigger,
  MorphingDialogContent,
  MorphingDialogTitle,
  MorphingDialogSubtitle,
  MorphingDialogClose,
  MorphingDialogContainer,
} from '@/components/ui/dialog/morphing-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Cpu, BookOpen, Calculator, Globe } from 'lucide-react';

type Topic = {
  title: string;
  progress: number;
};

type Course = {
  code: string;
  name: string;
  lecturer: string;
  description: string;
  icon: React.ElementType;
  progress: number;
  topics: Topic[];
};

const COURSES: Course[] = [
  {
    code: 'COMP2140',
    name: 'Computer Architecture',
    lecturer: 'Dr. Thompson',
    description:
      'Learn how processors work including instruction cycles, ALUs, control units, and memory hierarchy.',
    icon: Cpu,
    progress: 65,
    topics: [
      { title: 'CPU Architecture', progress: 100 },
      { title: 'Instruction Cycle', progress: 90 },
      { title: 'Registers and Buses', progress: 80 },
      { title: 'ALU Operations', progress: 60 },
      { title: 'Control Units', progress: 40 },
      { title: 'Memory Hierarchy', progress: 20 },
    ],
  },
  {
    code: 'COMP2190',
    name: 'Algorithms & Data Structures',
    lecturer: 'Dr. Blake',
    description:
      'Explore algorithm analysis, recurrence relations, sorting algorithms, and graph theory.',
    icon: BookOpen,
    progress: 45,
    topics: [
      { title: 'Recurrence Relations', progress: 80 },
      { title: 'Master Theorem', progress: 70 },
      { title: 'Sorting Algorithms', progress: 40 },
      { title: 'Graph Algorithms', progress: 20 },
      { title: 'Dynamic Programming', progress: 10 },
    ],
  },
  {
    code: 'ECON2001',
    name: 'Intermediate Microeconomics',
    lecturer: 'Dr. Campbell',
    description:
      'Study consumer behavior, firm production, market equilibrium and monopoly pricing.',
    icon: Calculator,
    progress: 30,
    topics: [
      { title: 'Consumer Theory', progress: 70 },
      { title: 'Utility Maximization', progress: 60 },
      { title: 'Production Functions', progress: 30 },
      { title: 'Cost Curves', progress: 20 },
      { title: 'Market Equilibrium', progress: 10 },
    ],
  },
  {
    code: 'GEOG1100',
    name: 'Geography of the Caribbean',
    lecturer: 'Dr. Lewis',
    description:
      'Analyze climate systems, population distribution, and economic development across the Caribbean.',
    icon: Globe,
    progress: 55,
    topics: [
      { title: 'Physical Geography', progress: 90 },
      { title: 'Climate Systems', progress: 70 },
      { title: 'Population Distribution', progress: 50 },
      { title: 'Urban Development', progress: 30 },
      { title: 'Regional Trade', progress: 20 },
    ],
  },
];

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200">
      <div
        className="h-full rounded-full bg-zinc-900"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

function CourseDialog({ course }: { course: Course }) {
  const Icon = course.icon;

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
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-zinc-100">
              <Icon size={20} className="text-zinc-700" />
            </div>

            <div className="min-w-0 flex-1">
              <MorphingDialogTitle className="truncate text-sm font-semibold text-zinc-900">
                {course.name}
              </MorphingDialogTitle>

              <MorphingDialogSubtitle className="mt-0.5 text-sm text-zinc-500">
                {course.code}
              </MorphingDialogSubtitle>
            </div>
          </div>

          <p className="line-clamp-2 text-sm leading-5 text-zinc-600">
            {course.description}
          </p>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-sm text-zinc-500">
              <span >Progress</span>
              <span>{course.progress}%</span>
            </div>
            <ProgressBar value={course.progress} />
          </div>
        </div>
      </MorphingDialogTrigger>

      <MorphingDialogContainer>
        <MorphingDialogContent
          style={{ borderRadius: 24 }}
          className="relative w-[min(92vw,560px)] overflow-hidden border border-zinc-200 bg-white shadow-2xl"
        >
          <div className="max-h-[85vh] overflow-hidden">
            <ScrollArea className="h-[85vh]" type="scroll">
              <div className="p-6">
                <div className="space-y-6">
                  <div className="flex items-start gap-4 pr-10">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-zinc-100">
                      <Icon size={26} className="text-zinc-700" />
                    </div>

                    <div className="min-w-0">
                      <MorphingDialogTitle className="text-xl font-semibold text-zinc-900">
                        {course.name}
                      </MorphingDialogTitle>

                      <MorphingDialogSubtitle className="mt-1 text-sm text-zinc-500">
                        {course.code} · {course.lecturer}
                      </MorphingDialogSubtitle>
                    </div>
                  </div>

                  <p className="text-sm leading-6 text-zinc-700">
                    {course.description}
                  </p>

                  <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                    <div className="mb-2 flex items-center justify-between text-sm font-medium text-zinc-800">
                      <span>Course Progress</span>
                      <span>{course.progress}%</span>
                    </div>
                    <ProgressBar value={course.progress} />
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-zinc-900">
                      Topics
                    </h3>

                    <div className="space-y-3">
                      {course.topics.map((topic) => (
                        <div
                          key={topic.title}
                          className="rounded-2xl border border-zinc-200 bg-white p-4"
                        >
                          <div className="mb-2 flex items-center justify-between gap-3">
                            <span className="text-sm font-medium text-zinc-800">
                              {topic.title}
                            </span>
                            <span className="text-sm text-zinc-500">
                              {topic.progress}%
                            </span>
                          </div>

                          <ProgressBar value={topic.progress} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </div>

          <MorphingDialogClose className="text-zinc-500" />
        </MorphingDialogContent>
      </MorphingDialogContainer>
    </MorphingDialog>
  );
}

export function CoursesList() {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {COURSES.map((course) => (
        <CourseDialog key={course.code} course={course} />
      ))}
    </div>
  );
}