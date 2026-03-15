import React, { useEffect, useState } from "react";
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
  Flame,
  Zap,
  Clock,
} from "lucide-react";

const API_URL = "https://intoit-rqhi.onrender.com";

const COLORS = ["#22c55e", "#3b82f6", "#f59e0b", "#f97316", "#ef4444"];

const Skeleton = ({ className }: { className?: string }) => (
  <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
);

const StatCardSkeleton = () => (
  <div className="border rounded-xl p-5 bg-white shadow-sm flex items-center gap-4">
    <Skeleton className="w-8 h-8 rounded-lg" />
    <div className="flex flex-col gap-2">
      <Skeleton className="w-20 h-3" />
      <Skeleton className="w-14 h-6" />
    </div>
  </div>
);

const ChartSkeleton = () => (
  <div className="border rounded-xl p-6 bg-white shadow-sm">
    <Skeleton className="w-40 h-4 mb-4" />
    <div className="w-full aspect-[16/9]">
      <Skeleton className="w-full h-full rounded-lg" />
    </div>
  </div>
);

const InsightsSkeleton = () => (
  <div className="border rounded-xl p-6 bg-white shadow-sm">
    <Skeleton className="w-40 h-4 mb-4" />
    <div className="grid md:grid-cols-2 gap-6">
      <div className="space-y-2">
        <Skeleton className="w-20 h-3" />
        <Skeleton className="w-full h-3" />
        <Skeleton className="w-5/6 h-3" />
        <Skeleton className="w-4/6 h-3" />
      </div>
      <div className="space-y-2">
        <Skeleton className="w-20 h-3" />
        <Skeleton className="w-full h-3" />
        <Skeleton className="w-5/6 h-3" />
        <Skeleton className="w-4/6 h-3" />
      </div>
    </div>
  </div>
);


const ChartContainer = ({ children }: { children: React.ReactNode }) => (
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
  value: string | number;
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

const Analytics = ({ userId }: { userId: string }) => {
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState<any>({});
  const [accuracyData, setAccuracyData] = useState<any[]>([]);
  const [topicDifficulty, setTopicDifficulty] = useState<any[]>([]);
  const [topicMastery, setTopicMastery] = useState<any[]>([]);
  const [topicAttempts, setTopicAttempts] = useState<any[]>([]);
  const [scoreDistribution, setScoreDistribution] = useState<any[]>([]);
  const [insights, setInsights] = useState<any>({});

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const res = await fetch(`${API_URL}/api/v1/progress/${userId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId }),
      });

      const data = await res.json();

      const correct = data.answer_stats.total_correct;
      const wrong = data.answer_stats.total_wrong;
      const totalAttempts = correct + wrong;

      setStats({
        attempts: totalAttempts,
        accuracy: data.overall_accuracy,
        xp: data.xp_earned,
        streak: data.streak_days,
        studyTime: data.total_time_spent,
      });

      setAccuracyData([
        {
          name: "Answers",
          correct,
          wrong,
        },
      ]);

      setTopicDifficulty(
        data.topic_progress.map((t: any) => ({
          topic: t.topic_name,
          incorrect: t.recent_wrong_count,
        }))
      );

      setTopicMastery(
        data.topic_progress.map((t: any) => ({
          topic: t.topic_name,
          score: t.best_score,
        }))
      );

      setTopicAttempts(
        data.topic_progress.map((t: any) => ({
          topic: t.topic_name,
          attempts: t.attempts,
        }))
      );

      const score = data.overall_accuracy;

      setScoreDistribution([
        { name: "A", value: score >= 90 ? 1 : 0 },
        { name: "B", value: score >= 80 && score < 90 ? 1 : 0 },
        { name: "C", value: score >= 70 && score < 80 ? 1 : 0 },
        { name: "D", value: score >= 60 && score < 70 ? 1 : 0 },
        { name: "F", value: score < 60 ? 1 : 0 },
      ]);

      setInsights({
        strengths: data.strengths,
        improvements: data.improvement_suggestions,
        struggling: data.struggling_areas,
      });

      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

if (loading)
  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-8 py-10">

      <div className="border-b pb-6 flex flex-col gap-4">
        <Skeleton className="w-40 h-6" />
        <Skeleton className="w-64 h-4" />
      </div>

      {/* STAT CARDS */}

      <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>

      {/* CHARTS */}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ChartSkeleton />
        <ChartSkeleton />
        <ChartSkeleton />
        <ChartSkeleton />
        <div className="md:col-span-2">
          <ChartSkeleton />
        </div>
      </div>

      {/* INSIGHTS */}

      <InsightsSkeleton />

    </div>
  );

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-8 py-10">

      <div className="border-b pb-6 flex flex-col gap-4">
        <h2 className="text-2xl font-semibold tracking-tight">Analytics</h2>
        <p className="text-gray-600">
          Monitor engagement and learning performance.
        </p>
      </div>

      {/* STATS */}

      <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
        <StatCard icon={ClipboardList} label="Attempts" value={stats.attempts} />
        <StatCard icon={CheckCircle} label="Accuracy" value={`${stats.accuracy?.toFixed(1)}%`} />
        <StatCard icon={Zap} label="XP Earned" value={stats.xp} />
        <StatCard icon={Flame} label="Streak" value={`${stats.streak} days`} />
        <StatCard icon={Clock} label="Study Time" value={`${stats.studyTime} min`} />
      </div>

      {/* CHARTS */}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* ACCURACY */}

        <div className="border rounded-xl p-6 bg-white shadow-sm">
          <h3 className="font-semibold mb-4">Answer Accuracy</h3>
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

        {/* STRUGGLE TOPICS */}

        <div className="border rounded-xl p-6 bg-white shadow-sm">
          <h3 className="font-semibold mb-4">Topics Students Struggle With</h3>
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

        {/* TOPIC MASTERY */}

        <div className="border rounded-xl p-6 bg-white shadow-sm">
          <h3 className="font-semibold mb-4">Topic Mastery</h3>
          <ChartContainer>
            <BarChart data={topicMastery}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="topic" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="score" fill="#3b82f6" />
            </BarChart>
          </ChartContainer>
        </div>

        {/* ATTEMPTS PER TOPIC */}

        <div className="border rounded-xl p-6 bg-white shadow-sm">
          <h3 className="font-semibold mb-4">Attempts per Topic</h3>
          <ChartContainer>
            <AreaChart data={topicAttempts}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="topic" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="attempts" stroke="#6366f1" fill="#c7d2fe" />
            </AreaChart>
          </ChartContainer>
        </div>

   

        <div className="border rounded-xl p-6 bg-white shadow-sm col-span-2">
          <h3 className="font-semibold mb-4">Score Distribution</h3>
          <ChartContainer>
            <PieChart>
              <Pie data={scoreDistribution} dataKey="value" nameKey="name" outerRadius="80%">
                {scoreDistribution.map((_: any, i: number) => (
                  <Cell key={i} fill={COLORS[i]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ChartContainer>
        </div>

      </div>



      <div className="border rounded-xl p-6 bg-white shadow-sm">
        <h3 className="font-semibold mb-4">Learning Insights</h3>

        <div className="grid md:grid-cols-2 gap-6 text-sm">

          <div>
            <h4 className="font-medium mb-2">Strengths</h4>
            <ul className="list-disc pl-5 text-gray-600">
              {insights.strengths?.map((s: string, i: number) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-medium mb-2">Suggestions</h4>
            <ul className="list-disc pl-5 text-gray-600">
              {insights.improvements?.map((s: string, i: number) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>

        </div>
      </div>

    </div>
  );
};

export default Analytics;