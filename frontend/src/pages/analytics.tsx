import React from "react";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import {
  TrendingUp,
  BarChart3,
  Activity,
  BookOpen,
  PieChart as PieIcon,
  Users,
  ClipboardList,
  CheckCircle,
  Award,
} from "lucide-react";

const completionData = [
  { day: "Mon", completion: 20 },
  { day: "Tue", completion: 32 },
  { day: "Wed", completion: 45 },
  { day: "Thu", completion: 55 },
  { day: "Fri", completion: 61 },
  { day: "Sat", completion: 70 },
  { day: "Sun", completion: 78 },
];

const accuracyData = [
  { name: "Quiz 1", correct: 120, wrong: 40 },
  { name: "Quiz 2", correct: 98, wrong: 60 },
  { name: "Quiz 3", correct: 86, wrong: 70 },
  { name: "Quiz 4", correct: 150, wrong: 30 },
];

const topicDifficulty = [
  { topic: "Binary Math", incorrect: 42 },
  { topic: "Recurrence", incorrect: 38 },
  { topic: "CPU Architecture", incorrect: 29 },
  { topic: "Logic Gates", incorrect: 14 },
];

const activityData = [
  { time: "9AM", attempts: 20 },
  { time: "10AM", attempts: 45 },
  { time: "11AM", attempts: 60 },
  { time: "12PM", attempts: 72 },
  { time: "1PM", attempts: 55 },
  { time: "2PM", attempts: 80 },
];

const scoreDistribution = [
  { name: "A", value: 34 },
  { name: "B", value: 28 },
  { name: "C", value: 20 },
  { name: "D", value: 12 },
  { name: "F", value: 6 },
];

const COLORS = ["#22c55e", "#3b82f6", "#f59e0b", "#f97316", "#ef4444"];

const ChartContainer = ({ children }: { children: React.ReactNode; }) => (
  <div className="w-full aspect-[16/9]">
    <ResponsiveContainer width="100%" height="100%">
      {children}
    </ResponsiveContainer>
  </div>
);

const StatCard = ({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: string;
}) => (
  <div className="border rounded-xl p-5 bg-white shadow-sm flex items-center gap-4">
    <div className="p-2 rounded-lg bg-gray-100">
      <Icon size={18} className="text-gray-700" />
    </div>

    <div>
      <p className="text-gray-500 text-sm">{label}</p>
      <p className="text-2xl font-semibold">{value}</p>
    </div>
  </div>
);

const Analytics = () => {
  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-8 py-10">
      <div className="border-b pb-6 flex flex-col gap-4 ">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white shadow">
          <BarChart3 size={18} className="text-gray-500" />
        </div>

        <h2 className="text-2xl font-semibold tracking-tight">Analytics</h2>
        <p className="text-gray-600">
          Monitor engagement, track performance, and analyze learning outcomes.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard icon={Users} label="Total Users" value="12,431" />

        <StatCard icon={ClipboardList} label="Quiz Attempts" value="4,210" />

        <StatCard icon={CheckCircle} label="Completion Rate" value="78%" />

        <StatCard icon={Award} label="Average Score" value="84%" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="col-span-2 border rounded-xl p-6 bg-white shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={18} />
            <h3 className="font-semibold">Course Completion Trend</h3>
          </div>

          <ChartContainer>
            <AreaChart data={completionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="completion"
                stroke="#3b82f6"
                fill="#93c5fd"
              />
            </AreaChart>
          </ChartContainer>
        </div>

        <div className="col-span-2 border rounded-xl p-6 bg-white shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 size={18} />
            <h3 className="font-semibold">Answer Accuracy</h3>
          </div>

          <ChartContainer>
            <BarChart data={accuracyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="correct" fill="#22c55e" />
              <Bar dataKey="wrong" fill="#ef4444" />
            </BarChart>
          </ChartContainer>
        </div>

        <div className="col-span-2 border rounded-xl p-6 bg-white shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen size={18} />
            <h3 className="font-semibold">Topics Students Struggle With</h3>
          </div>

          <ChartContainer>
            <BarChart data={topicDifficulty}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="topic" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="incorrect" fill="#f97316" />
            </BarChart>
          </ChartContainer>
        </div>

        <div className="col-span-2 border rounded-xl p-6 bg-white shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Activity size={18} />
            <h3 className="font-semibold">Quiz Activity Today</h3>
          </div>

          <ChartContainer>
            <AreaChart data={activityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="attempts"
                stroke="#6366f1"
                fill="#c7d2fe"
              />
            </AreaChart>
          </ChartContainer>
        </div>

        <div className="col-span-2 border rounded-xl p-6 bg-white shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <PieIcon size={18} />
            <h3 className="font-semibold">Score Distribution</h3>
          </div>

          <ChartContainer>
            <PieChart>
              <Pie
                data={scoreDistribution}
                dataKey="value"
                nameKey="name"
                outerRadius="80%"
              >
                {scoreDistribution.map((_, index) => (
                  <Cell key={index} fill={COLORS[index]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ChartContainer>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
